import {
  type ReactNode,
  type PointerEvent as ReactPointerEvent,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import clsx from "clsx";
import { Pencil } from "lucide-react";
import { MathKeyboard, type MathKeyboardContentSize, type MathLevel } from "../../math-keyboard";
import {
  MATH_BLANK_DISPLAY_SCALE,
  type SlotContentEm,
  markerSlotWidthEm,
  markerSlotWidthPx,
} from "./mathBlankLatex";
import { measureDisplayContent, measureTextContentWidth, readBoxExtras } from "./slotMeasure";
import { type BlankVariant, getBlankVariantClass } from "./utils";

type FormulaSlotInputProps = {
  id: string;
  value: string;
  /** `\inputblank{ID}{N}` 의 N — 최소 N글자 폭 */
  widthCh?: number;
  readOnly: boolean;
  onChange: (id: string, value: string) => void;
  stateClassName?: string;
  fitFormulaHost?: boolean;
  /** 키패드 최근 기호 저장 범위. 보통 문항 키. */
  historyScope?: string;
  level?: MathLevel | null;
  /** 맞춘 칸 크기를 알린다. 식 쪽 `\Rule`을 같은 크기로 다시 만들어 식과 빈칸이 겹치지 않게 한다. */
  onContentEm?: (em: SlotContentEm) => void;
};

function applySlotBox(slot: HTMLElement, targetW: number, targetH: number) {
  const w = Math.ceil(targetW);
  const h = Math.ceil(targetH);
  const width = `${w}px`;
  const height = `${h}px`;
  if (slot.style.width !== width || slot.style.height !== height) {
    slot.style.width = width;
    slot.style.minWidth = width;
    slot.style.height = height;
    slot.style.minHeight = height;
  }
  const math = slot.closest<HTMLElement>("mjx-math");
  if (math) {
    math.style.width = "max-content";
    math.style.maxWidth = "none";
  }
  const container =
    math?.closest<HTMLElement>("mjx-container") ?? slot.closest<HTMLElement>("mjx-container");
  if (container) {
    container.style.width = "max-content";
    container.style.maxWidth = "none";
  }
  return { w, h };
}

/** 적용한 칸 크기를 em으로 돌려준다. 이 값을 `\Rule`에 넣으면 윗줄이 칸과 같아진다. */
function fitSlotToContent(
  box: HTMLElement,
  blankStyle: CSSStyleDeclaration,
  contentW: number,
  contentH: number,
  widthCh: number | undefined,
  scale = 1
): SlotContentEm {
  const { padX, padY, borderX, borderY } = readBoxExtras(blankStyle);
  const fontSize = parseFloat(blankStyle.fontSize) || 16;
  const baseWidth = markerSlotWidthPx(widthCh, fontSize) * scale;
  const baseHeight = markerSlotWidthPx(1, fontSize) * scale;
  const applied = applySlotBox(
    box,
    Math.max(baseWidth, contentW + Math.max(padX + borderX, fontSize)),
    Math.max(baseHeight, contentH + padY + borderY)
  );
  return { widthEm: applied.w / fontSize, heightEm: applied.h / fontSize };
}

export function FormulaSlotInput({
  id,
  value,
  widthCh,
  readOnly,
  onChange,
  stateClassName,
  fitFormulaHost = false,
  historyScope,
  level,
  onContentEm,
}: FormulaSlotInputProps) {
  const wrapperRef = useRef<HTMLSpanElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const useKeypad = level === "middle" || level === "high";
  const showPencil = !readOnly && value === "";
  /** 현재 값의 렌더 크기. 값이 바뀌면 다시 올 때까지 null이라, 이전 값 크기를 식에 알리지 않는다. */
  const [measured, setMeasured] = useState<MathKeyboardContentSize | null>(null);
  const [trackedValue, setTrackedValue] = useState(value);
  if (trackedValue !== value) {
    setTrackedValue(value);
    setMeasured(null);
  }
  const emitRef = useRef(onContentEm);
  const focusedRef = useRef(false);
  const lastEmRef = useRef<SlotContentEm | null>(null);

  useEffect(() => {
    emitRef.current = onContentEm;
  }, [onContentEm]);

  const handleContentSize = useCallback((size: MathKeyboardContentSize) => {
    const next = { width: Math.round(size.width), height: Math.round(size.height) };
    setMeasured((prev) =>
      prev && prev.width === next.width && prev.height === next.height ? prev : next
    );
  }, []);

  const readContentSize = (): MathKeyboardContentSize | null => {
    if (useKeypad) {
      if (value === "") return { width: 0, height: 0 };
      return measured;
    }
    if (!inputRef.current) return value === "" ? { width: 0, height: 0 } : null;
    return {
      width: measureTextContentWidth(inputRef.current, value),
      height: 0,
    };
  };

  const isEditing = () =>
    focusedRef.current || !!wrapperRef.current?.contains(document.activeElement);

  const emitIfChanged = (em: SlotContentEm) => {
    const prev = lastEmRef.current;
    if (
      prev &&
      Math.abs(prev.widthEm - em.widthEm) < 0.01 &&
      Math.abs(prev.heightEm - em.heightEm) < 0.01
    ) {
      return;
    }
    lastEmRef.current = em;
    emitRef.current?.(em);
  };

  const fitCurrentSlot = () => {
    const wrapper = wrapperRef.current;
    if (!wrapper) return null;
    const box = wrapper.closest<HTMLElement>(".qti-ext-mjx-blank-slot") ?? wrapper;
    const size = readContentSize();
    if (!size) return null;
    return fitSlotToContent(box, getComputedStyle(wrapper), size.width, size.height, widthCh);
  };

  useLayoutEffect(() => {
    const em = fitCurrentSlot();
    if (!em) return;
    if (isEditing()) return;
    const frame = window.requestAnimationFrame(() => {
      if (isEditing()) return;
      emitIfChanged(em);
    });
    return () => window.cancelAnimationFrame(frame);
  }, [measured, useKeypad, value, widthCh]);

  const setEditing = (editing: boolean) => {
    focusedRef.current = editing;
    if (editing) return;
    const em = fitCurrentSlot();
    if (em) emitIfChanged(em);
  };

  const openKeypadFromBox = (event: ReactPointerEvent<HTMLSpanElement>) => {
    if (event.button !== 0 || readOnly) return;
    const valueEl = wrapperRef.current?.querySelector<HTMLElement>(".qti-ext-math-keyboard-value");
    if (!valueEl || valueEl.contains(event.target as Node)) return;
    event.preventDefault();
    valueEl.click();
  };

  return (
    <span
      ref={wrapperRef}
      className={clsx(
        "qti-ext-math-blank-field qti-ext-input-blank qti-ext-text-entry-input",
        useKeypad && "qti-ext-math-blank-field--keypad",
        fitFormulaHost && "qti-ext-math-blank-slot-content",
        stateClassName
      )}
      style={{ minWidth: markerSlotWidthEm(widthCh) }}
      data-response-identifier={id}
      onPointerDown={useKeypad ? openKeypadFromBox : undefined}
    >
      {useKeypad ? (
        <MathKeyboard
          embedded
          value={value}
          onChange={(latex) => onChange(id, latex)}
          readOnly={readOnly}
          level={level}
          historyScope={historyScope}
          onContentSize={handleContentSize}
          ariaLabel={`${id} 입력`}
        />
      ) : (
        <input
          ref={inputRef}
          className="qti-ext-input-blank__field"
          type="text"
          size={1}
          value={value}
          readOnly={readOnly}
          data-response-identifier={id}
          aria-label={`${id} 입력`}
          onFocus={() => setEditing(true)}
          onBlur={() => setEditing(false)}
          onChange={(event) => onChange(id, event.target.value)}
        />
      )}
      {showPencil ? <Pencil className="qti-ext-text-entry-pencil" aria-hidden="true" /> : null}
    </span>
  );
}

type FormulaSlotLatexDisplayProps = {
  children: ReactNode;
  widthCh?: number;
  stateClassName?: string;
  variant?: BlankVariant;
  /** 빈 표시용 상자. 슬롯만 채우고 내용으로 키우지 않는다. */
  fillSlot?: boolean;
  fitFormulaHost?: boolean;
  /** 맞춘 칸 크기를 알린다. 식 쪽 `\Rule`을 같은 크기로 다시 만들 때 쓴다. */
  onContentEm?: (em: SlotContentEm) => void;
};

/** MathJax 표시. 값이 있으면 조판 후 슬롯을 맞춘다. `fillSlot`이면 빈 상자 크기를 유지한다. */
export function FormulaSlotLatexDisplay({
  children,
  widthCh,
  stateClassName,
  variant = "blank-box",
  fillSlot = false,
  fitFormulaHost = false,
  onContentEm,
}: FormulaSlotLatexDisplayProps) {
  const wrapperRef = useRef<HTMLSpanElement>(null);
  const contentRef = useRef<HTMLSpanElement>(null);
  const growToContent = !fillSlot;
  const sizeScale = fitFormulaHost ? 1 : variant === "blank-box" ? MATH_BLANK_DISPLAY_SCALE : 1;
  const emitRef = useRef(onContentEm);

  useEffect(() => {
    emitRef.current = onContentEm;
  }, [onContentEm]);

  useEffect(() => {
    const wrapper = wrapperRef.current;
    const box = wrapper?.closest<HTMLElement>(".qti-ext-mjx-blank-slot") ?? wrapper;
    if (!growToContent) {
      if (!box) return;
      box.style.width = "";
      box.style.minWidth = "";
      box.style.height = "";
      box.style.minHeight = "";
      return;
    }
    if (!wrapper || !box) return;
    const content = contentRef.current;
    let frame = 0;

    const tryApply = () => {
      const hasMathHost = !!content?.querySelector(".qti-ext-mathfield, mjx-container");
      const size = measureDisplayContent(content);
      if (size.w === 0 && size.h === 0 && (hasMathHost || content?.textContent?.trim())) {
        return false;
      }
      const em = fitSlotToContent(
        box,
        getComputedStyle(wrapper),
        size.w,
        size.h,
        widthCh,
        sizeScale
      );
      emitRef.current?.(em);
      return true;
    };

    const applyAfterLayout = () => {
      frame = window.requestAnimationFrame(() => {
        tryApply();
      });
    };

    if (!fitFormulaHost) {
      if (!content) return;
      let stopped = false;
      let quietFrames = 0;
      const tick = () => {
        if (stopped) return;
        quietFrames += 1;
        if (quietFrames < 2) {
          frame = window.requestAnimationFrame(tick);
          return;
        }
        if (tryApply() || quietFrames > 30) return;
        frame = window.requestAnimationFrame(tick);
      };
      const poke = () => {
        if (stopped) return;
        quietFrames = 0;
        window.cancelAnimationFrame(frame);
        frame = window.requestAnimationFrame(tick);
      };
      const mutationObserver = new MutationObserver(poke);
      mutationObserver.observe(content, { childList: true, subtree: true, attributes: true });
      document.fonts?.ready.then(poke).catch(poke);
      poke();
      return () => {
        stopped = true;
        mutationObserver.disconnect();
        window.cancelAnimationFrame(frame);
      };
    }
    if (!content) return;

    const mutationObserver = new MutationObserver(() => {
      applyAfterLayout();
    });
    mutationObserver.observe(content, { childList: true, subtree: true });
    const resizeObserver = new ResizeObserver(applyAfterLayout);
    if (fitFormulaHost) resizeObserver.observe(content);
    document.fonts?.ready.then(applyAfterLayout).catch(() => undefined);
    applyAfterLayout();
    return () => {
      mutationObserver.disconnect();
      resizeObserver.disconnect();
      window.cancelAnimationFrame(frame);
    };
  }, [children, fitFormulaHost, growToContent, sizeScale, widthCh]);

  return (
    <span
      ref={wrapperRef}
      className={clsx(
        "qti-ext-input-blank",
        fitFormulaHost && "qti-ext-math-blank-slot-content",
        getBlankVariantClass(variant),
        growToContent && "qti-ext-input-blank--latex-content",
        stateClassName
      )}
    >
      <span ref={contentRef} className="qti-ext-input-blank__label">
        {children}
      </span>
    </span>
  );
}
