import type React from "react";
import { cn } from "../../../lib/utils";
import { parseInputWidth } from "../../../themes";
import type { GapType } from "../../../types";

interface GapProps {
  gap: GapType;
  index: number;
  selectedChoiceId: string | null;
  selectedChoiceText: string | null;
  selectedChoiceContent?: React.ReactNode;
  /** 채워진 빈칸에 붙는 선택지 레이블. 빈 빈칸 표식(label)과는 별개 */
  choiceLabel?: string;
  isSubmit: boolean;
  isPreview?: boolean;
  /** true: 정답, false: 오답, undefined: 피드백 없음 */
  isCorrect?: boolean;
  inputWidth?: string;
  isDragOver?: boolean;
  /** gap 식별 라벨. 클릭형은 qti-list-style-type-*가 있을 때만 (예: "1", "①") */
  label?: string;
  /** drag 모드에서만 native drag 허용 (click 모드는 false) */
  canDrag?: boolean;
  /**
   * 클릭형 제출 후: 빈 칸은 unanswered, 오답색은 내용이 있는 칸만.
   * 드래그형은 기존처럼 오답 칸에 incorrect를 둔다.
   */
  markEmptyUnanswered?: boolean;
  onDragOver?: (e: React.DragEvent) => void;
  onDragLeave?: () => void;
  onDrop?: (e: React.DragEvent) => void;
  onDragStart?: (e: React.DragEvent) => void;
  onClick?: () => void;
}

export const Gap: React.FC<GapProps> = ({
  index,
  selectedChoiceId,
  selectedChoiceText,
  selectedChoiceContent,
  choiceLabel,
  isSubmit,
  isPreview = false,
  isCorrect,
  inputWidth,
  isDragOver,
  label,
  canDrag = true,
  markEmptyUnanswered = false,
  onDragOver,
  onDragLeave,
  onDrop,
  onDragStart,
  onClick,
}) => {
  const { className: widthClass, style: widthStyle } = parseInputWidth(inputWidth, 2);
  const hasContent = !!selectedChoiceId;
  const disabled = isSubmit || isPreview;
  const choiceName = [choiceLabel, selectedChoiceText].filter(Boolean).join(" ");
  const showIncorrect = markEmptyUnanswered
    ? isSubmit && hasContent && isCorrect === false
    : isSubmit && isCorrect === false;

  return (
    <span
      role="button"
      tabIndex={disabled ? -1 : 0}
      className={cn(
        "qti-ext-gap",
        isDragOver && "qti-ext-gap-dragover",
        hasContent && "qti-ext-gap-filled",
        isSubmit && isCorrect === true && "qti-ext-gap-correct",
        showIncorrect && "qti-ext-gap-incorrect",
        markEmptyUnanswered && isSubmit && !hasContent && "qti-ext-gap-unanswered",
        widthClass
      )}
      style={widthStyle}
      aria-label={`Gap ${label || index + 1}${choiceName ? `: ${choiceName}` : ""}`}
      aria-disabled={disabled}
      draggable={canDrag && hasContent && !disabled}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick?.();
        }
      }}
    >
      {hasContent ? (
        <span className="qti-ext-gap-content">
          {choiceLabel ? <span className="qti-ext-gap-choice-label">{choiceLabel}</span> : null}
          {selectedChoiceContent ?? selectedChoiceText}
        </span>
      ) : (
        <span className="qti-ext-gap-label">{label || "\u00A0"}</span>
      )}
    </span>
  );
};
