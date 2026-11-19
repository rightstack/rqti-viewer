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
import {
  isVcqFlowMerge,
  readMergedCellRange,
  readVcqSharedColTemplate,
} from "../../parser/vcqDomProps";
import { isMathLatexAnswer } from "../../utils";
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

const MERGED_FALLBACK_SELECTOR =
  ".qti-ext-vcq-merged-input--fallback, .qti-ext-vcq-merged-display--fallback";

/** `minmax` 안의 쉼표·공백은 두고, 트랙 사이 공백만 자른다. */
function splitColumnTracks(template: string): string[] {
  const tracks: string[] = [];
  let depth = 0;
  let start = 0;
  for (let index = 0; index < template.length; index += 1) {
    const char = template[index];
    if (char === "(") depth += 1;
    else if (char === ")") depth = Math.max(0, depth - 1);
    else if (char === " " && depth === 0) {
      const piece = template.slice(start, index).trim();
      if (piece) tracks.push(piece);
      start = index + 1;
    }
  }
  const last = template.slice(start).trim();
  if (last) tracks.push(last);
  return tracks;
}

function clearFallbackBox(box: HTMLElement, flowMinWidth?: string) {
  box.style.width = "";
  box.style.minWidth = flowMinWidth ?? "";
  box.style.maxWidth = "";
  box.style.height = "";
  box.style.minHeight = "";
  box.style.maxHeight = "";
  box.style.boxSizing = "";
  box.style.position = "";
  box.style.inset = "";
  box.style.right = "";
}

function clearFallbackCell(cell: HTMLElement) {
  cell.style.width = "";
  cell.style.justifySelf = "";
  cell.style.gridTemplateColumns = "";
  cell.style.height = "";
  cell.style.maxHeight = "";
  cell.style.zIndex = "";
}

function clearMergedColumnWidths(grid: HTMLElement) {
  for (let index = grid.style.length - 1; index >= 0; index -= 1) {
    const name = grid.style.item(index);
    if (name?.startsWith("--vcq-col-") && name.endsWith("-merged")) grid.style.removeProperty(name);
  }
}

/**
 * 한 그리드의 fallback을 한 번에 맞춘다.
 * 빈칸이 걸친 열의 합보다 넓으면 그 열들에 넘치는 너비를 나눠 `--vcq-col-N-merged`로 같이 키운다.
 */
function syncMergedFallbackGrid(grid: HTMLElement) {
  const boxes = Array.from(grid.querySelectorAll<HTMLElement>(MERGED_FALLBACK_SELECTOR));
  grid.style.gridTemplateColumns = "";
  clearMergedColumnWidths(grid);
  for (const box of boxes) {
    const cell = box.closest<HTMLElement>(".qti-ext-vcq-cell--merged");
    if (!cell || cell === box) continue;
    clearFallbackCell(cell);
    box.style.width = "0";
    box.style.minWidth = "0";
    box.style.maxWidth = "0";
  }
  void grid.offsetWidth;

  const natural = getComputedStyle(grid)
    .gridTemplateColumns.split(/\s+/)
    .map((track) => track.trim())
    .filter(Boolean);
  const tracks = splitColumnTracks(readVcqSharedColTemplate(grid) ?? "");
  const floors = new Map<HTMLElement, number>();
  for (const box of boxes) {
    const cell = box.closest<HTMLElement>(".qti-ext-vcq-cell--merged");
    if (!cell || cell === box) continue;
    floors.set(cell, cell.getBoundingClientRect().width);
  }

  const canShare = tracks.length > 0 && tracks.length === natural.length;
  const columnWidth = new Map<number, number>();
  const growth: Array<{ box: HTMLElement; boxWidth: number }> = [];
  const small = grid.classList.contains("qti-ext-vcq-grid--size-small");

  if (canShare) {
    for (const box of boxes) {
      const cell = box.closest<HTMLElement>(".qti-ext-vcq-cell--merged");
      if (!cell || cell === box) continue;
      const contentW = Number.parseFloat(box.dataset.vcqFallbackContent ?? "");
      if (!Number.isFinite(contentW) || contentW <= 0) continue;
      const range = readMergedCellRange(cell);
      if (!range) continue;
      const { padX, borderX } = readBoxExtras(getComputedStyle(box));
      const targetW = contentW + padX + borderX;
      const floor = floors.get(cell) ?? 0;
      let boxWidth = 0;
      let cellNeed = 0;
      if (small) {
        const inset = parseFloat(getComputedStyle(grid).getPropertyValue("--vcq-box-inset")) || 0;
        const insetX = inset * 2;
        if (targetW <= Math.max(0, floor - insetX) + 0.5) continue;
        boxWidth = Math.ceil(targetW);
        cellNeed = Math.ceil(targetW + insetX);
      } else if (targetW <= floor + 0.5) {
        continue;
      } else {
        cellNeed = Math.ceil(targetW);
      }
      const spanned = Array.from(
        { length: range.colSpan },
        (_, offset) => range.startCol + offset
      ).filter((index) => tracks[index]?.includes(`--vcq-col-${index + 1}-merged`));
      const extra = cellNeed - floor;
      if (spanned.length === 0 || extra <= 0) {
        if (boxWidth > 0) growth.push({ box, boxWidth });
        continue;
      }
      let consumed = 0;
      spanned.forEach((index, order) => {
        const base = Number.parseFloat(natural[index] ?? "") || 0;
        const add = order === spanned.length - 1 ? extra - consumed : extra / spanned.length;
        if (order !== spanned.length - 1) consumed += add;
        const next = base + add;
        columnWidth.set(index, Math.max(columnWidth.get(index) ?? 0, next));
      });
      if (boxWidth > 0) growth.push({ box, boxWidth });
    }
  }

  for (const [index, width] of columnWidth) {
    grid.style.setProperty(`--vcq-col-${index + 1}-merged`, `${width.toFixed(2)}px`);
  }

  for (const box of boxes) {
    const flowMin = box.dataset.vcqFallbackFlowMin;
    clearFallbackBox(box, flowMin || undefined);
  }
  for (const item of growth) {
    const width = `${item.boxWidth}px`;
    item.box.style.right = "auto";
    item.box.style.width = width;
    item.box.style.minWidth = width;
  }
}

function releaseMergedFallback(box: HTMLElement) {
  delete box.dataset.vcqFallbackContent;
  delete box.dataset.vcqFallbackFlowMin;
  clearFallbackBox(box);
  const grid = box.closest<HTMLElement>(".qti-ext-vcq-grid");
  const cell = box.closest<HTMLElement>(".qti-ext-vcq-cell--merged");
  if (cell && cell !== box) clearFallbackCell(cell);
  if (grid) syncMergedFallbackGrid(grid);
}

function applyMergedFallbackWidth(box: HTMLElement, contentW: number, flowMinWidth?: string) {
  const grid = box.closest<HTMLElement>(".qti-ext-vcq-grid");
  const cell = box.closest<HTMLElement>(".qti-ext-vcq-cell--merged");
  if (!grid || !cell || cell === box) {
    clearFallbackBox(box, flowMinWidth);
    const floor =
      cell?.getBoundingClientRect().width ||
      (cell ? parseFloat(getComputedStyle(cell).minWidth) : 0) ||
      0;
    const { padX, borderX } = readBoxExtras(getComputedStyle(box));
    const targetW = contentW + padX + borderX;
    if (targetW <= floor) return;
    box.style.width = `${targetW}px`;
    box.style.minWidth = `${targetW}px`;
    return;
  }
  box.dataset.vcqFallbackContent = String(contentW);
  if (flowMinWidth) box.dataset.vcqFallbackFlowMin = flowMinWidth;
  else delete box.dataset.vcqFallbackFlowMin;
  syncMergedFallbackGrid(grid);
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
      releaseMergedFallback(input);
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
      releaseMergedFallback(box);
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
            (isReadOnly && isMathLatexAnswer(slot.token)
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
