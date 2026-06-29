import { useCallback } from "react";
import type { ChoiceType, FeedbackSubmitResponse } from "../../../types";
import { cn } from "../../../lib/utils";

interface McqChoiceOptionProps {
  choice: Pick<ChoiceType, "identifier">;
  children: React.ReactNode;
  isSelected: boolean;
  submitAnswers: Set<string>;
  isSubmit: boolean;
  isPreview?: boolean;
  submitResponse?: FeedbackSubmitResponse;
  responseIdentifier: string;
  correctIdList: string[];
  onSelect: (choiceId: string) => void;
}

export const McqChoiceOption = ({
  choice,
  children,
  isSelected,
  isSubmit,
  isPreview = false,
  submitResponse,
  responseIdentifier,
  correctIdList,
  onSelect,
}: McqChoiceOptionProps) => {
  const disabled = isSubmit || isPreview;
  const handleClick = useCallback(() => {
    if (disabled) return;
    onSelect(choice.identifier);
  }, [onSelect, choice.identifier, disabled]);

  const selectedIds = submitResponse?.response?.[responseIdentifier];
  const selectedArray = Array.isArray(selectedIds)
    ? selectedIds
    : selectedIds !== undefined && selectedIds !== null
      ? [selectedIds]
      : [];
  const chosen = selectedArray.includes(choice.identifier);
  /** 만점 또는(오답 제출이어도) 선택+정답 ID면 correct — answer-reveal보다 우선 */
  const isCorrect =
    isSubmit &&
    !!submitResponse &&
    chosen &&
    (submitResponse.correct ||
      (correctIdList.length > 0 && correctIdList.includes(choice.identifier)));

  const hasCorrectIds = correctIdList.length > 0;
  const isIncorrect =
    isSubmit &&
    !!submitResponse &&
    !submitResponse.correct &&
    selectedArray.includes(choice.identifier) &&
    (hasCorrectIds ? !correctIdList.includes(choice.identifier) : true);

  const isAnswerReveal =
    isSubmit &&
    !!submitResponse &&
    !submitResponse.correct &&
    correctIdList.length > 0 &&
    correctIdList.includes(choice.identifier) &&
    !isCorrect;

  return (
    <div className="relative">
      <div
        role="button"
        tabIndex={0}
        className={cn(
          "qti-ext-option-base",
          "qti-ext-choice-option",
          "focus-visible:ring-ring flex w-full cursor-pointer items-center gap-2 rounded-md text-left outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
          isSelected && "qti-ext-choice-option-selected",
          isCorrect && "qti-ext-choice-option-correct",
          isIncorrect && "qti-ext-choice-option-incorrect",
          isAnswerReveal && "qti-ext-choice-option-answer-reveal",
          isSubmit && "qti-ext-option-disabled",
          isPreview && "pointer-events-none",
          disabled && "pointer-events-none"
        )}
        onClick={handleClick}
        onKeyDown={(e) => {
          if (disabled) return;
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onSelect(choice.identifier);
          }
        }}
      >
        <div className="qti-ext-choice-option-content">
          {/* 선택지 콘텐츠 (라벨은 XML class + CSS counter로 표시) */}
          {children}
        </div>
        {/* 체크박스 */}
        <div
          className={cn(
            "qti-ext-choice-option-checkbox",
            isSelected && "qti-ext-choice-option-checkbox-selected",
            isCorrect && "qti-ext-choice-option-checkbox-correct",
            isIncorrect && "qti-ext-choice-option-checkbox-incorrect",
            isAnswerReveal && "qti-ext-choice-option-checkbox-answer-reveal"
          )}
          role="checkbox"
          aria-checked={isSelected}
          aria-label={`선택지 ${choice.identifier}`}
        >
          {isSelected && (
            <div
              className="animate-bounce-in absolute inset-0 flex items-center justify-center"
              key={choice.identifier}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="calc(var(--qti-option-border-width) * 2)"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="qti-ext-choice-option-checkbox-icon"
              >
                <path d="M20 6 9 17l-5-5" />
              </svg>
            </div>
          )}
        </div>
      </div>

      {/* 정답/오답 뱃지 */}
      {/* {isSubmit && submitAnswers.has(choice.identifier) && (
        <FeedbackIcon isCorrect={isCorrect} isIncorrect={isIncorrect} />
      )} */}
    </div>
  );
};
