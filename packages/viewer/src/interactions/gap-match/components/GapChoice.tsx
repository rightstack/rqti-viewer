import React from "react";
import { cn } from "../../../lib/utils";
import type { GapChoiceType } from "../../../types";

interface GapChoiceProps {
  choice: GapChoiceType;
  isUsed: boolean;
  isSubmit: boolean;
  isPreview?: boolean;
  draggable?: boolean;
  onDragStart?: (e: React.DragEvent) => void;
  /** click 모드에서 클릭 가능 여부 */
  clickable?: boolean;
  /** click 모드에서 현재 '선택(armed)' 상태 여부 */
  selected?: boolean;
  onClick?: () => void;
}

export const GapChoice = ({
  choice,
  isUsed,
  isSubmit,
  isPreview = false,
  draggable = false,
  onDragStart,
  clickable = false,
  selected = false,
  onClick,
}: GapChoiceProps) => {
  const disabled = isSubmit || isPreview || isUsed;
  const interactive = clickable && !disabled;
  return (
    <span
      role="button"
      tabIndex={disabled ? -1 : 0}
      aria-pressed={clickable ? selected : undefined}
      className={cn(
        "qti-ext-gap-choice",
        isUsed && "qti-ext-gap-choice-used",
        draggable && "qti-ext-gap-choice-draggable",
        interactive && "qti-ext-gap-choice-clickable",
        selected && "qti-ext-gap-choice-selected"
      )}
      draggable={draggable}
      onDragStart={onDragStart}
      onClick={interactive ? onClick : undefined}
      aria-disabled={disabled}
      aria-label={choice.text || choice.identifier}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          if (interactive) onClick?.();
        }
      }}
    >
      {choice.text || choice.identifier}
    </span>
  );
};
