import React from "react";
import { cn } from "../../../lib/utils";
import type { GapChoiceType } from "../../../types";

interface GapChoiceProps {
  choice: GapChoiceType;
  /** 선택지 레이블. 선택지 데이터에는 합치지 않는다. */
  label?: string;
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
  label,
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
  const plainName = choice.text || choice.identifier;
  const accessibleName = label ? `${label} ${plainName}` : plainName;
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
      onDragStart={draggable ? onDragStart : undefined}
      onClick={interactive ? onClick : undefined}
      aria-disabled={disabled}
      aria-label={accessibleName}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          if (interactive) onClick?.();
        }
      }}
    >
      {label ? <span className="qti-ext-gap-choice-label">{label}</span> : null}
      {choice.content ?? choice.text ?? choice.identifier}
    </span>
  );
};
