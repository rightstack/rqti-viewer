import React, { useEffect, useMemo, useState } from "react";
import type { QTIParserOptions, ResponseValue } from "../../types";
import { EssayTextArea } from "./components";

interface ExtendedTextInteractionProps {
  element: Element;
  options: Omit<QTIParserOptions, "onResponseChange" | "responses"> & {
    onResponseChange?: (identifier: string, value: ResponseValue) => void;
    responses?: Record<string, ResponseValue>;
  };
  index: number;
}

export const ExtendedTextInteraction: React.FC<ExtendedTextInteractionProps> = ({
  element,
  options,
  index,
}) => {
  const responseIdentifier = element.getAttribute("response-identifier") || "";
  const placeholderText = element.getAttribute("placeholder-text");
  const maxStrings = element.getAttribute("max-strings");

  // 내부 상태 관리
  const initialValue = useMemo(() => {
    const restored = Array.isArray(options.responses?.[responseIdentifier])
      ? options.responses?.[responseIdentifier][0]
      : "";
    return typeof restored === "string" ? restored : "";
  }, [options.responses, responseIdentifier]);
  // 내부 상태 관리
  const [value, setValue] = useState<string>("");

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setValue(e.target.value);
    options.onResponseChange?.(responseIdentifier, e.target.value as ResponseValue);
  };

  const maxLength = maxStrings ? Number.parseInt(maxStrings, 10) : undefined;

  useEffect(() => {
    setValue(initialValue);
  }, [initialValue]);

  return (
    <div key={`extended-text-${responseIdentifier}-${index}`} className="my-4">
      <EssayTextArea
        value={value}
        onChange={handleChange}
        placeholder={placeholderText || "내용을 입력하세요."}
        maxLength={maxLength}
        disabled={!!options.isSubmit}
        readOnly={options.mode === "preview"}
      />
    </div>
  );
};
