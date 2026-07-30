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
  /** gap 식별 라벨 (qti-list-style-type-* 기반, 예: "1.", "①") */
  label?: string;
  /** drag 모드에서만 native drag 허용 (click 모드는 false) */
  canDrag?: boolean;
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
  label,
  canDrag = true,
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
      aria-label={`Gap ${label || index + 1}${selectedChoiceText ? `: ${selectedChoiceText}` : ""}`}
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
        <span className="qti-ext-gap-content">{selectedChoiceText}</span>
      ) : (
        <span className="qti-ext-gap-label">{label || "\u00A0"}</span>
      )}
    </span>
  );
};
