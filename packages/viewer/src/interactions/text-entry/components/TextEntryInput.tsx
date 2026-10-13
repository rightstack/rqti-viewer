import React, { type ReactNode } from "react";
import { Pencil } from "lucide-react";
import { Input } from "../../../components/ui";
import { cn } from "../../../lib/utils";
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
}

export const TextEntryInput = ({
  inputId,
  index,
  value,
  content,
  isSubmit = false,
  isPreview = false,
  isCorrect = false,
  onAnswerChange,
  placeholder,
  pattern,
  layout = "inline",
  maxLength,
  label,
  ariaLabel,
  variant = "default",
}: TextEntryInputProps) => {
  const isFraction = isFractionPartId(inputId);
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
    isPreview && "rqti:pointer-events-none"
  );

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
      style={
        { "--qti-text-entry-chars": String(getTextEntryCharCount(value)) } as React.CSSProperties
      }
    >
      {label ? (
        <label htmlFor={`${inputId}-${index}`} className="qti-text-entry__label">
          {label}
        </label>
      ) : null}
      <span className="qti-text-entry__control">
        {field}
        {showPencil ? <Pencil className="qti-ext-text-entry-pencil" aria-hidden="true" /> : null}
      </span>
    </span>
  );
};
