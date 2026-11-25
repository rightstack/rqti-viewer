import type { CSSProperties, ReactNode } from "react";
import { useVcqColumnRowHeight } from "../interactions/math-input-blank/useVcqSharedRowHeight";

interface VcqColumnGroupProps {
  className: string;
  style?: CSSProperties;
  dataAttrs?: Record<string, string>;
  children: ReactNode;
}

/** 세로셈이 들어있는 단(column-group) 래퍼. 같은 단 내 세로셈들의 일반 행 높이를 통일한다. */
export function VcqColumnGroup({ className, style, dataAttrs, children }: VcqColumnGroupProps) {
  const ref = useVcqColumnRowHeight();

  return (
    <div ref={ref} className={className} style={style} {...dataAttrs}>
      {children}
    </div>
  );
}
