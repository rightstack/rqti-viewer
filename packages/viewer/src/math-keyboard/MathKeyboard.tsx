import {
  Fragment,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ElementType,
} from "react";
import "mathlive";
import { convertLatexToMarkup } from "mathlive";
import { cn } from "../lib/utils";
import { firstCorrectAnswerLatex, resolveMathTab } from "./resolveMathTab";
import { type MathKey, type MathTab } from "./mathSymbols";
import { MATH_LEVEL_CONFIG, type MathLevel } from "./mathLevels";

const MathField = "math-field" as unknown as ElementType;

type MathFieldEl = HTMLElement & {
  value: string;
  mathVirtualKeyboardPolicy?: string;
  focus: () => void;
  insert: (latex: string, options?: Record<string, unknown>) => void;
  executeCommand: (command: string | [string, ...unknown[]]) => void;
};

/** 우측 고정 키패드: 숫자/사칙연산/관계/등호/백스페이스/엔터. */
type RightKey = {
  id: string;
  label: string;
  /** math-field.insert에 넘길 LaTeX */
  insert?: string;
  /** math-field.executeCommand로 실행할 명령 */
  command?: string;
  /** 엔터: onSubmit 콜백 실행 */
  enter?: boolean;
};

const RIGHT_KEYS: readonly RightKey[] = [
  { id: "7", label: "7", insert: "7" },
  { id: "8", label: "8", insert: "8" },
  { id: "9", label: "9", insert: "9" },
  { id: "div", label: "÷", insert: "\\div" },
  { id: "4", label: "4", insert: "4" },
  { id: "5", label: "5", insert: "5" },
  { id: "6", label: "6", insert: "6" },
  { id: "times", label: "×", insert: "\\times" },
  { id: "1", label: "1", insert: "1" },
  { id: "2", label: "2", insert: "2" },
  { id: "3", label: "3", insert: "3" },
  { id: "minus", label: "−", insert: "-" },
  { id: "0", label: "0", insert: "0" },
  { id: "dot", label: ".", insert: "." },
  { id: "eq", label: "=", insert: "=" },
  { id: "plus", label: "+", insert: "+" },
  { id: "lt", label: "<", insert: "<" },
  { id: "gt", label: ">", insert: ">" },
  { id: "backspace", label: "⌫", command: "deleteBackward" },
  { id: "enter", label: "↵", enter: true },
];

/** 그룹 내 최대 열 수 기본값(레벨별 config.maxGroupCols로 덮어씀). */
const DEFAULT_MAX_GROUP_COLS = 4;

interface GroupLayout {
  name: string;
  cols: number;
  rows: number;
  keys: MathKey[];
}

/**
 * 탭의 키를 group 필드 기준으로 묶고, 각 그룹을 독립 블록으로 배치한다.
 * - 열 우선(세로)으로 채운다: 항목이 적은 그룹은 세로 1열로 쌓여 폭을 아낀다.
 * - 행 수는 maxGroupRows를 넘지 않도록 하되 균형 있게 계산(레벨별 설정).
 * - 각 그룹은 자기 항목 수만큼의 높이만 가진다(빈 칸 패딩 없음).
 */
function layoutGroups(
  keys: readonly MathKey[],
  maxGroupRows: number,
  maxGroupCols: number = DEFAULT_MAX_GROUP_COLS,
): GroupLayout[] {
  const groups: { name: string; keys: MathKey[] }[] = [];
  const indexByName = new Map<string, number>();
  for (const item of keys) {
    const name = item.group ?? "";
    let idx = indexByName.get(name);
    if (idx === undefined) {
      idx = groups.length;
      indexByName.set(name, idx);
      groups.push({ name, keys: [] });
    }
    groups[idx].keys.push(item);
  }
  return groups.map((group) => {
    const n = group.keys.length;
    // 열은 maxGroupCols를 넘지 않는다. 초과분은 행을 늘려 수용한다.
    let cols = Math.min(maxGroupCols, Math.max(1, Math.ceil(n / maxGroupRows)));
    let rows = Math.max(1, Math.ceil(n / cols));
    // 2개짜리 그룹은 세로 스택 대신 가로 2열(1행)로 배치한다.
    if (n === 2) {
      cols = 2;
      rows = 1;
    }
    return { name: group.name, cols, rows, keys: group.keys };
  });
}

const MARKUP_CACHE = new Map<string, string>();
function keyMarkup(item: MathKey): string {
  if (item.labelType === "text") return "";
  let markup = MARKUP_CACHE.get(item.id);
  if (markup === undefined) {
    markup = convertLatexToMarkup(item.label);
    MARKUP_CACHE.set(item.id, markup);
  }
  return markup;
}

export interface MathKeyboardProps {
  value?: string;
  onChange?: (latex: string) => void;
  /** 엔터 키 입력 시 호출 (현재 LaTeX 전달) */
  onSubmit?: (latex: string) => void;
  /** 정답 LaTeX. 첫 명령어로 기본/대수/기하 탭을 연다. */
  correctAnswer?: string | Record<string, unknown> | null;
  className?: string;
  readOnly?: boolean;
  /** true면 마운트 시 키패드를 열고 포커스를 잃어도 닫지 않는다(데모/상시 노출용). */
  alwaysOpen?: boolean;
  /** 수식 레벨. 키캡 세트·배치 규칙(행 수·폭)을 레벨별로 다르게 적용한다. 기본 "middle". */
  level?: MathLevel;
}

export function MathKeyboard({
  value = "",
  onChange,
  onSubmit,
  correctAnswer,
  className,
  readOnly = false,
  alwaysOpen = false,
  level = "middle",
}: MathKeyboardProps) {
  const config = MATH_LEVEL_CONFIG[level];
  const rootRef = useRef<HTMLDivElement>(null);
  const fieldRef = useRef<MathFieldEl | null>(null);
  const previewRef = useRef<MathFieldEl | null>(null);
  const [keyboardOpen, setKeyboardOpen] = useState(alwaysOpen);

  const autoTab = useMemo(
    () => resolveMathTab(firstCorrectAnswerLatex(correctAnswer), level),
    [correctAnswer, level],
  );

  // 정답이 바뀌면 활성 탭을 자동 탭으로 되돌리되, 수동 전환도 허용한다(렌더 단계 동기화).
  const [tabState, setTabState] = useState({ auto: autoTab, tab: autoTab });
  if (tabState.auto !== autoTab) setTabState({ auto: autoTab, tab: autoTab });
  const activeTab = tabState.tab;

  const groupsByTab = useMemo(() => {
    const map = {} as Record<MathTab, GroupLayout[]>;
    for (const tab of config.tabs) {
      const rows = config.maxGroupRowsByTab?.[tab] ?? config.maxGroupRows;
      map[tab] = layoutGroups(config.keysByTab[tab] ?? [], rows, config.maxGroupCols);
    }
    return map;
  }, [config]);

  // 모든 탭·그룹을 통틀어 필요한 최대 행 수. 심볼 영역 예약 높이의 기준이 된다.
  // (레벨/기호가 늘어 그룹당 행이 많아져도 자동으로 높이를 확보한다.)
  const maxRows = useMemo(() => {
    let rows = 1;
    for (const tab of config.tabs) {
      for (const group of groupsByTab[tab]) rows = Math.max(rows, group.rows);
    }
    return rows;
  }, [config, groupsByTab]);

  useEffect(() => {
    const field = fieldRef.current;
    if (field && field.value !== value) field.value = value;
    const preview = previewRef.current;
    if (preview && preview.value !== value) preview.value = value;
  }, [value]);

  useEffect(() => {
    const root = rootRef.current;
    const field = fieldRef.current;
    if (!root || !field || readOnly) return;

    const open = () => setKeyboardOpen(true);
    const closeIfLeft = () => {
      if (alwaysOpen) return;
      requestAnimationFrame(() => {
        const active = document.activeElement;
        if (active === field || root.contains(active)) return;
        setKeyboardOpen(false);
      });
    };

    field.addEventListener("focus", open);
    field.addEventListener("pointerdown", open);
    root.addEventListener("focusin", open);
    root.addEventListener("focusout", closeIfLeft);
    if (alwaysOpen) setKeyboardOpen(true);
    return () => {
      field.removeEventListener("focus", open);
      field.removeEventListener("pointerdown", open);
      root.removeEventListener("focusin", open);
      root.removeEventListener("focusout", closeIfLeft);
    };
  }, [readOnly, alwaysOpen]);

  const emitValue = () => {
    const field = fieldRef.current;
    if (!field) return;
    const preview = previewRef.current;
    if (preview && preview.value !== field.value) preview.value = field.value;
    onChange?.(field.value);
  };

  const insertLatex = (latex: string) => {
    const field = fieldRef.current;
    if (!field) return;
    field.insert(latex, { focus: true });
    field.focus();
    emitValue();
  };

  const handleRightKey = (key: RightKey) => {
    const field = fieldRef.current;
    if (!field) return;
    if (key.enter) {
      onSubmit?.(field.value);
      field.focus();
      return;
    }
    if (key.command) {
      field.executeCommand(key.command);
      field.focus();
      emitValue();
      return;
    }
    if (key.insert) insertLatex(key.insert);
  };

  const renderGroups = (tab: MathTab) => (
    <div className="rqti-mlk-groups">
      {groupsByTab[tab].map((group, gi) => (
        <Fragment key={group.name || gi}>
          {gi > 0 && <span className="rqti-mlk-divider" aria-hidden />}
          <div
            className="rqti-mlk-group"
            style={{ ["--rqti-mlk-grows" as string]: String(group.rows) }}
          >
            {group.keys.map((item) => (
              <button
                key={item.id}
                type="button"
                className="rqti-mlk-key"
                title={group.name}
                onPointerDown={(event) => event.preventDefault()}
                onClick={() => insertLatex(item.insert)}
              >
                {item.labelType === "text" ? (
                  <span className="rqti-mlk-key-text">{item.label}</span>
                ) : (
                  <span
                    className="rqti-mlk-key-math"
                    // 정적 수식 마크업(mathlive 변환 결과, 신뢰 가능한 상수)
                    dangerouslySetInnerHTML={{ __html: keyMarkup(item) }}
                  />
                )}
              </button>
            ))}
          </div>
        </Fragment>
      ))}
    </div>
  );

  const inputField = (
    <MathField
      ref={(el: MathFieldEl | null) => {
        fieldRef.current = el;
        if (!el) return;
        el.className = "rqti-math-input-field";
        el.mathVirtualKeyboardPolicy = "sandboxed";
        const field = el as MathFieldEl & { macros?: Record<string, unknown> };
        field.macros = {
          ...field.macros,
          sslash: { def: "\\mathbin{/\\!/}", args: 0 },
        };
        field.value = value;
      }}
      read-only={readOnly ? true : undefined}
      default-mode="math"
      math-virtual-keyboard-policy="sandboxed"
      onInput={emitValue}
    />
  );

  if (readOnly) {
    return (
      <div ref={rootRef} className={cn("rqti-math-input", className)}>
        {inputField}
      </div>
    );
  }

  return (
    <div ref={rootRef} className={cn("rqti-math-input", className)}>
      {inputField}
      {/* 포커스 시 열리는 통합 키보드 패널: [탭 + 그룹 키보드 + 미리보기] + 우측 고정 패드 */}
      <div
        className={cn(
          "rqti-math-input-panel",
          keyboardOpen && "rqti-math-input-panel--open",
        )}
      >
        <div className="rqti-math-input-left">
          <div
            className="rqti-math-input-keyboard"
            data-math-keyboard={level}
            style={{
              ["--rqti-mlk-rows" as string]: String(maxRows),
              ["--rqti-mlk-width" as string]: `${config.width}px`,
            }}
          >
            <div className="rqti-mlk-tabs" role="tablist">
              {config.tabs.map((tab) => (
                <button
                  key={tab}
                  type="button"
                  role="tab"
                  aria-selected={tab === activeTab}
                  className={cn(
                    "rqti-mlk-tab",
                    tab === activeTab && "rqti-mlk-tab--active",
                  )}
                  onPointerDown={(event) => event.preventDefault()}
                  onClick={() => setTabState((s) => ({ ...s, tab }))}
                >
                  {config.tabLabel[tab]}
                </button>
              ))}
            </div>
            {renderGroups(activeTab)}
          </div>
          <div className="rqti-math-input-preview-wrap" aria-label="수식 미리보기">
            <MathField
              ref={(el: MathFieldEl | null) => {
                previewRef.current = el;
                if (!el) return;
                el.className = "rqti-math-input-preview";
                el.value = value;
              }}
              read-only={true}
              default-mode="math"
              math-virtual-keyboard-policy="sandboxed"
            />
          </div>
        </div>
        <div className="rqti-math-input-right" aria-label="자주 쓰는 키">
          {RIGHT_KEYS.map((key) => (
            <button
              key={key.id}
              type="button"
              className="rqti-math-input-right-key"
              onPointerDown={(event) => event.preventDefault()}
              onClick={() => handleRightKey(key)}
            >
              {key.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
