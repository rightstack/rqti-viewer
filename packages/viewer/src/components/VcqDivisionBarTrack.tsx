import type { CSSProperties, ReactNode } from "react";

interface VcqDivisionBarTrackProps {
  className: string;
  style?: CSSProperties;
  dataAttrs?: Record<string, string>;
  children: ReactNode;
}

/**
 * 나눗셈 division-bar-track 래퍼.
 * 백엔드 XML에는 SVG bracket이 빠져 있으므로 렌더 시 주입한다.
 */
export function VcqDivisionBarTrack({
  className,
  style,
  dataAttrs,
  children,
}: VcqDivisionBarTrackProps) {
  return (
    <span className={className} style={style} {...dataAttrs}>
      {children}
      <svg
        className="qti-ext-vcq-division-bracket"
        viewBox="0 0 12 95"
        preserveAspectRatio="none"
        aria-hidden
      >
        <path d="M0 0 C8 22 8 73 0 95" fill="none" stroke="currentColor" strokeLinecap="butt" />
      </svg>
    </span>
  );
}
