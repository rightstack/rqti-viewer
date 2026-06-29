import type React from "react";
import { cn } from "../../../lib/utils";
import { parseInputWidth } from "../../../themes";
import type { GapType } from "../../../types";

interface GapProps {
  gap: GapType;
  index: number;
  selectedChoiceId: string | null;
  selectedChoiceText: string | null;
  isSubmit: boolean;
  isPreview?: boolean;
  /** true: 정답, false: 오답, undefined: 피드백 없음 */
  isCorrect?: boolean;
  inputWidth?: string;
  isDragOver?: boolean;
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
  isSubmit,
  isPreview = false,
  isCorrect,
  inputWidth,
  isDragOver,
  onDragOver,
  onDragLeave,
  onDrop,
  onDragStart,
  onClick,
}) => {
  const { className: widthClass, style: widthStyle } = parseInputWidth(inputWidth, 2);
  const hasContent = !!selectedChoiceId;
  const disabled = isSubmit || isPreview;

  return (
    <span
      role="button"
      tabIndex={disabled ? -1 : 0}
      className={cn(
        "qti-ext-gap",
        isDragOver && "qti-ext-gap-dragover",
        hasContent && "qti-ext-gap-filled",
        isSubmit && isCorrect === true && "qti-ext-gap-correct",
        isSubmit && isCorrect === false && "qti-ext-gap-incorrect",
        widthClass
      )}
      style={widthStyle}
      aria-label={`Gap ${index + 1}${selectedChoiceText ? `: ${selectedChoiceText}` : ""}`}
      draggable={hasContent && !disabled}
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
      {selectedChoiceText || "\u00A0"}
    </span>
  );
};
