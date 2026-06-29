import React from "react";
import { Textarea } from "../../../components/ui";

interface EssayTextAreaProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  placeholder?: string;
  maxLength?: number;
  disabled?: boolean;
  readOnly?: boolean;
}

const EssayTextArea = ({
  value,
  onChange,
  placeholder,
  maxLength = 500,
  disabled = false,
  readOnly = false,
}: EssayTextAreaProps) => {
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (disabled || readOnly) return;
    const newValue = e.target.value;
    if (newValue.length > maxLength) {
      e.target.value = newValue.slice(0, maxLength);
    }
    onChange(e);
  };

  return (
    <div className={`qti-ext-textarea-wrapper ${readOnly ? "pointer-events-none" : ""}`}>
      <Textarea
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        className="qti-ext-option-base qti-ext-textarea"
        // disabled={disabled}
        readOnly={readOnly}
      />
      <span className="qti-ext-textarea-count">
        {value.length} / {maxLength}
      </span>
    </div>
  );
};

export default EssayTextArea;
