import type { CSSProperties } from "react";

const VCQ_GRID_CLASS = "qti-ext-vcq-grid";
const VCQ_ROW_CLASS = "qti-ext-vcq-row";
const VCQ_CELL_CLASS = "qti-ext-vcq-cell";
const VCQ_MERGED_CLASS = "qti-ext-vcq-cell--merged";
const VCQ_NARROW_CLASS = "qti-ext-vcq-col--narrow";

function classNamesOf(element: Element): string[] {
  return (element.getAttribute("class") ?? "").split(/\s+/).filter(Boolean);
}

export function isVcqRow(element: Element): boolean {
  return classNamesOf(element).includes(VCQ_ROW_CLASS);
}

export function isVcqCell(element: Element): boolean {
  return classNamesOf(element).includes(VCQ_CELL_CLASS);
}

export function isNarrowCell(element: Element): boolean {
  if (classNamesOf(element).includes(VCQ_NARROW_CLASS)) return true;
  const unit = Number.parseFloat(element.getAttribute("data-vcq-width-unit") ?? "");
  return Number.isFinite(unit) && unit > 0 && unit < 1;
}

export function cellSpan(element: Element): number {
  const n = Number.parseInt(element.getAttribute("data-vcq-colspan") ?? "1", 10);
  return Number.isFinite(n) && n >= 2 ? n : 1;
}

type VcqColTrack = {
  template: string;
  minSize: string;
  shrinks: boolean;
};

function sizedTrack(minSize: string, shrinks: boolean, grow: boolean): VcqColTrack {
  return {
    template: grow ? `minmax(calc(${minSize}), max-content)` : `calc(${minSize})`,
    minSize,
    shrinks,
  };
}

function vcqColTrack(
  index: number,
  narrowCols: Set<number>,
  widthUnits: Map<number, number>
): VcqColTrack {
  if (narrowCols.has(index)) {
    return sizedTrack("var(--vcq-narrow) + 2 * var(--vcq-pad)", true, false);
  }
  const unit = widthUnits.get(index);
  if (unit !== undefined && unit !== 1) {
    return sizedTrack(`var(--vcq-cell) * ${unit} + 2 * var(--vcq-pad)`, unit < 1, unit >= 1);
  }
  return sizedTrack("var(--vcq-cell) + 2 * var(--vcq-pad)", false, true);
}

function readVcqColTracks(grid: Element): VcqColTrack[] | undefined {
  const names = classNamesOf(grid);
  if (!names.includes(VCQ_GRID_CLASS)) return undefined;
  if (names.some((name) => name.includes("template-synthetic"))) {
    return undefined;
  }
  if (Array.from(grid.children).some(isVcqCell)) return undefined;

  const rows = Array.from(grid.children).filter(isVcqRow);
  if (rows.length === 0) return undefined;

  let maxCols = 0;
  const narrowCols = new Set<number>();
  const widthUnits = new Map<number, number>();

  for (const row of rows) {
    let col = 0;
    for (const child of Array.from(row.children)) {
      if (!isVcqCell(child)) continue;
      const span = cellSpan(child);
      if (isNarrowCell(child) && span === 1) {
        narrowCols.add(col);
      }
      const unit = Number.parseFloat(child.getAttribute("data-vcq-width-unit") ?? "");
      if (Number.isFinite(unit) && unit > 0) {
        for (let offset = 0; offset < span; offset += 1) widthUnits.set(col + offset, unit);
      }
      col += span;
    }
    maxCols = Math.max(maxCols, col);
  }

  if (maxCols === 0) return undefined;

  return Array.from({ length: maxCols }, (_, index) => vcqColTrack(index, narrowCols, widthUnits));
}

/** 행 셀에서 공통 트랙. 조립제 자체 그리드는 건너뛴다. */
export function readVcqSharedColTemplate(grid: Element): string | undefined {
  return readVcqColTracks(grid)
    ?.map((track) => track.template)
    .join(" ");
}

export function findMergedVcqCell(element: Element): Element | undefined {
  let current: Element | null = element;
  while (current) {
    const names = classNamesOf(current);
    if (names.includes(VCQ_MERGED_CLASS)) return current;
    if (names.includes(VCQ_GRID_CLASS)) return undefined;
    current = current.parentElement;
  }
  return undefined;
}

export function readMergedCellRange(
  cell: Element
): { grid: Element; row: Element; startCol: number; colSpan: number } | undefined {
  const colSpan = cellSpan(cell);
  if (colSpan < 2) return undefined;
  const row = cell.parentElement;
  if (!row || !isVcqRow(row)) return undefined;

  let startCol = 0;
  let found = false;
  for (const child of Array.from(row.children)) {
    if (child === cell) {
      found = true;
      break;
    }
    if (isVcqCell(child)) startCol += cellSpan(child);
  }
  if (!found) return undefined;

  const grid = row.parentElement;
  if (!grid || !classNamesOf(grid).includes(VCQ_GRID_CLASS)) return undefined;
  return { grid, row, startCol, colSpan };
}

function readMergedTrackSum(
  cell: Element,
  colspan: number
): { minWidth: string; colTemplate: string } | undefined {
  const range = readMergedCellRange(cell);
  if (!range || range.colSpan !== colspan) return undefined;
  const tracks = readVcqColTracks(range.grid);
  if (!tracks) return undefined;

  const slice = tracks.slice(range.startCol, range.startCol + colspan);
  if (slice.length !== colspan || !slice.some((track) => track.shrinks)) return undefined;

  return {
    minWidth: `calc(${slice.map((track) => track.minSize).join(" + ")})`,
    colTemplate: slice.map((track) => track.template).join(" "),
  };
}

const VCQ_DATA_KEYS = [
  "data-vcq-height",
  "data-vcq-colspan",
  "data-vcq-width-unit",
  "data-vcq-line-width",
  "data-vcq-border-top",
  "data-vcq-border-right",
  "data-vcq-border-bottom",
  "data-vcq-border-left",
  "data-vcq-border-style",
  "data-vcq-grid-column",
  "data-vcq-grid-row",
] as const;

type VcqDataKey = (typeof VCQ_DATA_KEYS)[number];

function readPxToken(raw: string | null): number | undefined {
  if (!raw) return undefined;
  const n = Number.parseFloat(raw);
  return Number.isFinite(n) && n > 0 ? n : undefined;
}

function readSpanToken(raw: string | null): number | undefined {
  if (!raw) return undefined;
  const n = Number.parseInt(raw, 10);
  return Number.isFinite(n) && n >= 2 ? n : undefined;
}

function borderWidth(raw: string | null): string | undefined {
  const n = readPxToken(raw);
  return n !== undefined ? `${n}px` : undefined;
}

/** VCQ allowlist: data-vcq-* 와 그에 대응하는 CSS 변수·스타일만 보존 */
export function collectVcqDomProps(element: Element): {
  dataAttrs: Record<string, string>;
  style?: CSSProperties;
} {
  const dataAttrs: Record<string, string> = {};
  const style: CSSProperties & Record<string, string | number> = {};

  for (const key of VCQ_DATA_KEYS) {
    const value = element.getAttribute(key);
    if (value) dataAttrs[key] = value;
  }

  const height = readPxToken(element.getAttribute("data-vcq-height"));
  if (height !== undefined) {
    style.height = `${height}px`;
    style["--vcq-row-height"] = `${height}px`;
  }

  const colspan = readSpanToken(element.getAttribute("data-vcq-colspan"));
  if (colspan !== undefined) {
    style["--vcq-blank-col-span"] = String(colspan);
    const mergedTracks = readMergedTrackSum(element, colspan);
    if (mergedTracks) {
      style["--vcq-merged-min-width"] = mergedTracks.minWidth;
      style["--vcq-merged-col-template"] = mergedTracks.colTemplate;
    }
    style.minWidth = `var(--vcq-merged-min-width, calc(var(--vcq-cell) * ${colspan}))`;
  }

  const widthUnit = element.getAttribute("data-vcq-width-unit");
  if (widthUnit) style["--vcq-width-unit"] = widthUnit;

  const colTemplate = readVcqSharedColTemplate(element);
  if (colTemplate) style["--vcq-col-template"] = colTemplate;

  const gridColumn = element.getAttribute("data-vcq-grid-column");
  if (gridColumn) style.gridColumn = gridColumn;
  const gridRow = element.getAttribute("data-vcq-grid-row");
  if (gridRow) style.gridRow = gridRow;

  const lineWidth = borderWidth(element.getAttribute("data-vcq-line-width"));
  if (lineWidth) style["--vcq-line-width"] = lineWidth;

  const dash = element.getAttribute("data-vcq-border-style");
  const borderStyle = dash === "dashed" ? "dashed" : "solid";
  const sides: Array<[VcqDataKey, string]> = [
    ["data-vcq-border-top", "borderTop"],
    ["data-vcq-border-right", "borderRight"],
    ["data-vcq-border-bottom", "borderBottom"],
    ["data-vcq-border-left", "borderLeft"],
  ];
  for (const [attr, prop] of sides) {
    const width = borderWidth(element.getAttribute(attr));
    if (width) style[prop] = `${width} ${borderStyle} #1f2328`;
  }

  return {
    dataAttrs,
    style: Object.keys(style).length > 0 ? style : undefined,
  };
}
