import React, { type ReactNode } from "react";
import { Pencil } from "lucide-react";
import { Input } from "../../../components/ui";
import { cn } from "../../../lib/utils";
import { renderLaTeX } from "../../../parser";
import { isMathLatexAnswer, isMathResponseId } from "../../../utils";
import { getTextEntryCharCount, isFractionPartId } from "../utils";

const NEWLINE_RE = /[\r\n]/g;

interface TextEntryInputProps {
  inputId: string;
  index: number;
  value: string;
  content?: ReactNode;
  isSubmit?: boolean;
  isPreview?: boolean;
  isCorrect?: boolean;
  onAnswerChange: (responseId: string, value: string) => void;
  placeholder?: string;
  pattern?: string;
  layout?: "inline" | "block";
  maxLength?: number;
  label?: string;
  ariaLabel?: string;
  variant?: "default" | "srq" | "cloze";
  /** 썸네일 빈 칸의 크기만 잡는 정답. 보이는 값에는 넣지 않는다. */
  measureValue?: string;
}

export const TextEntryInput = ({
  inputId,
  index,
  value,
  content,
  isSubmit = false,
  isPreview = false,
  isCorrect,
  onAnswerChange,
  placeholder,
  pattern,
  layout = "inline",
  maxLength,
  label,
  ariaLabel,
  variant = "default",
  measureValue = "",
}: TextEntryInputProps) => {
  const isFraction = isFractionPartId(inputId);
  const sizeText = value === "" ? measureValue.replace(NEWLINE_RE, "") : "";
  const showSizer = sizeText !== "" && !isFraction;
  const measureAsMath = showSizer && (isMathResponseId(inputId) || isMathLatexAnswer(sizeText));
  const charCount =
    isFraction && sizeText !== "" ? getTextEntryCharCount(sizeText) : getTextEntryCharCount(value);
  const isAnswerIncorrect = isSubmit && isCorrect === false;
  const isAnswerCorrect = isSubmit && isCorrect === true;
  const showPencil = !isPreview && !isSubmit && value === "" && (isFraction || !placeholder);
  const fieldAriaLabel = ariaLabel ?? label ?? placeholder ?? "텍스트 입력";

  const containerClassName = cn(
    "qti-ext-text-entry",
    "qti-text-entry",
    layout === "inline" ? "qti-text-entry--inline" : "qti-text-entry--block",
    variant === "cloze" && "qti-ext-text-entry-cloze",
    variant === "srq" && "qti-ext-text-entry-srq",
    showSizer && "qti-ext-text-entry--measured",
    isPreview && "rqti:pointer-events-none"
  );
  const showClozeFeedback = variant === "cloze" && value.trim() !== "";

  const inputClassName = cn(
    "qti-ext-text-entry-input",
    "qti-text-entry__field",
    variant === "srq" && "qti-ext-text-entry-input-srq",
    variant === "cloze" && "qti-ext-text-entry-input-cloze",
    (variant === "cloze" ? value.trim() !== "" : value !== "") && "qti-ext-text-entry-input-focus",
    variant === "srq" && isAnswerCorrect && "qti-ext-text-entry-input-correct",
    variant === "srq" && isAnswerIncorrect && "qti-ext-text-entry-input-incorrect",
    showClozeFeedback && isAnswerCorrect && "qti-ext-text-entry-input-correct",
    showClozeFeedback && isAnswerIncorrect && "qti-ext-text-entry-input-incorrect",
    !isSubmit && value !== "" && "qti-ext-text-entry-input-focus"
  );

  const applyChange = (raw: string) => {
    const newValue = raw.replace(NEWLINE_RE, "");
    if (pattern) {
      const regex = new RegExp(`^${pattern}$`);
      if (newValue === "" || regex.test(newValue)) {
        onAnswerChange(inputId, newValue);
      }
      return;
    }
    onAnswerChange(inputId, newValue);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.nativeEvent.isComposing) {
      e.preventDefault();
      return;
    }
    if (e.ctrlKey && e.key === "a") {
      e.preventDefault();
      const field = e.currentTarget;
      requestAnimationFrame(() => field.select());
    }
  };

  const field =
    content !== undefined ? (
      <span
        className={cn(inputClassName, "qti-ext-text-entry-input-math rqti:block")}
        role="textbox"
        aria-readonly="true"
        aria-label={fieldAriaLabel}
      >
        <span className="qti-ext-text-entry-content">{content}</span>
      </span>
    ) : isFraction ? (
      <Input
        key={`${inputId}-${index}`}
        id={`${inputId}-${index}`}
        type="text"
        value={value}
        placeholder={placeholder}
        onChange={(e) => applyChange(e.target.value)}
        onKeyDown={handleKeyDown}
        readOnly={isPreview}
        className={inputClassName}
        pattern={pattern}
        maxLength={maxLength}
        aria-label={fieldAriaLabel}
      />
    ) : (
      <textarea
        key={`${inputId}-${index}`}
        id={`${inputId}-${index}`}
        rows={1}
        value={value}
        placeholder={placeholder}
        onChange={(e) => applyChange(e.target.value)}
        onKeyDown={handleKeyDown}
        readOnly={isPreview}
        className={inputClassName}
        maxLength={maxLength}
        aria-label={fieldAriaLabel}
        wrap="soft"
      />
    );

  return (
    <span
      className={containerClassName}
      style={{ "--qti-text-entry-chars": String(charCount) } as React.CSSProperties}
    >
      {label ? (
        <label htmlFor={`${inputId}-${index}`} className="qti-text-entry__label">
          {label}
        </label>
      ) : null}
      <span className="qti-text-entry__control">
        {showSizer ? (
          <span className="qti-ext-text-entry-sizer" aria-hidden="true">
            {measureAsMath ? (
              <span className="qti-ext-text-entry-content">
                {renderLaTeX(sizeText, `text-entry-size-${inputId}`, false)}
              </span>
            ) : (
              sizeText
            )}
          </span>
        ) : null}
        {field}
        {showPencil ? <Pencil className="qti-ext-text-entry-pencil" aria-hidden="true" /> : null}
      </span>
    </span>
  );
};
