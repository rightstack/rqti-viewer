import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "../../../lib/utils";
import type { MatchingOptionType, MatchingPairType } from "../../../types";

interface ConnectionLineProps {
  pairs: MatchingPairType[];
  leftOptions: MatchingOptionType[];
  rightOptions: MatchingOptionType[];
  correctPairs: MatchingPairType[];
  submitMatchedPairs?: MatchingPairType[];
  isSubmit: boolean;
}

/** dot/SVG는 getBoundingClientRect로 시각적 중심(transform 반영)을 구한 뒤, SVG 기준 좌표로 변환 */
function getDotCenterInSvgSpace(
  dotEl: HTMLElement,
  svgEl: SVGSVGElement
): { x: number; y: number } {
  const dotRect = dotEl.getBoundingClientRect();
  const svgRect = svgEl.getBoundingClientRect();
  const centerX = dotRect.left + dotRect.width / 2;
  const centerY = dotRect.top + dotRect.height / 2;
  const x = centerX - svgRect.left;
  const y = centerY - svgRect.top;
  if (svgRect.width > 0 && svgRect.height > 0 && svgEl.clientWidth > 0 && svgEl.clientHeight > 0) {
    const scaleX = svgRect.width / svgEl.clientWidth;
    const scaleY = svgRect.height / svgEl.clientHeight;
    return { x: x / scaleX, y: y / scaleY };
  }
  return { x, y };
}

export interface LineDatum {
  key: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  isCorrect: boolean;
  isIncorrect: boolean;
}

const ConnectionLine = ({
  pairs,
  leftOptions,
  rightOptions,
  correctPairs,
  submitMatchedPairs = [],
  isSubmit,
}: ConnectionLineProps) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [lineData, setLineData] = useState<LineDatum[]>([]);

  const measureAndDraw = useCallback(() => {
    const svg = svgRef.current;
    // SVG의 부모의 부모(gridContainer)를 root로 사용하여 모든 옵션의 dot을 찾을 수 있도록 함
    const root = svg?.parentElement?.parentElement;
    if (!svg || !root || pairs.length === 0) {
      setLineData([]);
      return;
    }

    const next: LineDatum[] = [];

    pairs.forEach((pair) => {
      const isCorrect =
        isSubmit &&
        correctPairs.some((cp) => cp.leftId === pair.leftId && cp.rightId === pair.rightId);
      const isIncorrect =
        isSubmit &&
        !isCorrect &&
        submitMatchedPairs.some((sp) => sp.leftId === pair.leftId && sp.rightId === pair.rightId);

      const leftDot = root.querySelector(`[data-point-id="${pair.leftId}-right"]`);
      const rightDot = root.querySelector(`[data-point-id="${pair.rightId}-left"]`);

      if (!leftDot || !rightDot) return;

      const leftEl = leftDot as HTMLElement;
      const rightEl = rightDot as HTMLElement;
      const start = getDotCenterInSvgSpace(leftEl, svg);
      const end = getDotCenterInSvgSpace(rightEl, svg);

      next.push({
        key: `${pair.leftId}-${pair.rightId}`,
        x1: start.x,
        y1: start.y,
        x2: end.x,
        y2: end.y,
        isCorrect,
        isIncorrect,
      });
    });

    setLineData(next);
  }, [pairs, leftOptions, rightOptions, correctPairs, submitMatchedPairs, isSubmit]);

  useEffect(() => {
    const id = requestAnimationFrame(() => measureAndDraw());
    return () => cancelAnimationFrame(id);
  }, [measureAndDraw]);

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    const observer = new ResizeObserver(() => measureAndDraw());
    observer.observe(svg);
    return () => observer.disconnect();
  }, [measureAndDraw]);

  return (
    <svg ref={svgRef} className="qti-ext-match-svg">
      {lineData.map((line) => (
        <line
          key={line.key}
          x1={line.x1}
          y1={line.y1}
          x2={line.x2}
          y2={line.y2}
          className={cn(
            "qti-ext-match-line",
            line.isCorrect && "qti-ext-match-line-correct",
            line.isIncorrect && "qti-ext-match-line-incorrect"
          )}
        />
      ))}
    </svg>
  );
};

export default ConnectionLine;
