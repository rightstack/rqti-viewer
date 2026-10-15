import {
  type ElementType,
  type PointerEvent as ReactPointerEvent,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { MathJaxProviderWrapper } from "../providers/MathJaxProviderWrapper";
import { Pencil, X } from "lucide-react";
import "mathlive";
import { createPortal } from "react-dom";
import MathJaxRenderer from "../components/MathJaxRenderer";
import { cn } from "../lib/utils";
import {
  MAX_RECENT_KEY_IDS,
  type MathKeyboardHistory,
  type MathKeyboardPosition,
  type MathKeyboardTab,
  RECENT_TAB,
  pushRecentKeyId,
  readMathKeyboardHistory,
  writeMathKeyboardHistory,
} from "./mathKeyboardHistory";
import { MATH_LEVEL_CONFIG, type MathLevel } from "./mathLevels";
import { type MathKey } from "./mathSymbols";
import {
  MIDDLE_SCHOOL_LETTERS,
  MIDDLE_SCHOOL_PAD_KEYS,
  type MiddleSchoolPadKey,
} from "./middleSchoolSymbols";

const MathField = "math-field" as unknown as ElementType;

function attachKeysScrollWheel(el: HTMLDivElement): () => void {
  const onWheel = (event: WheelEvent) => {
    if (event.deltaY === 0) return;
    const max = el.scrollHeight - el.clientHeight;
    if (max <= 0) return;
    const delta =
      event.deltaMode === WheelEvent.DOM_DELTA_LINE
        ? event.deltaY * 16
        : event.deltaMode === WheelEvent.DOM_DELTA_PAGE
          ? event.deltaY * el.clientHeight
          : event.deltaY;
    event.preventDefault();
    el.scrollTop = Math.min(max, Math.max(0, el.scrollTop + delta));
  };
  el.addEventListener("wheel", onWheel, { passive: false });
  return () => el.removeEventListener("wheel", onWheel);
}

type MathFieldEl = HTMLElement & {
  value: string;
  position: number;
  lastOffset: number;
  mathVirtualKeyboardPolicy?: string;
  focus: () => void;
  insert: (latex: string, options?: Record<string, unknown>) => void;
  executeCommand: (command: string | [string, ...unknown[]]) => void;
};

const VIEWPORT_PAD = 8;
const BACKSPACE_REPEAT_DELAY_MS = 400;
const BACKSPACE_REPEAT_INTERVAL_MS = 70;

function isEmptyMathLatex(latex: string): boolean {
  return latex.trim().length === 0;
}

/** MathLive는 근호 안이 숫자 하나면 `\sqrt3`처럼 중괄호를 뺀다. 에디터 정답은 `\sqrt{3}`이라 제출 직전에만 맞춘다. */
function braceSingleDigitSqrt(latex: string): string {
  return latex.replace(/\\sqrt\s*([0-9])/g, "\\sqrt{$1}");
}

/**
 * MathLive는 분자·분모가 숫자 하나면 `\frac23`처럼 중괄호를 뺀다.
 * 에디터 정답은 `\frac{2}{3}`이라 제출 직전에만 맞춘다.
 * `\frac{12}{3}`처럼 이미 중괄호가 있는 값은 그대로 둔다.
 */
function braceSingleDigitFrac(latex: string): string {
  return latex.replace(/\\(dfrac|tfrac|dbinom|tbinom|binom|frac)([0-9])([0-9])/g, "\\$1{$2}{$3}");
}

function eventPathContains(event: Event, ...nodes: Array<EventTarget | null | undefined>): boolean {
  const path = event.composedPath();
  return nodes.some((node) => !!node && path.includes(node));
}

type DeviceKeyAction =
  | { type: "insert"; latex: string }
  | { type: "command"; command: string }
  | { type: "submit" };

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
  if (key.length === 1 && /[0-9a-zA-Z]/.test(key)) {
    return { type: "insert", latex: key };
  }
  switch (key) {
    case ".":
    case ",":
    case "=":
    case "+":
    case "-":
      return { type: "insert", latex: key };
    case "*":
      return { type: "insert", latex: "\\times" };
    case "/":
      return { type: "insert", latex: "\\div" };
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

function clampPosition(x: number, y: number, width: number, height: number): MathKeyboardPosition {
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
    activeTab: "basic" as const,
    recentKeyIds: (history.recentKeyIds ?? []).slice(0, MAX_RECENT_KEY_IDS),
    position: null,
  };
}

/** 임베디드 칸이 호스트에 알리는 렌더 크기(px). 값이 없으면 0. */
export interface MathKeyboardContentSize {
  width: number;
  height: number;
}

export interface MathKeyboardProps {
  value?: string;
  onChange?: (latex: string) => void;
  className?: string;
  readOnly?: boolean;
  level?: MathLevel;
  historyScope?: string;
  isCorrect?: boolean;
  isSubmit?: boolean;
  variant?: "default" | "srq" | "cloze";
  /**
   * 셸 크롬 없이 호스트 칸 안만 채운다. text-entry 폭 클래스와 셸 최소 너비를 붙이지 않고,
   * 렌더된 크기를 `onContentSize`로 알린다. 칸 크기는 호스트가 정한다.
   */
  embedded?: boolean;
  onContentSize?: (size: MathKeyboardContentSize) => void;
  ariaLabel?: string;
  placeholder?: string;
  /**
   * 저장 문자열 상한. text-entry만 넘긴다.
   * 없으면 길이를 자르지 않는다.
   */
  maxLength?: number;
}

export function MathKeyboard({
  value = "",
  onChange,
  className,
  readOnly = false,
  level = "middle",
  historyScope,
  isCorrect,
  isSubmit = false,
  variant = "default",
  embedded = false,
  onContentSize,
  ariaLabel,
  placeholder,
  maxLength,
}: MathKeyboardProps) {
  const config = MATH_LEVEL_CONFIG[level];

  const rootRef = useRef<HTMLElement>(null);
  const shellRef = useRef<HTMLElement>(null);
  const fieldRef = useRef<MathFieldEl | null>(null);
  const contentRef = useRef<HTMLSpanElement | null>(null);
  const contentObserverRef = useRef<ResizeObserver | null>(null);
  const onContentSizeRef = useRef(onContentSize);
  const pendingInsertRef = useRef<string | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{
    pointerX: number;
    pointerY: number;
    x: number;
    y: number;
    latest: MathKeyboardPosition;
  } | null>(null);
  const backspaceTimerRef = useRef<number | null>(null);
  const backspaceFromPointerRef = useRef(false);
  const closingRef = useRef(false);
  const [editing, setEditing] = useState(false);
  const [keyboardOpen, setKeyboardOpen] = useState(false);
  const [localLatex, setLocalLatex] = useState(value);
  const [initialHistory] = useState(() => historyToState(level, historyScope));
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<MathKeyboardTab>(initialHistory.activeTab);
  const [recentKeyIds, setRecentKeyIds] = useState<string[]>(initialHistory.recentKeyIds);
  const [position, setPosition] = useState<MathKeyboardPosition | null>(initialHistory.position);
  const [caseMode, setCaseMode] = useState<"lower" | "shift" | "caps">("lower");
  const [letterMode, setLetterMode] = useState<"abc" | "greek">("abc");

  const persistRef = useRef({
    level,
    historyScope,
    recentKeyIds,
  });

  const persist = (patch: Partial<MathKeyboardHistory>) => {
    if (patch.recentKeyIds === undefined) return;
    const current = persistRef.current;
    writeMathKeyboardHistory(
      current.level,
      {
        recentKeyIds: current.recentKeyIds,
        ...patch,
      },
      current.historyScope
    );
  };

  const historyKey = `${level}:${historyScope ?? ""}`;
  const [trackedHistoryKey, setTrackedHistoryKey] = useState(historyKey);
  if (trackedHistoryKey !== historyKey) {
    setTrackedHistoryKey(historyKey);
    const next = historyToState(level, historyScope);
    setActiveTab(next.activeTab);
    setRecentKeyIds(next.recentKeyIds);
    setDrawerOpen(false);
    setPosition(next.position);
  }

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
    [recentKeyIds, keysById]
  );

  const drawerTabs = useMemo(
    () =>
      [
        { id: RECENT_TAB as MathKeyboardTab, label: "최근" },
        ...config.tabs.map((tab) => ({
          id: tab as MathKeyboardTab,
          label: config.tabLabel[tab],
        })),
      ] as const,
    [config]
  );

  const valueRef = useRef(value);
  const editingRef = useRef(editing);
  const keyboardOpenRef = useRef(keyboardOpen);
  const [trackedValue, setTrackedValue] = useState(value);
  if (value !== trackedValue) {
    setTrackedValue(value);
    if (value !== localLatex) setLocalLatex(value);
  }

  useLayoutEffect(() => {
    persistRef.current = {
      level,
      historyScope,
      recentKeyIds,
    };
    valueRef.current = value;
    editingRef.current = editing;
    keyboardOpenRef.current = keyboardOpen;
    onContentSizeRef.current = onContentSize;
  });

  useEffect(() => {
    const field = fieldRef.current;
    if (!field || field.value === localLatex) return;
    field.value = localLatex;
  }, [localLatex]);

  /** 조판된 수식(mjx-math)만 잰다. 조판 전 원문 글자 폭으로 호스트가 튀지 않게 한다. */
  const reportContentSize = useCallback(() => {
    const report = onContentSizeRef.current;
    if (!report) return;
    const el = contentRef.current;
    if (!el) {
      report({ width: 0, height: 0 });
      return;
    }
    const typeset = el.querySelector("mjx-math");
    if (!typeset) return;
    const rect = typeset.getBoundingClientRect();
    report({ width: rect.width, height: rect.height });
  }, []);

  const bindContent = useCallback(
    (el: HTMLSpanElement | null) => {
      contentObserverRef.current?.disconnect();
      contentObserverRef.current = null;
      contentRef.current = el;
      if (!el || typeof ResizeObserver === "undefined") return;
      const observer = new ResizeObserver(reportContentSize);
      observer.observe(el);
      contentObserverRef.current = observer;
      reportContentSize();
    },
    [reportContentSize]
  );

  const hasValue = !isEmptyMathLatex(value);

  useEffect(() => {
    if (!embedded || hasValue) return;
    onContentSizeRef.current?.({ width: 0, height: 0 });
  }, [embedded, hasValue]);

  useEffect(() => () => contentObserverRef.current?.disconnect(), []);

  const commitLatex = useCallback(
    (latest: string) => {
      const next =
        maxLength !== undefined && latest.length > maxLength ? latest.slice(0, maxLength) : latest;
      valueRef.current = next;
      setLocalLatex(next);
      onChange?.(next);
    },
    [maxLength, onChange]
  );

  const startEditing = useCallback((insertLatex?: string) => {
    if (insertLatex) pendingInsertRef.current = insertLatex;
    editingRef.current = true;
    setEditing(true);
  }, []);

  const endEditing = useCallback(() => {
    setCaseMode("lower");
    setLetterMode("abc");
    editingRef.current = false;
    keyboardOpenRef.current = false;
    closingRef.current = false;
    setEditing(false);
    setKeyboardOpen(false);
  }, []);

  const openKeyboard = useCallback(
    (insertLatex?: string) => {
      if (!keyboardOpenRef.current) {
        setCaseMode("lower");
        setLetterMode("abc");
        setDrawerOpen(false);
      }
      startEditing(insertLatex);
      keyboardOpenRef.current = true;
      setKeyboardOpen(true);
    },
    [startEditing]
  );

  const applyPreviewAndClose = useCallback(() => {
    if (closingRef.current && !keyboardOpenRef.current) return;
    closingRef.current = true;
    // 닫히는 동안에도 빈칸을 다시 누르면 바로 열리게 한다.
    keyboardOpenRef.current = false;
    const field = fieldRef.current;
    // 필드가 아직 없으면 빈 값으로 덮어쓰지 않는다.
    if (!field) {
      endEditing();
      return;
    }
    const latest = braceSingleDigitFrac(braceSingleDigitSqrt(field.value));
    valueRef.current = latest;
    commitLatex(latest);
    // MathLive가 같은 keydown에서 언마운트되면 오류가 난다. 이벤트 끝난 뒤에 닫는다.
    window.queueMicrotask(() => {
      endEditing();
    });
  }, [commitLatex, endEditing]);

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
        return;
      }
      if (!field) return;
      if (action.type === "command") {
        field.executeCommand(action.command);
        field.focus();
        return;
      }
      applyPreviewAndClose();
    },
    [applyPreviewAndClose, openKeyboard]
  );

  useEffect(() => {
    if (!keyboardOpen) return;

    // 다이얼로그가 열린 경우에만 body 클릭을 막는다. 그 화면이 아니면 포커스 흐름을 건드리지 않는다.
    const isKeyboardTarget = (node: EventTarget | null) => {
      if (!(node instanceof Node)) return false;
      const field = fieldRef.current;
      return !!(panelRef.current?.contains(node) || field === node || field?.contains(node));
    };
    const keepKeyboardFocus = (event: FocusEvent) => {
      if (document.body.style.pointerEvents !== "none") return;
      const next = event.type === "focusout" ? event.relatedTarget : event.target;
      if (!isKeyboardTarget(next) && !isKeyboardTarget(event.target)) return;
      event.stopImmediatePropagation();
    };

    document.addEventListener("focusin", keepKeyboardFocus, true);
    document.addEventListener("focusout", keepKeyboardFocus, true);
    return () => {
      document.removeEventListener("focusin", keepKeyboardFocus, true);
      document.removeEventListener("focusout", keepKeyboardFocus, true);
    };
  }, [keyboardOpen]);

  useEffect(() => {
    if (readOnly || !keyboardOpen) return;

    // 키패드·입력칸 밖 클릭은 닫기이면서 확정이다. capture로 들어야
    // 상위 stopPropagation·다이얼로그 pointer-events에도 반응한다.
    const onOutsidePointerDown = (event: PointerEvent) => {
      if (eventPathContains(event, panelRef.current, rootRef.current)) return;
      applyPreviewAndClose();
    };

    window.addEventListener("pointerdown", onOutsidePointerDown, true);
    return () => {
      window.removeEventListener("pointerdown", onOutsidePointerDown, true);
    };
  }, [applyPreviewAndClose, keyboardOpen, readOnly]);

  useLayoutEffect(() => {
    if (!editing) return;
    const field = fieldRef.current;
    if (!field) return;
    field.focus();
    const pending = pendingInsertRef.current;
    if (!pending) return;
    pendingInsertRef.current = null;
    field.insert(pending, { focus: true });
    field.focus();
  }, [editing, keyboardOpen]);

  useEffect(() => {
    if (!editing || readOnly) return;
    const onKeyDown = (event: KeyboardEvent) => {
      const field = fieldRef.current;
      const target = event.target as Node | null;
      const inField = !!(field && target && (field === target || field.contains(target)));
      const inUi = !!(rootRef.current?.contains(target) || panelRef.current?.contains(target));
      if (!inField && !inUi) return;
      const action = deviceKeyAction(event);
      if (!action) return;
      if (action.type === "submit") {
        if (!inField) return;
        event.preventDefault();
        applyPreviewAndClose();
        return;
      }
      event.preventDefault();
      event.stopPropagation();
      applyDeviceKeyAction(action);
    };
    document.addEventListener("keydown", onKeyDown, true);
    return () => document.removeEventListener("keydown", onKeyDown, true);
  }, [applyDeviceKeyAction, applyPreviewAndClose, editing, readOnly]);

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
    setPosition((prev: MathKeyboardPosition | null) => {
      const base = prev ?? placeNearField();
      const next = clampPosition(base.x, base.y, width, height);
      if (prev && prev.x === next.x && prev.y === next.y) return prev;
      // 좌표는 저장하지 않는다. 이 호출을 빼면 React Compiler가 수동 useCallback을 유지하지 못한다.
      if (!prev) persist({});
      return next;
    });
  }, [keyboardOpen, drawerOpen]);

  useLayoutEffect(() => {
    const panel = panelRef.current;
    if (!panel || !position || dragRef.current) return;
    panel.style.left = `${position.x}px`;
    panel.style.top = `${position.y}px`;
  }, [position, keyboardOpen, drawerOpen]);

  useEffect(() => {
    if (!keyboardOpen) return;
    const onResize = () => {
      const panel = panelRef.current;
      if (!panel) return;
      setPosition((prev: MathKeyboardPosition | null) => {
        if (!prev) return prev;
        return clampPosition(prev.x, prev.y, panel.offsetWidth, panel.offsetHeight);
      });
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [keyboardOpen]);

  useEffect(
    () => () => {
      if (backspaceTimerRef.current === null) return;
      window.clearTimeout(backspaceTimerRef.current);
      window.clearInterval(backspaceTimerRef.current);
      backspaceTimerRef.current = null;
    },
    []
  );

  const insertLatex = (latex: string) => {
    const field = fieldRef.current;
    if (!field) return;
    field.insert(latex, { focus: true });
    field.focus();
  };

  const handleRightKey = (key: MiddleSchoolPadKey) => {
    if (key.empty) return;
    const field = fieldRef.current;
    if (!field) return;
    if (key.command) {
      field.executeCommand(key.command);
      field.focus();
      return;
    }
    if (key.insert) insertLatex(key.insert);
  };

  const stopBackspaceRepeat = () => {
    if (backspaceTimerRef.current === null) return;
    window.clearTimeout(backspaceTimerRef.current);
    window.clearInterval(backspaceTimerRef.current);
    backspaceTimerRef.current = null;
  };

  const onBackspacePointerDown = (event: ReactPointerEvent<HTMLButtonElement>) => {
    if (event.button !== 0) return;
    event.preventDefault();
    backspaceFromPointerRef.current = true;
    event.currentTarget.setPointerCapture(event.pointerId);
    stopBackspaceRepeat();
    handleRightKey({ id: "backspace", label: "⌫", command: "deleteBackward" });
    backspaceTimerRef.current = window.setTimeout(() => {
      backspaceTimerRef.current = window.setInterval(() => {
        handleRightKey({
          id: "backspace",
          label: "⌫",
          command: "deleteBackward",
        });
      }, BACKSPACE_REPEAT_INTERVAL_MS);
    }, BACKSPACE_REPEAT_DELAY_MS);
  };

  const onBackspacePointerEnd = (event: ReactPointerEvent<HTMLButtonElement>) => {
    stopBackspaceRepeat();
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  const handleLeftKey = (item: MathKey) => {
    insertLatex(item.insert);
    const nextIds = pushRecentKeyId(recentKeyIds, item.id);
    setRecentKeyIds(nextIds);
    persist({ recentKeyIds: nextIds });
  };

  const handleTabClick = (tab: MathKeyboardTab) => {
    setActiveTab(tab);
  };

  const handleDrawerToggle = () => {
    setDrawerOpen((open) => !open);
  };

  const placeDraggedPanel = (
    event: ReactPointerEvent<HTMLDivElement>
  ): MathKeyboardPosition | null => {
    const drag = dragRef.current;
    const panel = panelRef.current;
    if (!drag || !panel) return null;
    const next = clampPosition(
      drag.x + event.clientX - drag.pointerX,
      drag.y + event.clientY - drag.pointerY,
      panel.offsetWidth,
      panel.offsetHeight
    );
    drag.latest = next;
    panel.style.left = `${next.x}px`;
    panel.style.top = `${next.y}px`;
    return next;
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
      latest: { x: rect.left, y: rect.top },
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const onHandlePointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    placeDraggedPanel(event);
  };

  const onHandlePointerUp = (event: ReactPointerEvent<HTMLDivElement>) => {
    const next = placeDraggedPanel(event);
    dragRef.current = null;
    if (!next) return;
    setPosition(next);
  };

  const detachKeysScrollRef = useRef<(() => void) | null>(null);
  const bindKeysScroll = useCallback((el: HTMLDivElement | null) => {
    detachKeysScrollRef.current?.();
    detachKeysScrollRef.current = el ? attachKeysScrollWheel(el) : null;
  }, []);

  const renderKeyButton = (item: MathKey) => (
    <button
      key={item.id}
      type="button"
      className={cn("qti-ext-mlk-key", item.cols === 2 && "qti-ext-mlk-key--wide")}
      title={item.group}
      onPointerDown={(event) => event.preventDefault()}
      onClick={() => handleLeftKey(item)}
    >
      {item.labelType === "text" ? (
        <span className="qti-ext-mlk-key-text">{item.label}</span>
      ) : (
        <span className="qti-ext-mlk-key-math">
          <MathJaxRenderer latex={item.label} displayStyle={false} />
        </span>
      )}
    </button>
  );

  const renderKeys = (keys: readonly MathKey[]) => (
    <div className="qti-ext-mlk-keys-scroll" ref={bindKeysScroll}>
      <div className="qti-ext-mlk-keys">{keys.map(renderKeyButton)}</div>
    </div>
  );

  const bindField = useCallback((el: MathFieldEl | null) => {
    fieldRef.current = el;
    if (!el) return;
    // 플로팅 키패드가 열린 동안 MathLive 가상 키보드는 띄우지 않는다.
    el.mathVirtualKeyboardPolicy = "manual";
    const field = el as MathFieldEl & {
      macros?: Record<string, unknown>;
      dataset: DOMStringMap;
    };
    field.macros = {
      ...field.macros,
      sslash: { def: "\\mathbin{/\\!/}", args: 0 },
    };
    if (field.dataset.bound === "1") return;
    field.dataset.bound = "1";
    el.className = "qti-ext-math-keyboard-field qti-ext-math-keyboard-preview-field";
    el.value = valueRef.current;
  }, []);

  const mathFieldNode = (
    <MathField
      ref={bindField}
      read-only={readOnly ? true : undefined}
      default-mode="math"
      math-virtual-keyboard-policy="manual"
    />
  );

  const answerLatex = value;
  const isAnswerCorrect = isSubmit && isCorrect === true;
  const isAnswerIncorrect = isSubmit && isCorrect === false;
  // 임베디드는 호스트 칸이 테두리·크기를 가지므로 text-entry 폭 클래스를 붙이지 않는다.
  const textEntryInputClass = embedded
    ? undefined
    : cn(
        "qti-ext-text-entry-input",
        "qti-text-entry__field",
        variant === "cloze" && "qti-ext-text-entry-input-cloze",
        variant === "srq" && "qti-ext-text-entry-input-srq",
        isAnswerCorrect && "qti-ext-text-entry-input-correct",
        isAnswerIncorrect && "qti-ext-text-entry-input-incorrect",
        !isSubmit && (hasValue || editing) && "qti-ext-text-entry-input-focus"
      );
  const rootClass = cn(
    "qti-ext-math-keyboard",
    embedded && "qti-ext-math-keyboard--embedded",
    className
  );

  const showPencil =
    !embedded && !readOnly && !isSubmit && !hasValue && !placeholder && !keyboardOpen;
  const renderedValue = answerLatex ? (
    <MathJaxRenderer
      ref={embedded ? bindContent : undefined}
      latex={latexForInputMathJax(answerLatex)}
      className="qti-ext-math-keyboard-mathjax"
      onTypeset={embedded ? reportContentSize : undefined}
    />
  ) : placeholder ? (
    <span className="qti-ext-math-keyboard-placeholder">{placeholder}</span>
  ) : (
    <span className="qti-ext-math-keyboard-field-empty" />
  );

  if (readOnly) {
    return (
      <MathJaxProviderWrapper>
        <span ref={rootRef} className={rootClass} aria-label={ariaLabel}>
          <span
            ref={shellRef}
            className={cn(
              embedded ? "qti-ext-math-keyboard-embed" : "qti-ext-math-keyboard-display",
              textEntryInputClass,
              !hasValue && "qti-ext-math-keyboard-shell--empty"
            )}
          >
            {renderedValue}
          </span>
        </span>
      </MathJaxProviderWrapper>
    );
  }

  const openFromAnswer = () => {
    closingRef.current = false;
    if (keyboardOpenRef.current) {
      fieldRef.current?.focus();
      return;
    }
    openKeyboard();
  };

  const onShellPointerDown = (event: ReactPointerEvent<HTMLSpanElement>) => {
    if (event.button !== 0) return;
    if (keyboardOpenRef.current) {
      fieldRef.current?.focus();
      return;
    }
    event.stopPropagation();
    openFromAnswer();
  };

  const valueArea = (
    <span
      className="qti-ext-math-keyboard-value"
      onPointerDown={onShellPointerDown}
      onClick={openFromAnswer}
      role="button"
      tabIndex={0}
      aria-label={ariaLabel}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          openFromAnswer();
          return;
        }
        const action = deviceKeyAction(e);
        if (!action || action.type !== "insert") return;
        e.preventDefault();
        openKeyboard(action.latex);
      }}
    >
      {renderedValue}
      {showPencil ? <Pencil className="qti-ext-text-entry-pencil" aria-hidden="true" /> : null}
    </span>
  );

  const cycleCaseMode = () => {
    setCaseMode((mode) => (mode === "lower" ? "shift" : mode === "shift" ? "caps" : "lower"));
  };

  const insertAlphabet = (letter: string) => {
    const glyph = caseMode === "lower" ? letter : letter.toUpperCase();
    insertLatex(glyph);
    if (caseMode === "shift") setCaseMode("lower");
  };

  const characterTab =
    activeTab === "characters" ? (
      <>
        <div className="qti-ext-mlk-script-row" data-letter-mode={letterMode}>
          <div className="qti-ext-mlk-script-switch" role="group" aria-label="문자 종류">
            <button
              type="button"
              className={cn(
                "qti-ext-mlk-script",
                letterMode === "abc" && "qti-ext-mlk-script--active"
              )}
              aria-pressed={letterMode === "abc"}
              onPointerDown={(event) => event.preventDefault()}
              onClick={() => {
                setLetterMode("abc");
                setCaseMode("lower");
              }}
            >
              abc
            </button>
            <button
              type="button"
              className={cn(
                "qti-ext-mlk-script",
                letterMode === "greek" && "qti-ext-mlk-script--active"
              )}
              aria-pressed={letterMode === "greek"}
              onPointerDown={(event) => event.preventDefault()}
              onClick={() => {
                setLetterMode("greek");
                setCaseMode("lower");
              }}
            >
              αβγ
            </button>
          </div>
          {letterMode === "abc" && (
            <button
              type="button"
              className={cn(
                "qti-ext-mlk-script",
                "qti-ext-mlk-script--case",
                caseMode === "shift" && "qti-ext-mlk-script--shift",
                caseMode === "caps" && "qti-ext-mlk-script--caps"
              )}
              aria-pressed={caseMode !== "lower"}
              data-case-mode={caseMode}
              aria-label={
                caseMode === "caps"
                  ? "대문자 고정 해제"
                  : caseMode === "shift"
                    ? "대문자 고정"
                    : "다음 글자 대문자"
              }
              onPointerDown={(event) => event.preventDefault()}
              onClick={cycleCaseMode}
            >
              a/A
            </button>
          )}
        </div>
        {letterMode === "abc" ? (
          <div className="qti-ext-mlk-keys-scroll" ref={bindKeysScroll}>
            <div className="qti-ext-mlk-keys qti-ext-mlk-keys--abc">
              {MIDDLE_SCHOOL_LETTERS.map((letter) => {
                const glyph = caseMode === "lower" ? letter : letter.toUpperCase();
                return (
                  <button
                    key={letter}
                    type="button"
                    className="qti-ext-mlk-key qti-ext-mlk-key--abc"
                    onPointerDown={(event) => event.preventDefault()}
                    onClick={() => insertAlphabet(letter)}
                  >
                    <span className="qti-ext-mlk-key-text">{glyph}</span>
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          renderKeys(config.keysByTab.characters ?? [])
        )}
      </>
    ) : null;

  const floatingPanel =
    keyboardOpen && typeof document !== "undefined"
      ? createPortal(
          <div
            ref={panelRef}
            className="qti-ext-math-keyboard-float"
            style={{
              visibility: position ? "visible" : "hidden",
              // 다이얼로그가 body에 pointer-events:none을 걸어도 키패드는 클릭되게 한다.
              pointerEvents: "auto",
            }}
            data-math-keyboard={level}
          >
            <div
              className="qti-ext-math-keyboard-float-handle"
              role="separator"
              aria-label="수식 키패드 이동"
              onPointerDown={onHandlePointerDown}
              onPointerMove={onHandlePointerMove}
              onPointerUp={onHandlePointerUp}
              onPointerCancel={onHandlePointerUp}
            >
              <span className="qti-ext-math-keyboard-float-handle-bar" />
              <button
                type="button"
                className="qti-ext-math-keyboard-float-close"
                aria-label="수식 키패드 닫기"
                onPointerDown={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  applyPreviewAndClose();
                }}
              >
                <X size={14} strokeWidth={2} />
              </button>
            </div>
            <div
              className="qti-ext-math-keyboard-preview"
              onPointerDown={(event) => {
                event.preventDefault();
                fieldRef.current?.focus();
              }}
            >
              {mathFieldNode}
            </div>
            <div className="qti-ext-math-keyboard-float-body">
              <div
                className={cn(
                  "qti-ext-math-keyboard-drawer",
                  drawerOpen && "qti-ext-math-keyboard-drawer--open"
                )}
              >
                <div className="qti-ext-math-keyboard-drawer-inner">
                  <div className="qti-ext-math-keyboard-keyboard">
                    <div className="qti-ext-mlk-tabs" role="tablist">
                      {drawerTabs.map((tab) => (
                        <button
                          key={tab.id}
                          type="button"
                          role="tab"
                          aria-selected={tab.id === activeTab}
                          className={cn(
                            "qti-ext-mlk-tab",
                            tab.id === activeTab && "qti-ext-mlk-tab--active"
                          )}
                          onPointerDown={(event) => event.preventDefault()}
                          onClick={() => handleTabClick(tab.id)}
                        >
                          {tab.label}
                        </button>
                      ))}
                    </div>
                    {characterTab ??
                      (activeTab === RECENT_TAB ? (
                        recentKeys.length === 0 ? (
                          <p className="qti-ext-mlk-recent-empty">최근 사용한 기호가 없습니다</p>
                        ) : (
                          renderKeys(recentKeys)
                        )
                      ) : (
                        renderKeys(
                          (config.keysByTab as Record<MathKeyboardTab, readonly MathKey[]>)[
                            activeTab
                          ] ?? []
                        )
                      ))}
                  </div>
                </div>
              </div>
              <button
                type="button"
                className="qti-ext-math-keyboard-drawer-toggle"
                aria-expanded={drawerOpen}
                aria-label={drawerOpen ? "확장 패드 접기" : "확장 패드 펼치기"}
                onPointerDown={(event) => event.preventDefault()}
                onClick={handleDrawerToggle}
              >
                {drawerOpen ? "<" : ">"}
              </button>
              <div className="qti-ext-math-keyboard-right" aria-label="자주 쓰는 키">
                {MIDDLE_SCHOOL_PAD_KEYS.map((key) =>
                  key.empty ? (
                    <span
                      key={key.id}
                      className="qti-ext-math-keyboard-right-key qti-ext-math-keyboard-right-key--empty"
                      aria-hidden
                    />
                  ) : (
                    <button
                      key={key.id}
                      type="button"
                      className="qti-ext-math-keyboard-right-key"
                      title={key.label}
                      onPointerDown={(event) => {
                        if (key.id === "backspace") onBackspacePointerDown(event);
                        else event.preventDefault();
                      }}
                      onPointerUp={key.id === "backspace" ? onBackspacePointerEnd : undefined}
                      onPointerCancel={(event) => {
                        if (key.id !== "backspace") return;
                        onBackspacePointerEnd(event);
                        backspaceFromPointerRef.current = false;
                      }}
                      onClick={() => {
                        if (key.id === "backspace" && backspaceFromPointerRef.current) {
                          backspaceFromPointerRef.current = false;
                          return;
                        }
                        handleRightKey(key);
                      }}
                    >
                      {key.labelLatex ? (
                        <span
                          className={cn(
                            "qti-ext-math-keyboard-right-key-math",
                            key.id === "dfrac" && "qti-ext-math-keyboard-right-key-math--frac",
                            key.id === "sup" && "qti-ext-math-keyboard-right-key-math--sup"
                          )}
                        >
                          <MathJaxRenderer latex={key.labelLatex} displayStyle={false} />
                        </span>
                      ) : (
                        key.label
                      )}
                    </button>
                  )
                )}
              </div>
            </div>
          </div>,
          document.body
        )
      : null;

  return (
    <MathJaxProviderWrapper>
      <span ref={rootRef} className={rootClass}>
        <span
          ref={shellRef}
          className={cn(
            embedded ? "qti-ext-math-keyboard-embed" : "qti-ext-math-keyboard-shell",
            textEntryInputClass,
            !hasValue && "qti-ext-math-keyboard-shell--empty",
            keyboardOpen && "qti-ext-math-keyboard-shell--open"
          )}
          onPointerDown={onShellPointerDown}
        >
          {valueArea}
        </span>
        {floatingPanel}
      </span>
    </MathJaxProviderWrapper>
  );
}
