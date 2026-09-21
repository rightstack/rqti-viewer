import { stripOuterMathDelimiters } from "../../utils/latex";
import {
  cellSpan,
  findMergedVcqCell,
  isNarrowCell,
  isVcqCell,
  isVcqRow,
  readMergedCellRange,
} from "../../parser/vcqDomProps";

type ColumnTrack = { separator?: "." | "," | "" };
type ColumnSlot = { column: number; token: string | null };
type ColumnAlign = "left" | "center" | "right";

function tokenizeColumnContent(content: string): string[] | null {
  const value = stripOuterMathDelimiters(content);
  if (!value) return [];
  const isSimpleNumber = /^[+\-−]?(?:\d+(?:\.\d+)?|\d{1,3}(?:,\d{3})+(?:\.\d+)?)$/.test(value);
  if (!isSimpleNumber) return null;
  return Array.from(value);
}

function placeTokens(
  slots: ColumnSlot[],
  indexes: number[],
  tokens: string[],
  align: ColumnAlign
): boolean {
  if (tokens.length > indexes.length) return false;
  const remainingColumns = indexes.length - tokens.length;
  const start =
    align === "left" ? 0 : align === "center" ? Math.floor(remainingColumns / 2) : remainingColumns;
  tokens.forEach((token, index) => {
    slots[indexes[start + index]].token = token;
  });
  return true;
}

function alignColumnTokens(
  tokens: string[],
  columns: readonly ColumnTrack[],
  align: ColumnAlign
): ColumnSlot[] | null {
  if (columns.length < 2) return null;
  const slots: ColumnSlot[] = columns.map((_, index) => ({ column: index + 1, token: null }));
  const separatorIndexes = columns.flatMap((column, index) =>
    column.separator !== undefined ? [index] : []
  );
  const valueIndexes = columns.flatMap((column, index) =>
    column.separator !== undefined ? [] : [index]
  );
  const allIndexes = columns.map((_, index) => index);

  if (separatorIndexes.length === 0) {
    return placeTokens(slots, allIndexes, tokens, align) ? slots : null;
  }

  const separators = tokens.flatMap((token, index) =>
    token === "." || token === "," ? [index] : []
  );
  if (separators.length === 0) {
    const placementIndexes = valueIndexes.length >= 2 ? valueIndexes : allIndexes;
    return placeTokens(slots, placementIndexes, tokens, align) ? slots : null;
  }
  if (separators.length > separatorIndexes.length) return null;

  const separatorTrackIndexes = separatorIndexes.slice(separatorIndexes.length - separators.length);
  let previousTokenIndex = -1;
  let previousTrackIndex = -1;

  for (let index = 0; index < separators.length; index += 1) {
    const separatorTokenIndex = separators[index];
    const separatorTrackIndex = separatorTrackIndexes[index];
    const segmentTokens = tokens.slice(previousTokenIndex + 1, separatorTokenIndex);
    const segmentTrackIndexes = valueIndexes.filter(
      (trackIndex) => trackIndex > previousTrackIndex && trackIndex < separatorTrackIndex
    );
    if (!placeTokens(slots, segmentTrackIndexes, segmentTokens, "right")) return null;
    slots[separatorTrackIndex].token = tokens[separatorTokenIndex];
    previousTokenIndex = separatorTokenIndex;
    previousTrackIndex = separatorTrackIndex;
  }

  const trailingTokens = tokens.slice(previousTokenIndex + 1);
  const trailingTrackIndexes = valueIndexes.filter((trackIndex) => trackIndex > previousTrackIndex);
  if (!placeTokens(slots, trailingTrackIndexes, trailingTokens, "left")) return null;
  return slots;
}

function readCellText(cell: Element): string {
  const mathfield = cell.querySelector(".qti-ext-mathfield");
  return (
    mathfield?.getAttribute("data-latex")?.trim() ||
    mathfield?.textContent?.trim() ||
    cell.textContent?.trim() ||
    ""
  );
}

function readMergedColumnTracks(element: Element): ColumnTrack[] {
  const mergedCell = findMergedVcqCell(element);
  if (!mergedCell) return [];
  const range = readMergedCellRange(mergedCell);
  const colSpan = range?.colSpan ?? cellSpan(mergedCell);
  if (colSpan < 2) return [];

  const tracks: ColumnTrack[] = Array.from({ length: colSpan }, () => ({}));
  const trackValues: string[][] = Array.from({ length: colSpan }, () => []);
  if (!range) return tracks;

  for (const sibRow of Array.from(range.grid.children)) {
    if (sibRow === range.row || !isVcqRow(sibRow)) continue;
    let col = 0;
    for (const cell of Array.from(sibRow.children)) {
      if (!isVcqCell(cell)) continue;
      const span = cellSpan(cell);
      const local = col - range.startCol;
      if (span === 1 && local >= 0 && local < range.colSpan && isNarrowCell(cell)) {
        const isBlank =
          cell.classList.contains("qti-ext-vcq-cell--blank") ||
          Boolean(cell.querySelector(".qti-ext-input-blank"));
        trackValues[local].push(isBlank ? "" : readCellText(cell));
      }
      col += span;
    }
  }

  trackValues.forEach((values, index) => {
    const explicitSeparator = values.find(
      (value): value is "." | "," => value === "." || value === ","
    );
    if (explicitSeparator !== undefined) {
      tracks[index].separator = explicitSeparator;
    } else if (values.length > 0) {
      tracks[index].separator = "";
    }
  });
  return tracks;
}

export function alignMergedColumnContent(
  content: string,
  element: Element,
  colSpan: number,
  alignClass?: string
): ColumnSlot[] | null {
  const tokens = tokenizeColumnContent(content);
  if (!tokens?.length || colSpan < 2) return null;
  const tracks = readMergedColumnTracks(element);
  const columns = tracks.length >= 2 ? tracks : Array.from({ length: colSpan }, () => ({}));
  return alignColumnTokens(tokens, columns, readMergedContentAlign(element, alignClass));
}

function readMergedContentAlign(element: Element, alignClass?: string): ColumnAlign {
  const explicit = alignClass?.replace("qti-align-", "");
  if (explicit === "left" || explicit === "center" || explicit === "right") return explicit;

  let current: Element | null = findMergedVcqCell(element) ?? element;
  while (current) {
    const classNames = classNamesOf(current);
    if (classNames.includes("qti-align-left")) return "left";
    if (classNames.includes("qti-align-center")) return "center";
    if (classNames.includes("qti-align-right")) return "right";
    if (classNames.includes("qti-ext-vcq-grid")) break;
    current = current.parentElement;
  }
  return "center";
}

function walkVcqAncestors(
  element: Element,
  match: (classNames: string[], node: Element) => boolean | undefined
): boolean {
  let current: Element | null = element;
  while (current) {
    const classNames = (current.getAttribute("class") ?? "").split(/\s+/);
    const result = match(classNames, current);
    if (result !== undefined) return result;
    if (classNames.includes("qti-ext-vcq-grid")) return false;
    current = current.parentElement;
  }
  return false;
}

function classNamesOf(element: Element): string[] {
  return (element.getAttribute("class") ?? "").split(/\s+/).filter(Boolean);
}

/** 좁은 열 셀이면 입력 폭을 셀에 맞춘다. `{N}ch` 인라인 min-width를 쓰지 않는다. */
export function isVcqNarrowCell(element: Element): boolean {
  return walkVcqAncestors(element, (classNames, node) => {
    if (classNames.includes("qti-ext-vcq-col--narrow")) return true;
    const unit = Number.parseFloat(node.getAttribute("data-vcq-width-unit") ?? "");
    if (Number.isFinite(unit) && unit > 0 && unit < 1) return true;
    return undefined;
  });
}

/** carry 셀(올림/받아내림) — 기본 크기는 작지만 입력 내용에 따라 확장된다. */
export function isVcqCarryCell(element: Element): boolean {
  return Boolean(element.closest(".qti-ext-vcq-cell--carry, .qti-ext-vcq-row--carry"));
}

/** 세로셈 정답칸. 래퍼를 셀에 맞추고 상자는 `__field`에 그린다. */
export function isVcqBlankCell(element: Element): boolean {
  return walkVcqAncestors(element, (classNames) =>
    classNames.includes("qti-ext-vcq-cell--blank") ? true : undefined
  );
}

const QTI_ALIGN_CLASSES = ["qti-align-left", "qti-align-center", "qti-align-right"] as const;

/** 마크업·PCI에 붙은 `qti-align-*`. 그리드/셀 클래스는 DOM에 남으므로 여기서 읽지 않는다. */
export function readMathBlankAlignClass(
  element: Element,
  markup: Element | null
): (typeof QTI_ALIGN_CLASSES)[number] | undefined {
  for (const node of [markup, element]) {
    const classNames = (node?.getAttribute("class") ?? "").split(/\s+/);
    const found = QTI_ALIGN_CLASSES.find((name) => classNames.includes(name));
    if (found) return found;
  }
  return undefined;
}

export function readMergedColSpan(element: Element): number {
  const merged = findMergedVcqCell(element);
  if (!merged) return 0;
  const n = cellSpan(merged);
  return n >= 2 ? n : 0;
}
