import { useCallback, useEffect, useRef } from "react";
import type { MatchingOptionType } from "../../../types";

// 인접 컬럼 간의 매칭
interface AdjacentPair {
  leftId: string;
  rightId: string;
  pairIndex: number;
}

interface MultiConnectionLineProps {
  pairs: AdjacentPair[];
  allChoices: MatchingOptionType[][];
  isSubmit: boolean;
}

const MultiConnectionLine = ({ pairs, allChoices, isSubmit }: MultiConnectionLineProps) => {
  const svgRef = useRef<SVGSVGElement>(null);

  const measureAndDraw = useCallback(() => {
    if (!svgRef.current) return;

    const svg = svgRef.current;
    const svgRect = svg.getBoundingClientRect();

    const findScale = (element: Element | null): number => {
      if (!element) return 1;
      let current: Element | null = element;
      while (current) {
        const style = window.getComputedStyle(current);
        const transform = style.transform;
        if (transform && transform !== "none") {
          const matrixMatch =
            transform.match(/matrix\(([^)]+)\)/) || transform.match(/matrix3d\(([^)]+)\)/);
          if (matrixMatch) {
            const values = matrixMatch[1].split(",").map((v) => parseFloat(v.trim()));
            if (values.length >= 4) {
              const scaleX = Math.abs(values[0]);
              if (scaleX > 0 && scaleX !== 1) {
                return scaleX;
              }
            }
          }
        }
        current = current.parentElement;
      }
      return 1;
    };

    let scale = findScale(svg.parentElement);
    if (scale === 1 && svgRect.width > 0 && svg.clientWidth > 0) {
      const ratio = svgRect.width / svg.clientWidth;
      if (ratio > 0 && ratio !== 1) scale = ratio;
    }

    const existingElements = svg.querySelectorAll("line");
    existingElements.forEach((el) => el.remove());

    if (pairs.length === 0) return;

    // Portal(모달) 안에서만 찾기: SVG와 같은 match 컨테이너 내부에서만 쿼리
    const root = svg.parentElement;
    if (!root) return;

    pairs.forEach((pair) => {
      const leftPointElement = root.querySelector(
        `[data-point-id="${pair.leftId}-right"]`
      ) as HTMLElement;
      const rightPointElement = root.querySelector(
        `[data-point-id="${pair.rightId}-left"]`
      ) as HTMLElement;

      if (!leftPointElement || !rightPointElement) {
        const leftElement = root.querySelector(`[data-option-id="${pair.leftId}"]`);
        const rightElement = root.querySelector(`[data-option-id="${pair.rightId}"]`);

        if (!leftElement || !rightElement) return;

        const leftRect = leftElement.getBoundingClientRect();
        const rightRect = rightElement.getBoundingClientRect();

        // scale이 적용된 경우 좌표를 원본 크기로 변환
        const startX = (leftRect.right - svgRect.left) / scale;
        const startY = (leftRect.top + leftRect.height / 2 - svgRect.top) / scale;
        const endX = (rightRect.left - svgRect.left) / scale;
        const endY = (rightRect.top + rightRect.height / 2 - svgRect.top) / scale;

        const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
        line.setAttribute("x1", startX.toString());
        line.setAttribute("y1", startY.toString());
        line.setAttribute("x2", endX.toString());
        line.setAttribute("y2", endY.toString());
        line.setAttribute("class", "qti-ext-match-line");
        line.style.strokeDasharray = "0 1000";
        line.style.animation = "qti-ext-draw-line 0.3s ease-out forwards";
        svg.appendChild(line);
        return;
      }

      // 연결점 중심에서 선 그리기
      const leftRect = leftPointElement.getBoundingClientRect();
      const rightRect = rightPointElement.getBoundingClientRect();

      // scale이 적용된 경우 좌표를 원본 크기로 변환
      const startX = (leftRect.left + leftRect.width / 2 - svgRect.left) / scale;
      const startY = (leftRect.top + leftRect.height / 2 - svgRect.top) / scale;
      const endX = (rightRect.left + rightRect.width / 2 - svgRect.left) / scale;
      const endY = (rightRect.top + rightRect.height / 2 - svgRect.top) / scale;

      const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
      line.setAttribute("x1", startX.toString());
      line.setAttribute("y1", startY.toString());
      line.setAttribute("x2", endX.toString());
      line.setAttribute("y2", endY.toString());
      line.setAttribute("class", "qti-ext-match-line");
      line.style.strokeDasharray = "0 1000";
      line.style.animation = "qti-ext-draw-line 0.3s ease-out forwards";
      svg.appendChild(line);
    });
  }, [pairs, allChoices, isSubmit]);

  useEffect(() => {
    measureAndDraw();
  }, [measureAndDraw]);

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    const observer = new ResizeObserver(() => measureAndDraw());
    observer.observe(svg);
    return () => observer.disconnect();
  }, [measureAndDraw]);

  return <svg ref={svgRef} className="qti-ext-match-svg" />;
};

export default MultiConnectionLine;
