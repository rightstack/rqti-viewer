import {
  cellSpan,
  findMergedVcqCell,
  isNarrowCell,
  isVcqCell,
  isVcqRow,
  readMergedCellRange,
} from "../../parser/vcqDomProps";

/** 단순 숫자는 자릿수 토큰, 빈 값·복합 LaTeX는 null */
export function tokenizeVCQColumnAnswer(answer: string): string[] | null {
  const value = answer.trim();
  if (!value) return null;
  const isSimpleNumber = /^[+\-−]?(?:\d+(?:\.\d+)?|\d{1,3}(?:,\d{3})+(?:\.\d+)?)$/.test(value);
  if (!isSimpleNumber) return null;
  return Array.from(value);
}

export interface VCQAnswerColumnSlot {
  column: number;
  token: string | null;
}

/** 토큰을 병합 열에 오른쪽 정렬. narrow 슬롯이 있으면 소수점 전용으로 비워 둔다. */
export function alignVCQAnswerTokens(
  tokens: string[],
  colSpan: number,
  narrowSlots?: ReadonlySet<number>
): VCQAnswerColumnSlot[] | null {
  if (colSpan < 2 || tokens.length === 0) return null;

  if (!narrowSlots || narrowSlots.size === 0) {
    if (tokens.length > colSpan) return null;
    return Array.from({ length: colSpan }, (_, index) => {
      const tokenIndex = index - (colSpan - tokens.length);
      return { column: index + 1, token: tokenIndex >= 0 ? tokens[tokenIndex] : null };
    });
  }

  const dotIndex = tokens.findIndex((t) => t === ".");
  const normalTokens =
    dotIndex >= 0 ? [...tokens.slice(0, dotIndex), ...tokens.slice(dotIndex + 1)] : tokens;

  const normalSlots: number[] = [];
  for (let i = 0; i < colSpan; i++) {
    if (!narrowSlots.has(i)) normalSlots.push(i);
  }

  if (normalTokens.length > normalSlots.length) return null;

  const offset = normalSlots.length - normalTokens.length;

  return Array.from({ length: colSpan }, (_, i) => {
    if (narrowSlots.has(i)) {
      return { column: i + 1, token: dotIndex >= 0 ? "." : null };
    }
    const nIdx = normalSlots.indexOf(i) - offset;
    return { column: i + 1, token: nIdx >= 0 ? normalTokens[nIdx] : null };
  });
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

/** 병합 구간과 교차하는 narrow(소수점) 슬롯의 로컬 인덱스 */
export function readNarrowSlotsInMerge(element: Element): ReadonlySet<number> {
  const empty: ReadonlySet<number> = new Set();
  const mergedCell = findMergedVcqCell(element);
  if (!mergedCell) return empty;
  const range = readMergedCellRange(mergedCell);
  if (!range) return empty;

  const result = new Set<number>();
  for (const sibRow of Array.from(range.grid.children)) {
    if (sibRow === range.row || !isVcqRow(sibRow)) continue;
    let col = 0;
    for (const cell of Array.from(sibRow.children)) {
      if (!isVcqCell(cell)) continue;
      const span = cellSpan(cell);
      if (isNarrowCell(cell)) {
        for (let i = 0; i < span; i++) {
          const local = col + i - range.startCol;
          if (local >= 0 && local < range.colSpan) result.add(local);
        }
      }
      col += span;
    }
    if (result.size > 0) break;
  }
  return result;
}
