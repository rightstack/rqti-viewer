import type { CSSProperties, ReactNode } from "react";

interface VcqSyntheticBracketProps {
  className: string;
  style?: CSSProperties;
  dataAttrs?: Record<string, string>;
  hasFollowingRow: boolean;
  children: ReactNode;
}

export function VcqSyntheticBracket({
  className,
  style,
  dataAttrs,
  hasFollowingRow,
  children,
}: VcqSyntheticBracketProps) {
  const stacked = className.includes("qti-ext-vcq-synthetic-bracket--stacked");
  const line = "1px solid #1f2328";

  return (
    <div className={className} style={style} {...dataAttrs}>
      {children}
      <span
        aria-hidden
        style={{
          position: "absolute",
          top: stacked ? "var(--vcq-syn-stack-gap)" : 0,
          bottom: 0,
          left: 0,
          borderLeft: line,
        }}
      />
      <span
        aria-hidden
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          ...(hasFollowingRow ? { top: "100%" } : { bottom: 0 }),
          borderTop: line,
        }}
      />
    </div>
  );
}
