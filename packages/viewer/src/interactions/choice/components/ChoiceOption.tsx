import { useCallback } from "react";
import type { ChoiceType, FeedbackSubmitResponse } from "../../../types";
import { cn } from "../../../lib/utils";

interface ChoiceOptionProps {
  choice: Pick<ChoiceType, "identifier">;
  children: React.ReactNode;
  isSelected: boolean;
  submitAnswer: string;
  isSubmit: boolean;
  isPreview?: boolean;
  submitResponse?: FeedbackSubmitResponse;
  responseIdentifier: string;
  /** 제출 피드백·미리보기용 정답 ID (correctAnswer ?? correctAnswers) */
  correctIdList: string[];
  onSelect: (choiceId: string) => void;
}

export const ChoiceOption = ({
  choice,
  children,
  isSelected,
  isSubmit,
  isPreview = false,
  submitResponse,
  responseIdentifier,
  correctIdList,
  onSelect,
}: ChoiceOptionProps) => {
  const disabled = isSubmit || isPreview;
  const isCorrect =
    isSubmit &&
    !!submitResponse &&
    submitResponse.correct &&
    submitResponse.response?.[responseIdentifier]?.includes(choice.identifier);

  const isIncorrect =
    isSubmit &&
    !!submitResponse &&
    !submitResponse.correct &&
    submitResponse.response?.[responseIdentifier]?.includes(choice.identifier);

  const isAnswerReveal =
    isSubmit &&
    !!submitResponse &&
    !submitResponse.correct &&
    correctIdList.length > 0 &&
    correctIdList.includes(choice.identifier);

  const handleClick = useCallback(() => {
    if (disabled) return;
    onSelect(choice.identifier);
  }, [onSelect, choice.identifier, disabled]);

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
        {/* 라디오 버튼 */}

        <div
          className={cn(
            "qti-ext-choice-option-radio",
            isSelected && "qti-ext-choice-option-radio-selected",
            isCorrect && "qti-ext-choice-option-radio-correct",
            isIncorrect && "qti-ext-choice-option-radio-incorrect",
            isAnswerReveal && "qti-ext-choice-option-radio-answer-reveal"
          )}
          role="radio"
          aria-checked={isSelected}
          aria-label={`선택지 ${choice.identifier}`}
        >
          {isSelected && (
            <div
              className={cn(
                "qti-ext-choice-option-radio-dot",
                isCorrect && "qti-ext-choice-option-radio-dot-correct",
                isIncorrect && "qti-ext-choice-option-radio-dot-incorrect"
              )}
              key={choice.identifier}
            />
          )}
        </div>
      </div>

      {/* {isSubmit && <FeedbackIcon isCorrect={isCorrect} isIncorrect={isIncorrect} />} */}
    </div>
  );
};
