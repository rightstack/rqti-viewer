import {
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
import { renderLaTeX } from "../../parser/parseLatexToReact";
import { isVcqFlowMerge } from "../../parser/vcqDomProps";
import { markerSlotWidthEm } from "./mathBlankLatex";
import { measureDisplayContent, measureTextContentWidth, readBoxExtras } from "./slotMeasure";
import { type BlankVariant, getBlankVariantClass } from "./utils";
import { alignMergedColumnContent } from "./vcqMergedAlign";

type MergedBlankSlotProps = {
  id: string;
  value: string;
  displayLabel?: string;
  displayOnly: boolean;
  isReadOnly: boolean;
  alignClass?: string;
  widthCh?: number;
  mergedColSpan: number;
  contextElement: Element;
  onChange: (id: string, value: string) => void;
  stateClassName?: string;
  displayVariant?: BlankVariant;
  /** 키패드 최근 기호 저장 범위. 보통 문항 키. */
  historyScope?: string;
  level?: MathLevel | null;
};

function applyMergedFallbackWidth(box: HTMLElement, contentW: number, flowMinWidth?: string) {
  box.style.width = "";
  box.style.minWidth = flowMinWidth ?? "";
  if (box.closest(".qti-ext-vcq-grid--size-small")) return;
  const cell = box.closest<HTMLElement>(".qti-ext-vcq-cell--merged") ?? box;
  const floor =
    cell.getBoundingClientRect().width || parseFloat(getComputedStyle(cell).minWidth) || 0;
  const { padX, borderX } = readBoxExtras(getComputedStyle(box));
  const targetW = contentW + padX + borderX;
  if (targetW <= floor) return;
  box.style.width = `${targetW}px`;
  box.style.minWidth = `${targetW}px`;
}

export function MergedBlankSlot({
  id,
  value,
  displayLabel,
  displayOnly,
  isReadOnly,
  alignClass,
  widthCh,
  mergedColSpan,
  contextElement,
  onChange,
  stateClassName,
  displayVariant = "blank-box",
  historyScope,
  level,
}: MergedBlankSlotProps) {
  const useKeypad = level === "middle" || level === "high";
  const showPencil = !displayOnly && !isReadOnly && value === "";
  const inputRef = useRef<HTMLSpanElement>(null);
  const displayRef = useRef<HTMLSpanElement>(null);
  const labelRef = useRef<HTMLSpanElement>(null);
  const text = displayOnly ? (displayLabel ?? "") : value;
  const flowMerge = isVcqFlowMerge(contextElement);
  const slots = alignMergedColumnContent(text, contextElement, mergedColSpan, alignClass);
  const isFallback = !slots;
  const flowMinWidth = flowMerge ? markerSlotWidthEm(widthCh) : undefined;
  /** 임베디드 키패드가 알린 렌더 너비. 열에 못 나누는 값(fallback)일 때 칸 너비로 쓴다. */
  const [inputContentWidth, setInputContentWidth] = useState(0);
  const handleInputContentSize = useCallback((size: MathKeyboardContentSize) => {
    setInputContentWidth((prev) => (prev === size.width ? prev : size.width));
  }, []);

  useLayoutEffect(() => {
    const input = inputRef.current;
    if (!input || displayOnly || isReadOnly) return;
    if (!isFallback) {
      input.style.width = "";
      input.style.minWidth = "";
      return;
    }
    const field = useKeypad ? null : input.querySelector<HTMLInputElement>("input");
    const contentWidth = useKeypad
      ? value === ""
        ? 0
        : inputContentWidth
      : measureTextContentWidth(field, value);
    applyMergedFallbackWidth(input, contentWidth, flowMinWidth);
  }, [displayOnly, flowMinWidth, inputContentWidth, isFallback, isReadOnly, useKeypad, value]);

  useEffect(() => {
    if (displayOnly || !isReadOnly) return;
    const box = displayRef.current;
    const label = labelRef.current;
    if (!box) return;
    if (!isFallback || !text) {
      box.style.width = "";
      box.style.minWidth = "";
      return;
    }

    let applied = false;
    let frame = 0;

    const tryApply = () => {
      if (applied) return true;
      const hasMathHost = !!label?.querySelector(".qti-ext-mathfield, mjx-container");
      const size = measureDisplayContent(label);
      if (size.w === 0 && size.h === 0 && (hasMathHost || label?.textContent?.trim())) {
        return false;
      }
      applied = true;
      applyMergedFallbackWidth(box, size.w, flowMinWidth);
      return true;
    };

    const applyAfterLayout = () => {
      frame = window.requestAnimationFrame(() => {
        if (tryApply()) return;
      });
    };

    if (tryApply()) return;
    if (!label) return;

    const observer = new MutationObserver(() => {
      applyAfterLayout();
    });
    observer.observe(label, { childList: true, subtree: true });
    applyAfterLayout();
    return () => {
      applied = true;
      observer.disconnect();
      window.cancelAnimationFrame(frame);
    };
  }, [displayOnly, flowMinWidth, isFallback, isReadOnly, text]);

  return (
    <>
      {slots?.map((slot) => (
        <span
          key={slot.column}
          className="qti-ext-vcq-merged-answer-slot"
          style={{ gridColumn: slot.column }}
          aria-hidden="true"
        >
          {slot.token &&
            (isReadOnly
              ? renderLaTeX(slot.token, `merged-math-${id}-${slot.column}`, false)
              : slot.token)}
        </span>
      ))}
      {displayOnly ? (
        <span
          className={clsx(
            "qti-ext-input-blank",
            getBlankVariantClass(displayVariant),
            !displayOnly && isFallback && text && "qti-ext-input-blank--latex-content",
            stateClassName,
            isFallback && alignClass
          )}
        >
          {isFallback && text ? (
            <span className="qti-ext-input-blank__label">
              {renderLaTeX(text, `merged-val-${id}`, false)}
            </span>
          ) : null}
        </span>
      ) : isReadOnly ? (
        <span
          ref={displayRef}
          className={clsx(
            "qti-ext-input-blank qti-ext-vcq-merged-display",
            isFallback && "qti-ext-vcq-merged-display--fallback",
            getBlankVariantClass(displayVariant),
            stateClassName,
            isFallback && alignClass
          )}
        >
          {isFallback && text ? (
            <span ref={labelRef} className="qti-ext-input-blank__label">
              {renderLaTeX(text, `merged-val-${id}`, false)}
            </span>
          ) : null}
        </span>
      ) : (
        <span
          ref={inputRef}
          className={clsx(
            "qti-ext-input-blank qti-ext-text-entry-input qti-ext-vcq-merged-input",
            useKeypad && "qti-ext-vcq-merged-input--keypad",
            isFallback && "qti-ext-vcq-merged-input--fallback",
            stateClassName,
            isFallback && alignClass
          )}
          data-response-identifier={id}
          onPointerDown={
            useKeypad
              ? (event: ReactPointerEvent<HTMLSpanElement>) => {
                  if (event.button !== 0) return;
                  const valueEl = inputRef.current?.querySelector<HTMLElement>(
                    ".qti-ext-math-keyboard-value"
                  );
                  if (!valueEl || valueEl.contains(event.target as Node)) return;
                  event.preventDefault();
                  valueEl.click();
                }
              : undefined
          }
        >
          {useKeypad ? (
            <MathKeyboard
              embedded
              value={value}
              onChange={(latex) => onChange(id, latex)}
              level={level}
              historyScope={historyScope}
              onContentSize={handleInputContentSize}
              ariaLabel={`${id} 입력`}
            />
          ) : (
            <input
              className="qti-ext-input-blank__field"
              type="text"
              size={1}
              value={value}
              data-response-identifier={id}
              aria-label={`${id} 입력`}
              onChange={(event) => onChange(id, event.target.value)}
            />
          )}
          {showPencil ? <Pencil className="qti-ext-text-entry-pencil" aria-hidden="true" /> : null}
        </span>
      )}
    </>
  );
}
