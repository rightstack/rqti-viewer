import { type CSSProperties, type ReactNode, useRef } from "react";
import { useVcqSettle } from "./useVcqSettle";

interface VcqSettledGridProps {
  className: string;
  style?: CSSProperties;
  dataAttrs?: Record<string, string>;
  children: ReactNode;
}

/**
 * 단에 속하지 않은 세로셈.
 * 조판과 칸 너비가 안정될 때까지 흐름 밖에 두었다가 최종 크기로 한 번만 보여 준다.
 */
export function VcqSettledGrid({ className, style, dataAttrs, children }: VcqSettledGridProps) {
  const ref = useRef<HTMLDivElement>(null);
  const settled = useVcqSettle(ref);

  return (
    <div ref={ref} className="qti-ext-vcq-settle" data-vcq-settled={settled ? "true" : "false"}>
      <div
        className={className}
        style={style}
        {...dataAttrs}
        data-vcq-settled={settled ? "true" : "false"}
      >
        {children}
      </div>
    </div>
  );
}
