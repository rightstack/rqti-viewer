import { useMemo } from "react";

export interface MatchAnswerViewProps {
  correctResponse: string[];
  items: { rows: string[]; cols: string[] };
}

function nodeLabel(ids: string[], oneBasedIndex: number): { display: string; full: string } {
  const full = ids[oneBasedIndex - 1] ?? String(oneBasedIndex);
  const display = String(oneBasedIndex);
  return { display, full };
}

type MatchPair = { row: number; col: number };

const VIEW_MIN_X = 150;
const VIEW_W = 300;
const LEFT_X = 180;
const RIGHT_X = 400;
/** viewBox 전용(사용자 공간). 실제 원 반지름은 `NODE_R_EM` */
const VIEW_BOTTOM_PAD_U = 0;
const ROW_GAP = 42;
const OFFSET_Y = 24;

/** `--qti-feedback-description-font-size` 기준 1em (부모 g의 font-size) */
const NODE_R_EM = "0.7em";
const STROKE_WIDTH_EM = "0.1em";

const emScaleStyle = {
  fontSize: "inherit",
} as const;

/** 정답에 ROW_n/COL_m만 있고 items 배열과 순서가 다를 때 이전 동작 보존 */
const ROW_ID_FALLBACK_RE = /^ROW_(\d+)$/i;
const COL_ID_FALLBACK_RE = /^COL_(\d+)$/i;

function resolveRowLayoutPos(leftId: string, rowIds: string[]): number {
  const idx = rowIds.indexOf(leftId);
  if (idx >= 0) return idx + 1;
  const m = leftId.match(ROW_ID_FALLBACK_RE);
  if (m) return parseInt(m[1], 10);
  return 0;
}

function resolveColLayoutPos(rightId: string, colIds: string[]): number {
  const idx = colIds.indexOf(rightId);
  if (idx >= 0) return idx + 1;
  const m = rightId.match(COL_ID_FALLBACK_RE);
  if (m) return parseInt(m[1], 10);
  return 0;
}

/** `leftId rightId` 문자열들을 노드 줄 번호(1-based)로 해석. 한 쌍이라도 불가면 null */
function resolveLayoutPairs(
  values: string[],
  rowIds: string[],
  colIds: string[]
): MatchPair[] | null {
  const out: MatchPair[] = [];
  for (const v of values) {
    const trimmed = v.trim();
    const spaceIdx = trimmed.indexOf(" ");
    if (spaceIdx < 0) return null;
    const left = trimmed.slice(0, spaceIdx);
    const right = trimmed.slice(spaceIdx + 1).trim();
    if (!left || !right) return null;
    const row = resolveRowLayoutPos(left, rowIds);
    const col = resolveColLayoutPos(right, colIds);
    if (row < 1 || col < 1 || !Number.isFinite(row) || !Number.isFinite(col)) return null;
    if (rowIds.length > 0 && row > rowIds.length) return null;
    if (colIds.length > 0 && col > colIds.length) return null;
    out.push({ row, col });
  }
  return out;
}

function nodeY(oneBasedIndex: number): number {
  return OFFSET_Y + (oneBasedIndex - 1) * ROW_GAP;
}

export function MatchAnswerView({ items, correctResponse }: MatchAnswerViewProps) {
  const { rows: rowIds, cols: colIds } = items;

  const pairs = useMemo(
    () => resolveLayoutPairs(correctResponse, rowIds, colIds),
    [correctResponse, rowIds, colIds]
  );

  const ariaLabel = useMemo(() => {
    if (pairs === null || pairs.length === 0) return "";
    return pairs
      .map((p) => {
        const left = nodeLabel(rowIds, p.row);
        const right = nodeLabel(colIds, p.col);
        return `${left.full} → ${right.full}`;
      })
      .join(", ");
  }, [pairs, rowIds, colIds]);

  if (correctResponse.length === 0) return null;
  if (pairs === null) return null;

  const maxIndex = Math.max(rowIds.length, colIds.length);
  const height = OFFSET_Y + maxIndex * ROW_GAP + VIEW_BOTTOM_PAD_U;

  const rowIndices = Array.from({ length: rowIds.length }, (_, i) => i + 1);
  const colIndices = Array.from({ length: colIds.length }, (_, i) => i + 1);

  return (
    <div className="w-full min-w-0">
      <svg
        className="block w-full max-w-[280px]"
        viewBox={`${VIEW_MIN_X} 0 ${VIEW_W} ${height}`}
        preserveAspectRatio="xMidYMid meet"
        style={{
          aspectRatio: `${VIEW_W} / ${height}`,
          height: "auto",
        }}
        role="img"
        aria-label={`매칭 정답: ${ariaLabel}`}
      >
        <g style={emScaleStyle}>
          <g>
            {pairs.map((p, i) => (
              <line
                // eslint-disable-next-line react/no-array-index-key
                key={`${p.row}-${p.col}-${i}`}
                x1={LEFT_X}
                y1={nodeY(p.row)}
                x2={RIGHT_X}
                y2={nodeY(p.col)}
                stroke="var(--qti-feedback-description-color-explanation)"
                strokeWidth={STROKE_WIDTH_EM}
              />
            ))}
          </g>

          <g>
            {rowIndices.map((n) => {
              const { display, full } = nodeLabel(rowIds, n);
              return (
                <g key={`L-${n}`}>
                  <title>{full}</title>
                  <circle
                    cx={LEFT_X}
                    cy={nodeY(n)}
                    r={NODE_R_EM}
                    fill="var(--qti-feedback-bg-explanation)"
                    stroke="var(--qti-feedback-description-color-explanation)"
                    strokeWidth={STROKE_WIDTH_EM}
                  />
                  <text
                    x={LEFT_X}
                    y={nodeY(n)}
                    textAnchor="middle"
                    dominantBaseline="central"
                    className="select-none"
                    fill="var(--qti-feedback-description-color-explanation)"
                    fontSize="0.8em"
                  >
                    {display}
                  </text>
                </g>
              );
            })}
            {colIndices.map((n) => {
              const { display, full } = nodeLabel(colIds, n);
              return (
                <g key={`R-${n}`}>
                  <title>{full}</title>
                  <circle
                    cx={RIGHT_X}
                    cy={nodeY(n)}
                    r={NODE_R_EM}
                    fill="var(--qti-feedback-bg-explanation)"
                    stroke="var(--qti-feedback-description-color-explanation)"
                    strokeWidth={STROKE_WIDTH_EM}
                  />
                  <text
                    x={RIGHT_X}
                    y={nodeY(n)}
                    textAnchor="middle"
                    dominantBaseline="central"
                    className="select-none"
                    fill="var(--qti-feedback-description-color-explanation)"
                    fontSize="0.8em"
                  >
                    {display}
                  </text>
                </g>
              );
            })}
          </g>
        </g>
      </svg>
    </div>
  );
}
