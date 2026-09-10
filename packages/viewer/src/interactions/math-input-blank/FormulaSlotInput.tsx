import { type ReactNode, useEffect, useLayoutEffect, useRef } from "react";
import clsx from "clsx";
import { MATH_BLANK_DISPLAY_SCALE, markerSlotWidthEm, markerSlotWidthPx } from "./mathBlankLatex";
import { measureDisplayContent, readBoxExtras } from "./slotMeasure";
import { type BlankVariant, getBlankVariantClass, getInputBlankStateClass } from "./utils";

type FormulaSlotInputProps = {
  id: string;
  value: string;
  /** `\inputblank{ID}{N}` 의 N — 최소 N글자 폭 */
  widthCh?: number;
  readOnly: boolean;
  alignClass: string | undefined;
  onChange: (id: string, value: string) => void;
  isSubmit?: boolean;
  correctAnswer?: string;
  forceSelected?: boolean;
};

function applySlotBox(slot: HTMLElement, targetW: number, targetH: number) {
  slot.style.width = `${targetW}px`;
  slot.style.minWidth = `${targetW}px`;
  slot.style.height = `${targetH}px`;
  slot.style.minHeight = `${targetH}px`;
}

function fitSlotToContent(
  box: HTMLElement,
  blankStyle: CSSStyleDeclaration,
  contentW: number,
  contentH: number,
  widthCh: number | undefined,
  scale = 1
) {
  const { padX, padY, borderX, borderY } = readBoxExtras(blankStyle);
  const fontSize = parseFloat(blankStyle.fontSize) || 16;
  const baseWidth = markerSlotWidthPx(widthCh, fontSize) * scale;
  const baseHeight = markerSlotWidthPx(1, fontSize) * scale;
  applySlotBox(
    box,
    Math.max(baseWidth, contentW + padX + borderX),
    Math.max(baseHeight, contentH + padY + borderY)
  );
}

function fitInputSlotWidth(
  box: HTMLElement,
  blankStyle: CSSStyleDeclaration,
  contentW: number,
  widthCh: number | undefined
) {
  const { padX, borderX } = readBoxExtras(blankStyle);
  const fontSize = parseFloat(blankStyle.fontSize) || 16;
  applySlotBox(
    box,
    Math.max(markerSlotWidthPx(widthCh, fontSize), contentW + padX + borderX),
    markerSlotWidthPx(1, fontSize)
  );
}

/** 수식 슬롯 input. 높이는 고정, 너비는 {N} 하한에서 긴 글자만 키운다. */
export function FormulaSlotInput({
  id,
  value,
  widthCh,
  readOnly,
  alignClass,
  onChange,
  isSubmit,
  correctAnswer,
  forceSelected,
}: FormulaSlotInputProps) {
  const wrapperRef = useRef<HTMLSpanElement>(null);
  const sizerRef = useRef<HTMLSpanElement>(null);

  useLayoutEffect(() => {
    const wrapper = wrapperRef.current;
    const sizer = sizerRef.current;
    if (!wrapper) return;
    const box = wrapper.closest<HTMLElement>(".qti-ext-mjx-blank-slot") ?? wrapper;
    fitInputSlotWidth(box, getComputedStyle(wrapper), sizer?.scrollWidth ?? 0, widthCh);
  }, [value, widthCh]);

  return (
    <span
      ref={wrapperRef}
      className={clsx(
        "qti-ext-math-blank-field qti-ext-input-blank qti-ext-text-entry-input",
        getInputBlankStateClass({ value, isSubmit, correctAnswer, forceSelected })
      )}
      style={{ minWidth: markerSlotWidthEm(widthCh) }}
    >
      <span ref={sizerRef} className="qti-ext-input-blank__sizer" aria-hidden="true">
        {value || "\u00a0"}
      </span>
      <input
        className={clsx("qti-ext-input-blank__field", alignClass)}
        type="text"
        size={1}
        value={value}
        readOnly={readOnly}
        data-response-identifier={id}
        aria-label={`${id} 입력`}
        onChange={(e) => onChange(id, e.target.value)}
      />
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
};

/** MathJax 표시. 값이 있으면 조판 후 슬롯을 맞춘다. `fillSlot`이면 빈 상자 크기를 유지한다. */
export function FormulaSlotLatexDisplay({
  children,
  widthCh,
  stateClassName,
  variant = "blank-box",
  fillSlot = false,
}: FormulaSlotLatexDisplayProps) {
  const wrapperRef = useRef<HTMLSpanElement>(null);
  const contentRef = useRef<HTMLSpanElement>(null);
  const growToContent = !fillSlot;
  const sizeScale = variant === "blank-box" ? MATH_BLANK_DISPLAY_SCALE : 1;

  useEffect(() => {
    if (!growToContent) return;
    const wrapper = wrapperRef.current;
    const content = contentRef.current;
    if (!wrapper) return;
    const box = wrapper.closest<HTMLElement>(".qti-ext-mjx-blank-slot") ?? wrapper;
    let applied = false;
    let frame = 0;

    const tryApply = () => {
      if (applied) return true;
      const hasMathHost = !!content?.querySelector(".qti-ext-mathfield, mjx-container");
      const size = measureDisplayContent(content);
      if (size.w === 0 && size.h === 0 && (hasMathHost || content?.textContent?.trim())) {
        return false;
      }
      applied = true;
      fitSlotToContent(box, getComputedStyle(wrapper), size.w, size.h, widthCh, sizeScale);
      return true;
    };

    const applyAfterLayout = () => {
      frame = window.requestAnimationFrame(() => {
        if (tryApply()) return;
      });
    };

    if (tryApply()) return;
    if (!content) return;

    const observer = new MutationObserver(() => {
      applyAfterLayout();
    });
    observer.observe(content, { childList: true, subtree: true });
    applyAfterLayout();
    return () => {
      applied = true;
      observer.disconnect();
      window.cancelAnimationFrame(frame);
    };
  }, [children, growToContent, sizeScale, widthCh]);

  return (
    <span
      ref={wrapperRef}
      className={clsx(
        "qti-ext-input-blank",
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
