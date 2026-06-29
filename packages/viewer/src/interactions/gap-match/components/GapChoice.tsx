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
}

export const GapChoice = ({
  choice,
  isUsed,
  isSubmit,
  isPreview = false,
  draggable = false,
  onDragStart,
}: GapChoiceProps) => {
  const disabled = isSubmit || isPreview || isUsed;
  return (
    <span
      role="button"
      tabIndex={disabled ? -1 : 0}
      className={cn(
        "qti-ext-gap-choice",
        isUsed && "qti-ext-gap-choice-used",
        draggable && "qti-ext-gap-choice-draggable"
      )}
      draggable={draggable}
      onDragStart={onDragStart}
      aria-disabled={disabled}
      aria-label={choice.text || choice.identifier}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
        }
      }}
    >
      {choice.text || choice.identifier}
    </span>
  );
};
