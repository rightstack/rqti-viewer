import { useEffect, useLayoutEffect, useRef } from "react";
import clsx from "clsx";
import { renderLaTeX } from "../../parser/parseLatexToReact";
import { measureDisplayContent, readBoxExtras } from "./slotMeasure";
import { type BlankVariant, getBlankVariantClass, getInputBlankStateClass } from "./utils";
import {
  alignVCQAnswerTokens,
  readNarrowSlotsInMerge,
  tokenizeVCQColumnAnswer,
} from "./vcqMergedAlign";

type MergedBlankSlotProps = {
  id: string;
  value: string;
  displayLabel?: string;
  displayOnly: boolean;
  isReadOnly: boolean;
  alignClass?: string;
  mergedColSpan: number;
  contextElement: Element;
  onChange: (id: string, value: string) => void;
  isSubmit?: boolean;
  correctAnswer?: string;
  forceSelected?: boolean;
  displayVariant?: BlankVariant;
};

function applyMergedFallbackWidth(box: HTMLElement, contentW: number) {
  box.style.width = "";
  box.style.minWidth = "";
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
  mergedColSpan,
  contextElement,
  onChange,
  isSubmit,
  correctAnswer,
  forceSelected,
  displayVariant = "blank-box",
}: MergedBlankSlotProps) {
  const sizerRef = useRef<HTMLSpanElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const displayRef = useRef<HTMLSpanElement>(null);
  const labelRef = useRef<HTMLSpanElement>(null);
  const text = displayOnly ? (displayLabel ?? "") : value;
  const tokens = tokenizeVCQColumnAnswer(text);
  const slots = tokens
    ? alignVCQAnswerTokens(tokens, mergedColSpan, readNarrowSlotsInMerge(contextElement))
    : null;
  const isFallback = !slots;
  const stateClassName = getInputBlankStateClass({
    value: text,
    isSubmit,
    correctAnswer,
    forceSelected,
  });

  useLayoutEffect(() => {
    const input = inputRef.current;
    if (!input || displayOnly || isReadOnly) return;
    if (!isFallback) {
      input.style.width = "";
      input.style.minWidth = "";
      return;
    }
    applyMergedFallbackWidth(input, sizerRef.current?.scrollWidth ?? 0);
  }, [displayOnly, isFallback, isReadOnly, value]);

  useEffect(() => {
    if (!(displayOnly || isReadOnly)) return;
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
      applyMergedFallbackWidth(box, size.w);
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
  }, [displayOnly, isFallback, isReadOnly, text]);

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
            (displayOnly || isReadOnly
              ? renderLaTeX(slot.token, `merged-math-${id}-${slot.column}`, false)
              : slot.token)}
        </span>
      ))}
      {displayOnly || isReadOnly ? (
        <span
          ref={displayRef}
          className={clsx(
            "qti-ext-input-blank qti-ext-vcq-merged-display",
            isFallback && "qti-ext-vcq-merged-display--fallback",
            getBlankVariantClass(displayVariant),
            stateClassName,
            alignClass
          )}
        >
          {isFallback && text ? (
            <span ref={labelRef} className="qti-ext-input-blank__label">
              {renderLaTeX(text, `merged-val-${id}`, false)}
            </span>
          ) : null}
        </span>
      ) : (
        <>
          {isFallback && (
            <span ref={sizerRef} className="qti-ext-vcq-merged-fallback-sizer" aria-hidden="true">
              {value || "\u00a0"}
            </span>
          )}
          <input
            ref={inputRef}
            className={clsx(
              "qti-ext-input-blank qti-ext-text-entry-input qti-ext-vcq-merged-input",
              isFallback && "qti-ext-vcq-merged-input--fallback",
              stateClassName,
              alignClass
            )}
            type="text"
            size={1}
            value={value}
            data-response-identifier={id}
            aria-label={`${id} 입력`}
            onChange={(e) => onChange(id, e.target.value)}
          />
        </>
      )}
    </>
  );
}
