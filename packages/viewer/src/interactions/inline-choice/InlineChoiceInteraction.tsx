import React, { useEffect, useMemo, useState } from "react";
import { renderQtiNode } from "../../parser";
import type { DropdownOptionType, QTIParserOptions, ResponseValue } from "../../types";
import { extractTextFromElement } from "../../utils";
import { Dropdown } from "./components";

interface InlineChoiceInteractionProps {
  element: Element;
  options: Omit<QTIParserOptions, "onResponseChange" | "responses"> & {
    onResponseChange?: (identifier: string, value: ResponseValue) => void;
    responses?: Record<string, ResponseValue>;
  };
  index: number;
}

export const InlineChoiceInteraction: React.FC<InlineChoiceInteractionProps> = ({
  element,
  options,
  index,
}) => {
  const responseIdentifier = element.getAttribute("response-identifier") || "";
  const className = element.getAttribute("class") || "";

  // 부모 요소가 단독 inline-choice를 가지고 있는지 확인
  const isAlone = useMemo(() => {
    const parent = element.parentElement;
    if (!parent) return false;

    const childNodes = Array.from(parent.childNodes);
    const meaningfulNodes = childNodes.filter((node) => {
      if (node.nodeType === Node.TEXT_NODE) {
        return node.textContent?.trim() !== "";
      }
      return node.nodeType === Node.ELEMENT_NODE;
    });

    // 부모의 의미있는 자식이 현재 요소 하나뿐인 경우
    return meaningfulNodes.length === 1 && meaningfulNodes[0] === element;
  }, [element]);

  const initialValue = useMemo(() => {
    const restored = Array.isArray(options.responses?.[responseIdentifier])
      ? options.responses?.[responseIdentifier][0]
      : "";
    return typeof restored === "string" ? restored : "";
  }, [options.responses, responseIdentifier]);
  // 내부 상태 관리
  const [value, setValue] = useState<string>("");

  useEffect(() => {
    setValue(initialValue);
  }, [initialValue]);

  const isPreview = options.mode === "preview";
  const [isSubmit, setIsSubmit] = useState(!!options.isSubmit);

  useEffect(() => {
    setIsSubmit(!!options.isSubmit);
  }, [options.isSubmit]);

  const widthMatch = className.match(/qti-input-width-(\d+)/);
  const width = widthMatch ? widthMatch[0] : undefined;

  const dropdownOptions: DropdownOptionType[] = useMemo(() => {
    const result: DropdownOptionType[] = [];
    element.querySelectorAll("qti-inline-choice").forEach((choice) => {
      const identifier = choice.getAttribute("identifier") || "";
      const text = extractTextFromElement(choice);

      result.push({
        identifier,
        text: text || undefined,
        content: renderQtiNode(choice, options as QTIParserOptions),
      });
    });
    return result;
  }, [element, options]);

  const dropdownEntry = options.dropdownEntries?.find(
    (entry) => entry.identifier === responseIdentifier
  );
  const rawCorrectResponse =
    dropdownEntry?.correctResponse || options.correctAnswers?.[responseIdentifier];
  const correctResponse = Array.isArray(rawCorrectResponse)
    ? rawCorrectResponse[0]
    : rawCorrectResponse;
  const isCorrect =
    isSubmit && typeof correctResponse === "string" && value.trim() === correctResponse.trim();

  const handleChange = (val: string) => {
    if (isPreview || options.isSubmit) return;
    setValue(val);
    setIsSubmit(false);
    options.onResponseChange?.(responseIdentifier, val as ResponseValue);
  };

  const labelEl = element.querySelector("qti-label");
  const labelAttr = element.getAttribute("label");
  const placeholder =
    labelAttr ||
    (labelEl && extractTextFromElement(labelEl)) ||
    options.placeholder ||
    "선택하세요";

  return (
    <Dropdown
      key={`inline-choice-${responseIdentifier}-${index}`}
      options={dropdownOptions.length > 0 ? dropdownOptions : dropdownEntry?.options || []}
      value={value}
      placeholder={placeholder}
      disabled={isSubmit || isPreview}
      showCorrectAnswer={false}
      showAnswerFeedback={isSubmit}
      isCorrect={isCorrect}
      isPreview={isPreview}
      onChange={handleChange}
      inputWidth={width || dropdownEntry?.inputWidth || options.inputWidths?.[responseIdentifier]}
      isAlone={isAlone}
      token={options.token}
    />
  );
};
