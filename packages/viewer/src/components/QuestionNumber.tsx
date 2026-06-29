import type { ReactNode } from "react";

export interface QuestionNumberProps {
  label: string;
  position: "top" | "inline";
  /** 인라인일 때만: 문항 번호 영역 기준 정오답 뱃지 */
  feedbackBadge?: ReactNode;
}

/**
 * Renders the question number for QTI questions.
 * - "top": block above content (qti-ext-question-number-top)
 * - "inline": span injected before prompt (qti-ext-question-number)
 */
export function QuestionNumber({ label, position, feedbackBadge }: QuestionNumberProps) {
  const hasNumberLabel = label.trim() !== "";
  const showBadge = Boolean(feedbackBadge && hasNumberLabel);

  if (position === "top") {
    return (
      <div className="qti-ext-question-number qti-ext-question-number-top" aria-hidden>
        {label}
      </div>
    );
  }
  if (showBadge) {
    return (
      <span key="qti-qn" className="qti-ext-question-number-anchor" aria-hidden>
        {feedbackBadge}
        <span className="qti-ext-question-number">{label}</span>
      </span>
    );
  }
  return (
    <span key="qti-qn" className="qti-ext-question-number" aria-hidden>
      {label}
    </span>
  );
}
