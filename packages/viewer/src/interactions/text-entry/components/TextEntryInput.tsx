import React from "react";
import { Input } from "../../../components/ui";
import { cn } from "../../../lib/utils";
import { getTextEntryWidthStyle } from "../utils";

interface TextEntryInputProps {
  inputId: string;
  index: number;
  value: string;
  showCorrectAnswer?: boolean;
  isSubmit?: boolean;
  isPreview?: boolean;
  /** true: 정답 스타일, false: 오답 스타일, undefined: 피드백 없음(스타일 미적용) */
  isCorrect?: boolean;
  onAnswerChange: (responseId: string, value: string) => void;
  placeholder?: string;
  pattern?: string;
  expectedLength?: number;
  layout?: "inline" | "block";
  maxLength?: number;
  label?: string;
  ariaLabel?: string;
  // showCharacterCounter?: boolean;
  variant?: "default" | "srq" | "cloze";
}

export const TextEntryInput = ({
  inputId,
  index,
  value,
  isSubmit = false,
  isPreview = false,
  isCorrect = false,
  onAnswerChange,
  placeholder,
  pattern,
  expectedLength,
  layout = "inline",
  maxLength,
  label,
  ariaLabel,
  // showCharacterCounter = false,
  variant = "default",
}: TextEntryInputProps) => {
  const isAnswerIncorrect = isSubmit && isCorrect === false;
  const isAnswerCorrect = isSubmit && isCorrect === true;
  // const reactId = useId();
  // const counterId = showCharacterCounter ? `${inputId}-${index}-${reactId}-counter` : undefined;
  const widthStyle = layout === "inline" ? getTextEntryWidthStyle(expectedLength) : undefined;

  const containerClassName = cn(
    "qti-ext-text-entry",
    "qti-text-entry",
    layout === "inline" ? "qti-text-entry--inline" : "qti-text-entry--block",
    variant === "cloze" && "qti-ext-text-entry-cloze",
    variant === "srq" && "qti-ext-text-entry-srq",
    isPreview && "pointer-events-none"
  );
  /**
   * CLOZE 타입은 input 영역 피드백 로직 미적용
   * 무순일 때 정오답여부만 확인 가능한데 오답일 때 일괄 오답처럼 input 스타일이 적용되는 문제가 있음
   */

  const inputClassName = cn(
    "qti-ext-text-entry-input",
    "qti-text-entry__field",
    variant === "cloze" && "qti-ext-text-entry-input-cloze",
    variant === "cloze" && isCorrect && "qti-ext-text-entry-input-correct",
    variant === "srq" && "qti-ext-text-entry-input-srq",
    value !== "" && "qti-ext-text-entry-input-focus",
    variant === "srq" && isAnswerCorrect && "qti-ext-text-entry-input-correct",
    variant === "srq" && isAnswerIncorrect && "qti-ext-text-entry-input-incorrect"
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;

    // pattern이 있으면 입력 검증
    if (pattern) {
      const regex = new RegExp(`^${pattern}$`);
      // 빈 값이거나 패턴에 맞는 경우에만 업데이트
      if (newValue === "" || regex.test(newValue)) {
        onAnswerChange(inputId, newValue);
      }
    } else {
      // pattern이 없으면 그대로 업데이트
      onAnswerChange(inputId, newValue);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.ctrlKey && e.key === "a") {
      e.preventDefault();
      const input = e.currentTarget;
      requestAnimationFrame(() => input.select());
    }
  };

  // const currentLength = value.length;
  // const describedBy = counterId;

  return (
    <span className={containerClassName} style={widthStyle}>
      {label ? (
        <label htmlFor={`${inputId}-${index}`} className="qti-text-entry__label">
          {label}
        </label>
      ) : null}
      <Input
        key={`${inputId}-${index}`}
        type="text"
        value={value}
        placeholder={placeholder}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        // disabled={showCorrectAnswer || isSubmit}
        readOnly={isPreview}
        className={inputClassName}
        pattern={pattern}
        maxLength={maxLength}
        aria-label={ariaLabel ?? label ?? placeholder ?? "텍스트 입력"}
      />
      {/* {showCharacterCounter && typeof maxLength === "number" ? (
        <span id={counterId} className="qti-text-entry__counter" aria-live="polite">
          {currentLength}/{maxLength}
        </span>
      ) : null} */}
    </span>
  );
};
