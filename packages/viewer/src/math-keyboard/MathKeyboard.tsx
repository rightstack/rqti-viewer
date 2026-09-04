import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ElementType,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { createPortal } from "react-dom";
import "mathlive";
import { convertLatexToMarkup } from "mathlive";
import { Keyboard } from "lucide-react";
import { cn } from "../lib/utils";
import MathJaxRenderer from "../components/MathJaxRenderer";
import { MathJaxProviderWrapper } from "../providers/MathJaxProviderWrapper";
import { type MathKey } from "./mathSymbols";
import { MATH_LEVEL_CONFIG, type MathLevel } from "./mathLevels";
import {
  MAX_RECENT_KEY_IDS,
  RECENT_TAB,
  pushRecentKeyId,
  readMathKeyboardHistory,
  resolveStoredTab,
  writeMathKeyboardHistory,
  type MathKeyboardHistory,
  type MathKeyboardPosition,
  type MathKeyboardTab,
} from "./mathKeyboardHistory";

const MathField = "math-field" as unknown as ElementType;

type MathFieldEl = HTMLElement & {
  value: string;
  mathVirtualKeyboardPolicy?: string;
  focus: () => void;
  insert: (latex: string, options?: Record<string, unknown>) => void;
  executeCommand: (command: string | [string, ...unknown[]]) => void;
};

/**
 * 우측 고정 키패드 5×5 (기획 이미지).
 *   <  7  8  9  ÷
 *   >  4  5  6  ×
 *   ⌫  1  2  3  −
 *   ↵  0  .  =  +
 *   분수 √     x  y
 */
type RightKey = {
  id: string;
  label: string;
  /** math-field.insert에 넘길 LaTeX */
  insert?: string;
  /** math-field.executeCommand로 실행할 명령 */
  command?: string;
  /** 엔터: onSubmit 콜백 실행 */
  enter?: boolean;
  /** 라벨을 MathLive 마크업으로 렌더 */
  labelLatex?: string;
  /** 커서/삭제/엔터. 회색 키 */
  control?: boolean;
  /** 그리드 자리만 차지 */
  empty?: boolean;
};

const RIGHT_KEYS: readonly RightKey[] = [
  { id: "left", label: "<", command: "moveToPreviousChar", control: true },
  { id: "7", label: "7", insert: "7" },
  { id: "8", label: "8", insert: "8" },
  { id: "9", label: "9", insert: "9" },
  { id: "div", label: "÷", insert: "\\div" },
  { id: "right", label: ">", command: "moveToNextChar", control: true },
  { id: "4", label: "4", insert: "4" },
  { id: "5", label: "5", insert: "5" },
  { id: "6", label: "6", insert: "6" },
  { id: "times", label: "×", insert: "\\times" },
  { id: "backspace", label: "⌫", command: "deleteBackward", control: true },
  { id: "1", label: "1", insert: "1" },
  { id: "2", label: "2", insert: "2" },
  { id: "3", label: "3", insert: "3" },
  { id: "minus", label: "−", insert: "-" },
  { id: "enter", label: "↵", enter: true, control: true },
  { id: "0", label: "0", insert: "0" },
  { id: "dot", label: ".", insert: "." },
  { id: "eq", label: "=", insert: "=" },
  { id: "plus", label: "+", insert: "+" },
  {
    id: "dfrac",
    label: "분수",
    labelLatex: "\\frac{\\square}{\\square}",
    insert: "\\dfrac{#?}{#?}",
  },
  {
    id: "sqrt",
    label: "루트",
    labelLatex: "\\sqrt{\\square}",
    insert: "\\sqrt{#?}",
  },
  { id: "spacer", label: "", empty: true },
  { id: "var-x", label: "x", insert: "x" },
  { id: "var-y", label: "y", insert: "y" },
];

const VIEWPORT_PAD = 8;
const MATH_WIDTH_PADDING_CH = 2;
const MATH_MIN_WIDTH_CH = 10;

/** LaTeX 문자열에서 렌더링 문자 수를 추정하여 ch 단위 너비를 반환 */
function estimateMathWidth(latex: string): number {
  const stripped = latex.replace(/\\[a-zA-Z]+\{?|\}|\\|\$|\^|_/g, "");
  return Math.max(MATH_MIN_WIDTH_CH, stripped.length + MATH_WIDTH_PADDING_CH);
}

function isEmptyMathLatex(latex: string): boolean {
  return latex.trim().length === 0;
}

type DeviceKeyAction =
  | { type: "insert"; latex: string }
  | { type: "command"; command: string }
  | { type: "submit" };

/** 디바이스(물리/OS) 키보드 입력을 수식 키패드와 같은 LaTeX·명령으로 매핑 */
function deviceKeyAction(event: {
  key: string;
  altKey: boolean;
  ctrlKey: boolean;
  metaKey: boolean;
  isComposing?: boolean;
}): DeviceKeyAction | null {
  if (event.altKey || event.ctrlKey || event.metaKey) return null;
  if (event.isComposing) return null;
  const { key } = event;
  if (key.length === 1 && key >= "0" && key <= "9") {
    return { type: "insert", latex: key };
  }
  switch (key) {
    case ".":
    case "=":
    case "+":
    case "-":
      return { type: "insert", latex: key };
    case "*":
      return { type: "insert", latex: "\\times" };
    case "/":
      return { type: "insert", latex: "\\div" };
    case "x":
    case "X":
      return { type: "insert", latex: "x" };
    case "y":
    case "Y":
      return { type: "insert", latex: "y" };
    case "Backspace":
      return { type: "command", command: "deleteBackward" };
    case "ArrowLeft":
      return { type: "command", command: "moveToPreviousChar" };
    case "ArrowRight":
      return { type: "command", command: "moveToNextChar" };
    case "Enter":
      return { type: "submit" };
    default:
      return null;
  }
}

/** MathLive #? / \\placeholder 를 MathJax가 아는 기호로 바꿔 닫힘 시 폭이 뛰지 않게 한다. */
function latexForInputMathJax(latex: string): string {
  return latex
    .replace(/\\placeholder(?:\[[^\]]*\])?\{[^}]*\}/g, "\\square")
    .replace(/#\?/g, "\\square");
}

/** correctAnswer prop에서 문자열 추출 */
function extractCorrectAnswerStr(
  ca: string | Record<string, unknown> | null | undefined,
): string | undefined {
  if (!ca) return undefined;
  if (typeof ca === "string") return ca;
  const vals = Object.values(ca);
  for (const v of vals) {
    if (typeof v === "string" && v.length > 0) return v;
    if (Array.isArray(v)) {
      const first = v[0];
      if (typeof first === "string" && first.length > 0) return first;
    }
  }
  return undefined;
}

const MARKUP_CACHE = new Map<string, string>();
function keyMarkup(item: MathKey | { id: string; label: string }): string {
  let markup = MARKUP_CACHE.get(item.id);
  if (markup === undefined) {
    markup = convertLatexToMarkup(item.label);
    MARKUP_CACHE.set(item.id, markup);
  }
  return markup;
}

function clampPosition(
  x: number,
  y: number,
  width: number,
  height: number,
): MathKeyboardPosition {
  const maxX = window.innerWidth - width - VIEWPORT_PAD;
  const maxY = window.innerHeight - height - VIEWPORT_PAD;
  return {
    x: Math.min(Math.max(VIEWPORT_PAD, x), Math.max(VIEWPORT_PAD, maxX)),
    y: Math.min(Math.max(VIEWPORT_PAD, y), Math.max(VIEWPORT_PAD, maxY)),
  };
}

function historyToState(level: MathLevel, historyScope?: string) {
  const history = readMathKeyboardHistory(level, historyScope);
  return {
    drawerOpen: history.drawerOpen === true,
    activeTab: resolveStoredTab(history.lastTab, MATH_LEVEL_CONFIG[level].tabs),
    recentKeyIds: (history.recentKeyIds ?? []).slice(0, MAX_RECENT_KEY_IDS),
    position: history.position ?? null,
  };
}

export interface MathKeyboardProps {
  value?: string;
  onChange?: (latex: string) => void;
  /** 엔터 키 입력 시 호출 (현재 LaTeX 전달) */
  onSubmit?: (latex: string) => void;
  /**
   * 호환용. 탭 선택에는 쓰지 않는다.
   * 마지막 사용 탭은 localStorage 이력이 담당한다.
   */
  correctAnswer?: string | Record<string, unknown> | null;
  className?: string;
  readOnly?: boolean;
  /** true면 마운트 시 키패드를 열고 포커스를 잃어도 닫지 않는다(데모/상시 노출용). */
  alwaysOpen?: boolean;
  /** 수식 레벨. `"middle"` | `"high"`. 기본 `"middle"`. */
  level?: MathLevel;
  /** localStorage 키를 퀴즈/응시 회차별로 나눈다. */
  historyScope?: string;
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
  historyScope,
}: MathKeyboardProps) {
  const config = MATH_LEVEL_CONFIG[level];

  const autoWidth = useMemo(() => {
    const answerStr = extractCorrectAnswerStr(correctAnswer);
    if (!answerStr) return undefined;
    return estimateMathWidth(answerStr);
  }, [correctAnswer]);
  const rootRef = useRef<HTMLDivElement>(null);
  const shellRef = useRef<HTMLDivElement>(null);
  const fieldRef = useRef<MathFieldEl | null>(null);
  const pendingInsertRef = useRef<string | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{
    pointerX: number;
    pointerY: number;
    x: number;
    y: number;
  } | null>(null);
  const [keyboardOpen, setKeyboardOpen] = useState(alwaysOpen);
  const [localLatex, setLocalLatex] = useState(value);
  const [initialHistory] = useState(() => historyToState(level, historyScope));
  const [drawerOpen, setDrawerOpen] = useState(initialHistory.drawerOpen);
  const [activeTab, setActiveTab] = useState<MathKeyboardTab>(
    initialHistory.activeTab,
  );
  const [recentKeyIds, setRecentKeyIds] = useState<string[]>(
    initialHistory.recentKeyIds,
  );
  const [position, setPosition] = useState<MathKeyboardPosition | null>(
    initialHistory.position,
  );

  const persistRef = useRef({
    level,
    historyScope,
    activeTab,
    recentKeyIds,
    drawerOpen,
    position,
  });
  persistRef.current = {
    level,
    historyScope,
    activeTab,
    recentKeyIds,
    drawerOpen,
    position,
  };

  const persist = (patch: Partial<MathKeyboardHistory>) => {
    const current = persistRef.current;
    writeMathKeyboardHistory(
      current.level,
      {
        lastTab: current.activeTab,
        recentKeyIds: current.recentKeyIds,
        drawerOpen: current.drawerOpen,
        position: current.position ?? undefined,
        ...patch,
      },
      current.historyScope,
    );
  };

  const historyKey = `${level}:${historyScope ?? ""}`;
  const historyKeyRef = useRef(historyKey);
  useLayoutEffect(() => {
    if (historyKeyRef.current === historyKey) return;
    historyKeyRef.current = historyKey;
    const next = historyToState(level, historyScope);
    setActiveTab(next.activeTab);
    setRecentKeyIds(next.recentKeyIds);
    setDrawerOpen(next.drawerOpen);
    setPosition(next.position);
  }, [historyKey, level, historyScope]);

  const keysById = useMemo(() => {
    const map = new Map<string, MathKey>();
    for (const tab of config.tabs) {
      for (const item of config.keysByTab[tab] ?? []) {
        map.set(item.id, item);
      }
    }
    return map;
  }, [config]);

  const recentKeys = useMemo(
    () =>
      recentKeyIds
        .map((id) => keysById.get(id))
        .filter((item): item is MathKey => item !== undefined),
    [recentKeyIds, keysById],
  );

  const drawerTabs = useMemo(
    () =>
      [
        { id: RECENT_TAB as MathKeyboardTab, label: "최근 사용" },
        ...config.tabs.map((tab) => ({
          id: tab as MathKeyboardTab,
          label: config.tabLabel[tab],
        })),
      ] as const,
    [config],
  );

  const localLatexRef = useRef(localLatex);
  localLatexRef.current = localLatex;
  const keyboardOpenRef = useRef(keyboardOpen);
  keyboardOpenRef.current = keyboardOpen;

  useEffect(() => {
    if (value === localLatexRef.current) return;
    localLatexRef.current = value;
    setLocalLatex(value);
    const field = fieldRef.current;
    if (field && field.value !== value) field.value = value;
  }, [value]);

  const commitLatex = useCallback(
    (latest: string) => {
      localLatexRef.current = latest;
      setLocalLatex(latest);
      onChange?.(latest);
    },
    [onChange],
  );

  /** math-field의 현재 값을 로컬 상태 + 부모에 동기화 */
  const flushFieldValue = useCallback(() => {
    const field = fieldRef.current;
    if (!field) return;
    commitLatex(field.value);
  }, [commitLatex]);

  const closeKeyboard = useCallback(() => {
    flushFieldValue();
    keyboardOpenRef.current = false;
    setKeyboardOpen(false);
  }, [flushFieldValue]);

  const openKeyboard = useCallback((insertLatex?: string) => {
    if (insertLatex) pendingInsertRef.current = insertLatex;
    keyboardOpenRef.current = true;
    setKeyboardOpen(true);
  }, []);

  const toggleKeyboard = useCallback(() => {
    if (keyboardOpenRef.current) {
      closeKeyboard();
      return;
    }
    openKeyboard();
  }, [closeKeyboard, openKeyboard]);

  const applyDeviceKeyAction = useCallback(
    (action: DeviceKeyAction) => {
      const field = fieldRef.current;
      if (action.type === "insert") {
        if (!field) {
          openKeyboard(action.latex);
          return;
        }
        field.insert(action.latex, { focus: true });
        field.focus();
        flushFieldValue();
        return;
      }
      if (!field) return;
      if (action.type === "command") {
        field.executeCommand(action.command);
        field.focus();
        flushFieldValue();
        return;
      }
      onSubmit?.(field.value);
      field.focus();
    },
    [flushFieldValue, onSubmit, openKeyboard],
  );

  useEffect(() => {
    if (readOnly) return;

    const onDocPointerDown = (event: PointerEvent) => {
      if (alwaysOpen) return;
      const target = event.target as Node | null;
      if (!target) return;
      if (rootRef.current?.contains(target)) return;
      if (panelRef.current?.contains(target)) return;
      closeKeyboard();
    };

    document.addEventListener("pointerdown", onDocPointerDown);
    if (alwaysOpen) setKeyboardOpen(true);
    return () => {
      document.removeEventListener("pointerdown", onDocPointerDown);
    };
  }, [alwaysOpen, closeKeyboard, readOnly]);

  useLayoutEffect(() => {
    if (!keyboardOpen) return;
    const field = fieldRef.current;
    if (!field) return;
    field.focus();
    const pending = pendingInsertRef.current;
    if (!pending) return;
    pendingInsertRef.current = null;
    field.insert(pending, { focus: true });
    field.focus();
    flushFieldValue();
  }, [keyboardOpen, flushFieldValue]);

  useEffect(() => {
    if (!keyboardOpen || readOnly) return;
    const onKeyDown = (event: KeyboardEvent) => {
      const field = fieldRef.current;
      const target = event.target as Node | null;
      const inField = !!(
        field &&
        target &&
        (field === target || field.contains(target))
      );
      const inUi = !!(
        rootRef.current?.contains(target) ||
        panelRef.current?.contains(target)
      );
      if (!inField && !inUi) return;
      const action = deviceKeyAction(event);
      if (!action) return;
      if (action.type === "submit") {
        if (!inField) return;
        event.preventDefault();
        onSubmit?.(field.value);
        return;
      }
      event.preventDefault();
      event.stopPropagation();
      applyDeviceKeyAction(action);
    };
    document.addEventListener("keydown", onKeyDown, true);
    return () => document.removeEventListener("keydown", onKeyDown, true);
  }, [applyDeviceKeyAction, keyboardOpen, onSubmit, readOnly]);

  const placeNearField = (): MathKeyboardPosition => {
    const anchor = shellRef.current ?? fieldRef.current;
    if (!anchor) return { x: VIEWPORT_PAD, y: VIEWPORT_PAD };
    const rect = anchor.getBoundingClientRect();
    return { x: rect.left, y: rect.bottom + VIEWPORT_PAD };
  };

  useLayoutEffect(() => {
    if (!keyboardOpen) return;
    const panel = panelRef.current;
    if (!panel) return;
    const width = panel.offsetWidth;
    const height = panel.offsetHeight;
    setPosition((prev) => {
      const base = prev ?? placeNearField();
      const next = clampPosition(base.x, base.y, width, height);
      if (prev && prev.x === next.x && prev.y === next.y) return prev;
      if (!prev) persist({ position: next });
      return next;
    });
  }, [keyboardOpen, drawerOpen]);

  useEffect(() => {
    if (!keyboardOpen) return;
    const onResize = () => {
      const panel = panelRef.current;
      if (!panel) return;
      setPosition((prev) => {
        if (!prev) return prev;
        return clampPosition(
          prev.x,
          prev.y,
          panel.offsetWidth,
          panel.offsetHeight,
        );
      });
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [keyboardOpen]);

  const emitValue = () => {
    // 키패드 닫히며 math-field가 unmount될 때 빈 input이 올라오면 값을 지운다.
    if (!keyboardOpenRef.current) return;
    flushFieldValue();
  };

  const insertLatex = (latex: string) => {
    const field = fieldRef.current;
    if (!field) return;
    field.insert(latex, { focus: true });
    field.focus();
    emitValue();
  };

  const handleRightKey = (key: RightKey) => {
    if (key.empty) return;
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

  const handleLeftKey = (item: MathKey) => {
    insertLatex(item.insert);
    const nextIds = pushRecentKeyId(recentKeyIds, item.id);
    setRecentKeyIds(nextIds);
    persist({ recentKeyIds: nextIds });
  };

  const handleTabClick = (tab: MathKeyboardTab) => {
    setActiveTab(tab);
    persist({ lastTab: tab });
  };

  const handleDrawerToggle = () => {
    const next = !drawerOpen;
    setDrawerOpen(next);
    persist({ drawerOpen: next });
  };

  const onHandlePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.button !== 0) return;
    event.preventDefault();
    const panel = panelRef.current;
    if (!panel) return;
    const rect = panel.getBoundingClientRect();
    dragRef.current = {
      pointerX: event.clientX,
      pointerY: event.clientY,
      x: rect.left,
      y: rect.top,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const onHandlePointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    const panel = panelRef.current;
    if (!drag || !panel) return;
    setPosition(
      clampPosition(
        drag.x + event.clientX - drag.pointerX,
        drag.y + event.clientY - drag.pointerY,
        panel.offsetWidth,
        panel.offsetHeight,
      ),
    );
  };

  const onHandlePointerUp = (event: ReactPointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    const panel = panelRef.current;
    dragRef.current = null;
    if (!drag || !panel) return;
    const next = clampPosition(
      drag.x + event.clientX - drag.pointerX,
      drag.y + event.clientY - drag.pointerY,
      panel.offsetWidth,
      panel.offsetHeight,
    );
    setPosition(next);
    persist({ position: next });
  };

  const renderKeyButton = (item: MathKey) => (
    <button
      key={item.id}
      type="button"
      className={cn("rqti-mlk-key", item.cols === 2 && "rqti-mlk-key--wide")}
      title={item.group}
      onPointerDown={(event) => event.preventDefault()}
      onClick={() => handleLeftKey(item)}
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
  );

  const renderKeys = (keys: readonly MathKey[]) => (
    <div className="rqti-mlk-keys-scroll">
      <div className="rqti-mlk-keys">{keys.map(renderKeyButton)}</div>
    </div>
  );

  const mathFieldNode = (
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
        field.value = localLatexRef.current || value;
      }}
      read-only={readOnly ? true : undefined}
      default-mode="math"
      math-virtual-keyboard-policy="sandboxed"
      onInput={emitValue}
    />
  );

  const widthStyle = autoWidth
    ? ({ "--rqti-math-input-auto-width": `${autoWidth}ch` } as React.CSSProperties)
    : undefined;

  // readOnly: MathJax만 표시, 버튼·키패드 없음
  if (readOnly) {
    return (
      <MathJaxProviderWrapper>
        <div ref={rootRef} className={cn("rqti-math-input", className)} style={widthStyle}>
          <div ref={shellRef} className="rqti-math-input-display">
            {localLatex ? (
              <MathJaxRenderer
                latex={latexForInputMathJax(localLatex)}
                displayStyle={false}
                className="rqti-math-input-mathjax"
              />
            ) : (
              <span className="rqti-math-input-field-empty" />
            )}
          </div>
        </div>
      </MathJaxProviderWrapper>
    );
  }

  // 작성 중(키패드 열림): MathLive. 닫힘: MathJax.
  const valueArea = keyboardOpen ? (
    mathFieldNode
  ) : (
    <div
      className="rqti-math-input-value"
      onClick={toggleKeyboard}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          toggleKeyboard();
          return;
        }
        const action = deviceKeyAction(e);
        if (!action || action.type !== "insert") return;
        e.preventDefault();
        applyDeviceKeyAction(action);
      }}
    >
      {localLatex ? (
        <MathJaxRenderer
          latex={latexForInputMathJax(localLatex)}
          displayStyle={false}
          className="rqti-math-input-mathjax"
        />
      ) : (
        <span className="rqti-math-input-field-empty" />
      )}
    </div>
  );

  const floatingPanel =
    keyboardOpen && typeof document !== "undefined"
      ? createPortal(
          <div
            ref={panelRef}
            className="rqti-math-input-float"
            style={{
              left: position?.x ?? 0,
              top: position?.y ?? 0,
              visibility: position ? "visible" : "hidden",
              ["--rqti-mlk-width" as string]: `${config.width}px`,
            }}
            data-math-keyboard={level}
          >
            <div
              className="rqti-math-input-float-handle"
              role="separator"
              aria-label="수식 키패드 이동"
              onPointerDown={onHandlePointerDown}
              onPointerMove={onHandlePointerMove}
              onPointerUp={onHandlePointerUp}
              onPointerCancel={onHandlePointerUp}
            >
              <span className="rqti-math-input-float-handle-bar" />
            </div>
            <div className="rqti-math-input-float-body">
              <div
                className={cn(
                  "rqti-math-input-drawer",
                  drawerOpen && "rqti-math-input-drawer--open",
                )}
              >
                <div className="rqti-math-input-drawer-inner">
                  <div className="rqti-math-input-keyboard">
                    <div className="rqti-mlk-tabs" role="tablist">
                      {drawerTabs.map((tab) => (
                        <button
                          key={tab.id}
                          type="button"
                          role="tab"
                          aria-selected={tab.id === activeTab}
                          className={cn(
                            "rqti-mlk-tab",
                            tab.id === activeTab && "rqti-mlk-tab--active",
                          )}
                          onPointerDown={(event) => event.preventDefault()}
                          onClick={() => handleTabClick(tab.id)}
                        >
                          {tab.label}
                        </button>
                      ))}
                    </div>
                    {activeTab === RECENT_TAB ? (
                      recentKeys.length === 0 ? (
                        <p className="rqti-mlk-recent-empty">
                          최근 사용한 기호가 없습니다
                        </p>
                      ) : (
                        renderKeys(recentKeys)
                      )
                    ) : (
                      renderKeys(config.keysByTab[activeTab] ?? [])
                    )}
                  </div>
                </div>
              </div>
              <button
                type="button"
                className="rqti-math-input-drawer-toggle"
                aria-expanded={drawerOpen}
                aria-label={
                  drawerOpen ? "심화 기호 서랍 닫기" : "심화 기호 서랍 열기"
                }
                onPointerDown={(event) => event.preventDefault()}
                onClick={handleDrawerToggle}
              >
                {drawerOpen ? "<" : ">"}
              </button>
              <div className="rqti-math-input-right" aria-label="자주 쓰는 키">
                {RIGHT_KEYS.map((key) =>
                  key.empty ? (
                    <span
                      key={key.id}
                      className="rqti-math-input-right-key rqti-math-input-right-key--empty"
                      aria-hidden
                    />
                  ) : (
                    <button
                      key={key.id}
                      type="button"
                      className={cn(
                        "rqti-math-input-right-key",
                        key.control && "rqti-math-input-right-key--control",
                      )}
                      title={key.label}
                      onPointerDown={(event) => event.preventDefault()}
                      onClick={() => handleRightKey(key)}
                    >
                      {key.labelLatex ? (
                        <span
                          className="rqti-math-input-right-key-math"
                          dangerouslySetInnerHTML={{
                            __html: keyMarkup({
                              id: `right-${key.id}`,
                              label: key.labelLatex,
                            }),
                          }}
                        />
                      ) : (
                        key.label
                      )}
                    </button>
                  ),
                )}
              </div>
            </div>
          </div>,
          document.body,
        )
      : null;

  return (
    <MathJaxProviderWrapper>
      <div ref={rootRef} className={cn("rqti-math-input", className)} style={widthStyle}>
        <div
          ref={shellRef}
          className={cn(
            "rqti-math-input-shell",
            keyboardOpen && "rqti-math-input-shell--open",
            isEmptyMathLatex(localLatex) && "rqti-math-input-shell--empty",
          )}
        >
          {valueArea}
          <button
            type="button"
            className={cn(
              "rqti-math-input-toggle",
              keyboardOpen && "rqti-math-input-toggle--active",
            )}
            aria-label={keyboardOpen ? "수식 키패드 닫기" : "수식 키패드 열기"}
            aria-pressed={keyboardOpen}
            onPointerDown={(event) => event.preventDefault()}
            onClick={(event) => {
              event.stopPropagation();
              event.currentTarget.blur();
              toggleKeyboard();
            }}
          >
            <Keyboard size={16} />
          </button>
        </div>
        {floatingPanel}
      </div>
    </MathJaxProviderWrapper>
  );
}
