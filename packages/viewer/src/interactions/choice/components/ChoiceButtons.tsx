import type { ChoiceButtonType, FeedbackSubmitResponse } from "../../../types";
import { cn } from "../../../lib/utils";
import { getOrientationStyle } from "../../../themes";

interface ChoiceButtonsProps {
  choices: ChoiceButtonType[];
  selectedIdentifier: string | null;
  onSelect: (identifier: string) => void;
  isSubmit: boolean;
  isPreview?: boolean;
  submitResponse?: FeedbackSubmitResponse;
  responseIdentifier: string;
  orientation?: "vertical" | "horizontal";
  stacking?: 1 | 2 | 3 | 4 | 5;
}

export const ChoiceButtons = ({
  choices,
  selectedIdentifier,
  onSelect,
  isSubmit,
  isPreview = false,
  submitResponse,
  responseIdentifier,
  orientation,
  stacking,
}: ChoiceButtonsProps) => {
  const disabled = isSubmit || isPreview;
  const isSelected = (identifier: string) => selectedIdentifier === identifier;
  const effectiveOrientation = orientation || (choices.length <= 2 ? "horizontal" : "vertical");

  return (
    <div className="rtqi:my-4 rtqi:flex rtqi:gap-4" style={getOrientationStyle(effectiveOrientation, stacking)}>
      {choices.map((choice) => {
        const selected = isSelected(choice.identifier);
        const selectedIds = submitResponse?.response?.[responseIdentifier];
        const selectedArray = Array.isArray(selectedIds)
          ? selectedIds
          : selectedIds !== undefined && selectedIds !== null
            ? [selectedIds]
            : [];
        const correctIds = submitResponse?.correctAnswer?.[responseIdentifier];
        const correctArray: string[] = Array.isArray(correctIds)
          ? correctIds.map(String)
          : correctIds !== undefined && correctIds !== null
            ? [String(correctIds)]
            : [];
        const isRowCorrect =
          correctArray.length > 0
            ? selectedArray.length === correctArray.length &&
              selectedArray.every((v) => correctArray.includes(String(v)))
            : (submitResponse?.correct ?? false);

        const isCorrect =
          isSubmit && !!submitResponse && isRowCorrect && selectedArray.includes(choice.identifier);

        const isIncorrect =
          isSubmit &&
          !!submitResponse &&
          !isRowCorrect &&
          selectedArray.includes(choice.identifier);

        return (
          <ChoiceButtonItem
            key={choice.identifier}
            choice={choice}
            isSelected={selected}
            isCorrect={isCorrect || false}
            isIncorrect={isIncorrect || false}
            disabled={disabled}
            showDisabledStyle={isSubmit}
            isPreview={isPreview}
            onSelect={onSelect}
          />
        );
      })}
    </div>
  );
};

const ChoiceButtonItem = ({
  choice,
  isSelected,
  isCorrect,
  isIncorrect,
  disabled,
  showDisabledStyle,
  isPreview = false,
  onSelect,
}: {
  choice: ChoiceButtonType;
  isSelected: boolean;
  isCorrect: boolean;
  isIncorrect: boolean;
  disabled: boolean;
  showDisabledStyle: boolean;
  isPreview?: boolean;
  onSelect: (identifier: string) => void;
}) => (
  <div className={cn("rtqi:relative rtqi:min-w-0 rtqi:flex-1", isPreview && "rtqi:pointer-events-none")}>
    <div
      role="button"
      tabIndex={0}
      onClick={() => !disabled && onSelect(choice.identifier)}
      onKeyDown={(e) => {
        if (disabled) return;
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect(choice.identifier);
        }
      }}
      className={cn(
        "qti-ext-option-base",
        "qti-ext-choice-button",
        "rtqi:focus-visible:ring-ring rtqi:inline-flex rtqi:w-full rtqi:cursor-pointer rtqi:items-center rtqi:justify-center rtqi:gap-2 rtqi:rounded-md rtqi:outline-none rtqi:focus-visible:ring-2 rtqi:focus-visible:ring-offset-2",
        isSelected && "qti-ext-choice-button-selected",
        isCorrect && "qti-ext-choice-button-correct",
        isIncorrect && "qti-ext-choice-button-incorrect",
        showDisabledStyle && "qti-ext-option-disabled",
        disabled && "rtqi:pointer-events-none"
      )}
    >
      {choice.content}
    </div>
    {/* {isSubmit && <FeedbackIcon isCorrect={isCorrect} isIncorrect={isIncorrect} />} */}
  </div>
);
