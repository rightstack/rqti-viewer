import { forwardRef } from "react";
import { MathJaxWithTextFont } from "../providers/MathJaxProviderWrapper";
import {
  closeUnbalancedLatexGroups,
  normalizeArrayColumnsForMathJax,
  stripOuterMathDelimiters,
} from "../utils/latex";
import { cn } from "../lib/utils";

interface MathJaxRendererProps {
  latex: string;
  inline?: boolean;
  displayStyle?: boolean;
  className?: string;
  dynamic?: boolean;
  onTypeset?: () => void;
}

function normalizeMathJaxDisplayLatex(latex: string): string {
  return normalizeArrayColumnsForMathJax(
    closeUnbalancedLatexGroups(
      stripOuterMathDelimiters(latex.replace(/\\require\{[^}]*\}\s*/g, ""))
    )
  );
}

const MathJaxRenderer = forwardRef<HTMLSpanElement, MathJaxRendererProps>(function MathJaxRenderer(
  { latex, inline = true, displayStyle = true, className, dynamic = true, onTypeset },
  ref
) {
  const normalized = normalizeMathJaxDisplayLatex(latex);
  if (!normalized) return null;

  const inlineMath = displayStyle ? `\\displaystyle ${normalized}` : normalized;
  const math = inline ? `\\(${inlineMath}\\)` : `\\[${normalized}\\]`;

  return (
    <span ref={ref} className={cn("qti-edit__mathjax", className)}>
      <MathJaxWithTextFont inline={inline} dynamic={dynamic} onTypeset={onTypeset}>
        {math}
      </MathJaxWithTextFont>
    </span>
  );
});

export default MathJaxRenderer;
