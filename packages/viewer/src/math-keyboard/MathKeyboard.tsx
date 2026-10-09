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
import { Keyboard, X } from "lucide-react";
import { cn } from "../lib/utils";
import MathJaxRenderer from "../components/MathJaxRenderer";
import { MathJaxProviderWrapper } from "../providers/MathJaxProviderWrapper";
import { type MathKey } from "./mathSymbols";
import { MATH_LEVEL_CONFIG, type MathLevel } from "./mathLevels";
import {
  MIDDLE_SCHOOL_LETTERS,
  MIDDLE_SCHOOL_PAD_KEYS,
  type MiddleSchoolPadKey,
} from "./middleSchoolSymbols";
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

function latexHasPlaceholder(latex: string): boolean {
  return /#\?|\\placeholder/.test(latex);
}

/** MathLive #? / \\placeholder 를 MathJax가 아는 기호로 바꿔 닫힘 시 폭이 뛰지 않게 한다. */
function latexForInputMathJax(latex: string): string {
  return latex
    .replace(/\\placeholder(?:\[[^\]]*\])?\{[^}]*\}/g, "\\square")
    .replace(/#\?/g, "\\square");
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
  className?: string;
  readOnly?: boolean;
  level?: MathLevel;
  historyScope?: string;
  isCorrect?: boolean;
  isSubmit?: boolean;
  variant?: "default" | "srq" | "cloze";
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
}: MathKeyboardProps) {
  const config = MATH_LEVEL_CONFIG[level];

  const rootRef = useRef<HTMLElement>(null);
  const shellRef = useRef<HTMLElement>(null);
  const fieldRef = useRef<MathFieldEl | null>(null);
  const pendingInsertRef = useRef<string | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{
    pointerX: number;
    pointerY: number;
    x: number;
    y: number;
  } | null>(null);
  const backspaceTimerRef = useRef<number | null>(null);
  const backspaceFromPointerRef = useRef(false);
  const [editing, setEditing] = useState(false);
  const [keyboardOpen, setKeyboardOpen] = useState(false);
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
  const [caseMode, setCaseMode] = useState<"lower" | "shift" | "caps">(
    "lower",
  );
  const [letterMode, setLetterMode] = useState<"abc" | "greek">("abc");
  const [draftLatex, setDraftLatex] = useState(value);
  const [liveField, setLiveField] = useState(() => latexHasPlaceholder(value));

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
        { id: RECENT_TAB as MathKeyboardTab, label: "최근" },
        ...config.tabs.map((tab) => ({
          id: tab as MathKeyboardTab,
          label: config.tabLabel[tab],
        })),
      ] as const,
    [config],
  );

  const localLatexRef = useRef(localLatex);
  localLatexRef.current = localLatex;
  const valueRef = useRef(value);
  valueRef.current = value;
  const editingRef = useRef(editing);
  editingRef.current = editing;
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

  const syncDraftFromField = useCallback(() => {
    const field = fieldRef.current;
    if (!field) return;
    const latex = field.value;
    const nextLive =
      latexHasPlaceholder(latex) || field.position < field.lastOffset;
    setDraftLatex((prev) => (prev === latex ? prev : latex));
    setLiveField((prev) => (prev === nextLive ? prev : nextLive));
  }, []);

  const flushFieldValue = useCallback(() => {
    const field = fieldRef.current;
    if (!field) return;
    syncDraftFromField();
  }, [syncDraftFromField]);

  const startEditing = useCallback((insertLatex?: string) => {
    if (insertLatex) pendingInsertRef.current = insertLatex;
    editingRef.current = true;
    setEditing(true);
  }, []);

  const endEditing = useCallback(() => {
    setDraftLatex(valueRef.current);
    setLiveField(latexHasPlaceholder(valueRef.current));
    setCaseMode("lower");
    setLetterMode("abc");
    editingRef.current = false;
    keyboardOpenRef.current = false;
    setEditing(false);
    setKeyboardOpen(false);
  }, []);

  const openKeyboard = useCallback(
    (insertLatex?: string) => {
      if (!keyboardOpenRef.current) {
        const current = valueRef.current;
        setDraftLatex(current);
        setLiveField(latexHasPlaceholder(current));
        setCaseMode("lower");
        setLetterMode("abc");
      }
      startEditing(insertLatex);
      keyboardOpenRef.current = true;
      setKeyboardOpen(true);
    },
    [startEditing],
  );

  const applyPreviewAndClose = useCallback(() => {
    const latest = fieldRef.current?.value ?? "";
    valueRef.current = latest;
    commitLatex(latest);
    setDraftLatex(latest);
    endEditing();
  }, [commitLatex, endEditing]);

  const toggleKeyboard = useCallback(() => {
    if (keyboardOpenRef.current) {
      endEditing();
      return;
    }
    openKeyboard();
  }, [endEditing, openKeyboard]);

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
      applyPreviewAndClose();
    },
    [applyPreviewAndClose, flushFieldValue, openKeyboard],
  );

  useEffect(() => {
    if (readOnly) return;

    const onDocPointerDown = (event: PointerEvent) => {
      const target = event.target as Node | null;
      if (!target) return;
      if (rootRef.current?.contains(target)) return;
      if (panelRef.current?.contains(target)) return;
      endEditing();
    };

    document.addEventListener("pointerdown", onDocPointerDown);
    return () => {
      document.removeEventListener("pointerdown", onDocPointerDown);
    };
  }, [endEditing, readOnly]);

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
    flushFieldValue();
  }, [editing, keyboardOpen, flushFieldValue]);

  useEffect(() => {
    if (!editing || readOnly) return;
    const onKeyDown = (event: KeyboardEvent) => {
      const field = fieldRef.current;
      const target = event.target as Node | null;
      const inField = !!(
        field &&
        target &&
        (field === target || field.contains(target))
      );
      const inUi = !!(
        rootRef.current?.contains(target) || panelRef.current?.contains(target)
      );
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

  useEffect(() => {
    if (!keyboardOpen) return;
    const field = fieldRef.current;
    if (!field) return;
    const onSelection = () => syncDraftFromField();
    field.addEventListener("selection-change", onSelection);
    return () => field.removeEventListener("selection-change", onSelection);
  }, [keyboardOpen, syncDraftFromField]);

  useEffect(() => {
    const field = fieldRef.current;
    if (!field) return;
    field.className = liveField
      ? "rqti-math-input-field rqti-math-input-preview-field"
      : "rqti-math-input-field rqti-math-input-preview-field rqti-math-input-preview-field--ghost";
  }, [liveField, keyboardOpen]);

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

  useEffect(() => {
    return () => {
      if (backspaceTimerRef.current == null) return;
      window.clearTimeout(backspaceTimerRef.current);
      window.clearInterval(backspaceTimerRef.current);
      backspaceTimerRef.current = null;
    };
  }, []);

  const emitValue = () => {
    if (!editingRef.current) return;
    flushFieldValue();
  };

  const insertLatex = (latex: string) => {
    const field = fieldRef.current;
    if (!field) return;
    field.insert(latex, { focus: true });
    field.focus();
    emitValue();
  };

  const handleRightKey = (key: MiddleSchoolPadKey) => {
    if (key.empty) return;
    const field = fieldRef.current;
    if (!field) return;
    if (key.command) {
      field.executeCommand(key.command);
      field.focus();
      emitValue();
      return;
    }
    if (key.insert) insertLatex(key.insert);
  };

  const stopBackspaceRepeat = () => {
    if (backspaceTimerRef.current == null) return;
    window.clearTimeout(backspaceTimerRef.current);
    window.clearInterval(backspaceTimerRef.current);
    backspaceTimerRef.current = null;
  };

  const onBackspacePointerDown = (
    event: ReactPointerEvent<HTMLButtonElement>,
  ) => {
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

  const onBackspacePointerEnd = (
    event: ReactPointerEvent<HTMLButtonElement>,
  ) => {
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
        <span className="rqti-mlk-key-math">
          <MathJaxRenderer latex={item.label} displayStyle={false} />
        </span>
      )}
    </button>
  );

  const renderKeys = (keys: readonly MathKey[]) => (
    <div className="rqti-mlk-keys-scroll">
      <div className="rqti-mlk-keys">{keys.map(renderKeyButton)}</div>
    </div>
  );

  const bindField = useCallback((el: MathFieldEl | null) => {
    fieldRef.current = el;
    if (!el) return;
    el.mathVirtualKeyboardPolicy = "sandboxed";
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
    el.className = "rqti-math-input-field rqti-math-input-preview-field";
    el.value = valueRef.current;
  }, []);

  const mathFieldNode = (
    <MathField
      ref={bindField}
      read-only={readOnly ? true : undefined}
      default-mode="math"
      math-virtual-keyboard-policy="sandboxed"
      onInput={emitValue}
    />
  );

  const answerLatex = value;
  const isAnswerCorrect = isSubmit && isCorrect === true;
  const isAnswerIncorrect = isSubmit && isCorrect === false;
  const hasValue = !isEmptyMathLatex(answerLatex);
  const textEntryInputClass = cn(
    "qti-ext-text-entry-input",
    "qti-text-entry__field",
    variant === "cloze" && "qti-ext-text-entry-input-cloze",
    variant === "cloze" && isCorrect && "qti-ext-text-entry-input-correct",
    variant === "srq" && "qti-ext-text-entry-input-srq",
    (hasValue || editing) && "qti-ext-text-entry-input-focus",
    variant === "srq" && isAnswerCorrect && "qti-ext-text-entry-input-correct",
    variant === "srq" &&
      isAnswerIncorrect &&
      "qti-ext-text-entry-input-incorrect",
  );

  if (readOnly) {
    return (
      <MathJaxProviderWrapper>
        <span ref={rootRef} className={cn("rqti-math-input", className)}>
          <span
            ref={shellRef}
            className={cn(
              "rqti-math-input-display",
              textEntryInputClass,
            )}
          >
            {answerLatex ? (
              <MathJaxRenderer
                latex={latexForInputMathJax(answerLatex)}
                className="rqti-math-input-mathjax"
              />
            ) : (
              <span className="rqti-math-input-field-empty" />
            )}
          </span>
        </span>
      </MathJaxProviderWrapper>
    );
  }

  const openFromAnswer = () => {
    if (keyboardOpenRef.current) {
      fieldRef.current?.focus();
      return;
    }
    openKeyboard();
  };

  const valueArea = (
      <span
        className="rqti-math-input-value"
        onClick={openFromAnswer}
        role="button"
        tabIndex={0}
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
        {answerLatex ? (
          <MathJaxRenderer
            latex={latexForInputMathJax(answerLatex)}
            className="rqti-math-input-mathjax"
          />
        ) : (
          <span className="rqti-math-input-field-empty" />
        )}
      </span>
  );

  const cycleCaseMode = () => {
    setCaseMode((mode) =>
      mode === "lower" ? "shift" : mode === "shift" ? "caps" : "lower",
    );
  };

  const insertAlphabet = (letter: string) => {
    const glyph = caseMode === "lower" ? letter : letter.toUpperCase();
    insertLatex(glyph);
    if (caseMode === "shift") setCaseMode("lower");
  };

  const characterTab =
    activeTab === "characters" ? (
      <>
        <div className="rqti-mlk-script-row" data-letter-mode={letterMode}>
          <div className="rqti-mlk-script-switch" role="group" aria-label="문자 종류">
            <button
              type="button"
              className={cn(
                "rqti-mlk-script",
                letterMode === "abc" && "rqti-mlk-script--active",
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
                "rqti-mlk-script",
                letterMode === "greek" && "rqti-mlk-script--active",
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
                "rqti-mlk-script",
                "rqti-mlk-script--case",
                caseMode === "shift" && "rqti-mlk-script--shift",
                caseMode === "caps" && "rqti-mlk-script--caps",
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
          <div className="rqti-mlk-keys-scroll">
            <div className="rqti-mlk-keys rqti-mlk-keys--abc">
              {MIDDLE_SCHOOL_LETTERS.map((letter) => {
                const glyph =
                  caseMode === "lower" ? letter : letter.toUpperCase();
                return (
                  <button
                    key={letter}
                    type="button"
                    className="rqti-mlk-key rqti-mlk-key--abc"
                    onPointerDown={(event) => event.preventDefault()}
                    onClick={() => insertAlphabet(letter)}
                  >
                    <span className="rqti-mlk-key-text">{glyph}</span>
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
            className="rqti-math-input-float"
            style={{
              left: position?.x ?? 0,
              top: position?.y ?? 0,
              visibility: position ? "visible" : "hidden",
              ["--rqti-mlk-width" as string]: `${config.width}px`,
            }}
            data-math-keyboard={level}
          >
            <button
              type="button"
              className="rqti-math-input-float-close"
              aria-label="닫기"
              onPointerDown={(event) => event.preventDefault()}
              onClick={applyPreviewAndClose}
            >
              <X size={14} strokeWidth={2} />
            </button>
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
            <div
                className="rqti-math-input-preview"
                onPointerDown={(event) => {
                  event.preventDefault();
                  fieldRef.current?.focus();
                }}
              >
                <div
                  className={cn(
                    "rqti-math-input-preview-render",
                    liveField && "rqti-math-input-preview-render--hidden",
                  )}
                >
                  {draftLatex ? (
                    <MathJaxRenderer
                      latex={latexForInputMathJax(draftLatex)}
                      className="rqti-math-input-mathjax"
                    />
                  ) : null}
                  <span className="rqti-math-input-preview-caret" aria-hidden />
                </div>
                {mathFieldNode}
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
                    {characterTab ??
                      (activeTab === RECENT_TAB ? (
                        recentKeys.length === 0 ? (
                          <p className="rqti-mlk-recent-empty">
                            최근 사용한 기호가 없습니다
                          </p>
                        ) : (
                          renderKeys(recentKeys)
                        )
                      ) : (
                        renderKeys(config.keysByTab[activeTab] ?? [])
                      ))}
                  </div>
                </div>
              </div>
              <button
                type="button"
                className="rqti-math-input-drawer-toggle"
                aria-expanded={drawerOpen}
                aria-label={drawerOpen ? "확장 패드 접기" : "확장 패드 펼치기"}
                onPointerDown={(event) => event.preventDefault()}
                onClick={handleDrawerToggle}
              >
                {drawerOpen ? "<" : ">"}
              </button>
              <div className="rqti-math-input-right" aria-label="자주 쓰는 키">
                {MIDDLE_SCHOOL_PAD_KEYS.map((key) =>
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
                      className="rqti-math-input-right-key"
                      title={key.label}
                      onPointerDown={(event) => {
                        if (key.id === "backspace") onBackspacePointerDown(event);
                        else event.preventDefault();
                      }}
                      onPointerUp={
                        key.id === "backspace" ? onBackspacePointerEnd : undefined
                      }
                      onPointerCancel={(event) => {
                        if (key.id !== "backspace") return;
                        onBackspacePointerEnd(event);
                        backspaceFromPointerRef.current = false;
                      }}
                      onClick={() => {
                        if (
                          key.id === "backspace" &&
                          backspaceFromPointerRef.current
                        ) {
                          backspaceFromPointerRef.current = false;
                          return;
                        }
                        handleRightKey(key);
                      }}
                    >
                      {key.labelLatex ? (
                        <span className="rqti-math-input-right-key-math">
                          <MathJaxRenderer
                            latex={key.labelLatex}
                            displayStyle={false}
                          />
                        </span>
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
      <span ref={rootRef} className={cn("rqti-math-input", className)}>
        <span
          ref={shellRef}
          className={cn(
            "rqti-math-input-shell",
            textEntryInputClass,
            !hasValue && "rqti-math-input-shell--empty",
          )}
          onClick={openFromAnswer}
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
        </span>
        {floatingPanel}
      </span>
    </MathJaxProviderWrapper>
  );
}
