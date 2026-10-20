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
  isThumbnail?: boolean;
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
  isThumbnail = false,
  correctIdList,
  onSelect,
}: McqChoiceOptionProps) => {
  const disabled = isSubmit || isPreview;
  // 화면에 표시된 선택 상태를 사용한다. 서버 response의 누락 여부로 선택을 재판정하지 않는다.
  // 전체 오답 여부로 개별 선지를 판정하지 않는다. 정답 목록이 없으면 색상 판정을 보류한다.
  const isCorrectChoice = correctIdList.includes(choice.identifier);
  const showChoiceFeedback = isSubmit && isSelected && correctIdList.length > 0;
  const isCorrect = showChoiceFeedback && isCorrectChoice;
  const isIncorrect = showChoiceFeedback && !isCorrectChoice;

  const handleClick = useCallback(() => {
    if (disabled) return;
    onSelect(choice.identifier);
  }, [onSelect, choice.identifier, disabled]);

  return (
    <div className="rqti:relative">
      <div
        role="button"
        tabIndex={0}
        className={cn(
          "qti-ext-option-base",
          "qti-ext-choice-option",
          "rqti:focus-visible:ring-ring rqti:flex rqti:w-full rqti:cursor-pointer rqti:items-center rqti:gap-2 rqti:rounded-md rqti:text-left rqti:outline-none rqti:focus-visible:ring-2 rqti:focus-visible:ring-offset-2",
          isSelected && !showChoiceFeedback && "qti-ext-choice-option-selected",
          isCorrect && "qti-ext-choice-option-correct",
          isIncorrect && "qti-ext-choice-option-incorrect",
          isSubmit && "qti-ext-option-disabled",
          isPreview && "rqti:pointer-events-none",
          disabled && "rqti:pointer-events-none"
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
        {!isThumbnail && (
          <div
            className={cn(
              "qti-ext-choice-option-checkbox",
              isSelected && !showChoiceFeedback && "qti-ext-choice-option-checkbox-selected",
              isCorrect && "qti-ext-choice-option-checkbox-correct",
              isIncorrect && "qti-ext-choice-option-checkbox-incorrect"
            )}
            role="checkbox"
            aria-checked={isSelected}
            aria-label={`선택지 ${choice.identifier}`}
          >
            {isSelected && (
              <div
                className="rqti:animate-bounce-in rqti:absolute rqti:inset-0 rqti:flex rqti:items-center rqti:justify-center"
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
        )}
      </div>

      {/* 정답/오답 뱃지 */}
      {/* {isSubmit && submitAnswers.has(choice.identifier) && (
        <FeedbackIcon isCorrect={isCorrect} isIncorrect={isIncorrect} />
      )} */}
    </div>
  );
};
