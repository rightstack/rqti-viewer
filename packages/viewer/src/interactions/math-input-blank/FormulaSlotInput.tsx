import { type ReactNode, useEffect, useLayoutEffect, useRef } from "react";
import clsx from "clsx";
import {
  MATH_BLANK_DISPLAY_SCALE,
  type SlotContentEm,
  markerSlotWidthEm,
  markerSlotWidthPx,
} from "./mathBlankLatex";
import { measureDisplayContent, measureSizerContentWidth, readBoxExtras } from "./slotMeasure";
import { type BlankVariant, getBlankVariantClass } from "./utils";

type FormulaSlotInputProps = {
  id: string;
  value: string;
  /** `\inputblank{ID}{N}` 의 N — 최소 N글자 폭 */
  widthCh?: number;
  readOnly: boolean;
  alignClass: string | undefined;
  onChange: (id: string, value: string) => void;
  stateClassName?: string;
  fitFormulaHost?: boolean;
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
  stateClassName,
  fitFormulaHost = false,
}: FormulaSlotInputProps) {
  const wrapperRef = useRef<HTMLLabelElement>(null);
  const sizerRef = useRef<HTMLSpanElement>(null);

  useLayoutEffect(() => {
    const wrapper = wrapperRef.current;
    const sizer = sizerRef.current;
    if (!wrapper) return;
    const box = wrapper.closest<HTMLElement>(".qti-ext-mjx-blank-slot") ?? wrapper;
    const fit = () =>
      fitInputSlotWidth(box, getComputedStyle(wrapper), measureSizerContentWidth(sizer), widthCh);
    fit();
    document.fonts?.ready.then(fit).catch(() => undefined);
  }, [value, widthCh]);

  return (
    <label
      ref={wrapperRef}
      className={clsx(
        "qti-ext-math-blank-field qti-ext-input-blank qti-ext-text-entry-input",
        fitFormulaHost && "qti-ext-math-blank-slot-content",
        stateClassName
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
    </label>
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
