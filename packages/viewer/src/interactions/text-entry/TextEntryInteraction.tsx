import React, { useEffect, useMemo, useState } from "react";
import { ITEM_TYPE } from "../../constants/itemType";
import type {
  FeedbackSubmitResponse,
  QTIParserOptions,
  ResponseValue,
  ResponseValueMap,
} from "../../types";
import { TextEntryInput } from "./components";

/** API/맵에 문자열 또는 string[]로 올 수 있는 응답에서 표시용 문자열 추출 */
function getTextEntryResponseString(
  map: ResponseValueMap | undefined,
  id: string,
  fallback: string
): string {
  if (!map) return fallback.trim();
  const raw = map[id] as unknown;
  if (raw === undefined || raw === null) return fallback.trim();
  if (Array.isArray(raw)) return String(raw[0] ?? "").trim();
  if (typeof raw === "string") return raw.trim();
  return fallback.trim();
}

const PATTERNS = {
  korean: "[가-힣\\s]+",
  english: "[a-zA-Z\\s]+",
  number: "[0-9]+",
  mixed: "[가-힣a-zA-Z0-9\\s]+",
  free: ".*",
};

interface TextEntryInteractionProps {
  element: Element;
  options: Omit<QTIParserOptions, "onResponseChange" | "responses"> & {
    onResponseChange?: (identifier: string, value: ResponseValue) => void;
    responses?: ResponseValueMap;
  };
  index: number;
}

export const TextEntryInteraction: React.FC<TextEntryInteractionProps> = ({
  element,
  options,
  index,
}) => {
  const responseIdentifier = element.getAttribute("response-identifier") || "";
  const patternMask = element.getAttribute("pattern-mask");
  const placeholderText = element.getAttribute("placeholder-text");
  const expectedLengthAttr = element.getAttribute("expected-length");
  const maxLengthAttr = element.getAttribute("maxlength") || element.getAttribute("max-length");

  // pattern-mask 속성 처리
  const getPattern = (mask: string | null): string | undefined => {
    if (!mask) return undefined;
    if (mask in PATTERNS) {
      return PATTERNS[mask as keyof typeof PATTERNS];
    }
    return mask;
  };

  const pattern = getPattern(patternMask);
  const expectedLength = expectedLengthAttr ? Number.parseInt(expectedLengthAttr, 10) : undefined;
  const maxLength = maxLengthAttr ? Number.parseInt(maxLengthAttr, 10) : undefined;

  const isPreview = options.mode === "preview";

  const initialValue = useMemo(
    () => getTextEntryResponseString(options.responses, responseIdentifier, ""),
    [options.responses, responseIdentifier]
  );
  const [value, setValue] = useState<string>("");

  const effectiveSubmitResponse = useMemo((): FeedbackSubmitResponse | undefined => {
    if (isPreview) {
      return {
        correct: options.correct ?? false,
        response: options.responses,
        correctAnswer: options.correctAnswers as FeedbackSubmitResponse["correctAnswer"],
      } as FeedbackSubmitResponse;
    }
    return options.submitResponse;
  }, [
    isPreview,
    options.correct,
    options.correctAnswers,
    options.responses,
    options.submitResponse,
  ]);

  const isSRQ = options.questionType === ITEM_TYPE.SRQ;
  const isCLOZE = options.questionType === ITEM_TYPE.CLOZE;
  const layout = isSRQ ? "block" : "inline";

  /**
   * CLOZE 타입은 input 영역 피드백 로직 미적용
   * 무순일 때 정오답여부만 확인 가능한데 오답일 때 일괄 오답처럼 input 스타일이 적용되는 문제가 있음
   */

  const isCorrect = useMemo(() => {
    // if (isCLOZE) return undefined;

    const sr = effectiveSubmitResponse;
    if (!sr) return undefined;

    return sr.correct;
  }, [effectiveSubmitResponse, options.responses, responseIdentifier, value]);

  const defaultPlaceholder = placeholderText || (isSRQ ? "답을 입력하세요" : "답 입력");

  // SRQ 타입은 최대 50자로 제한

  const handleAnswerChange = (id: string, val: string) => {
    if (isSRQ && val.length > 50) {
      return;
    }

    setValue(val);
    options.onResponseChange?.(id, val);
  };

  useEffect(() => {
    setValue(initialValue);
  }, [initialValue]);

  return (
    <TextEntryInput
      key={`input-${responseIdentifier}-${index}`}
      inputId={responseIdentifier}
      index={index}
      value={value}
      showCorrectAnswer={false}
      isSubmit={options.isSubmit}
      isPreview={options.mode === "preview"}
      isCorrect={isCorrect}
      onAnswerChange={handleAnswerChange}
      pattern={pattern}
      placeholder={defaultPlaceholder}
      expectedLength={Number.isFinite(expectedLength) ? expectedLength : undefined}
      layout={layout}
      maxLength={Number.isFinite(maxLength) ? maxLength : undefined}
      ariaLabel={`${responseIdentifier} 입력`}
      // showCharacterCounter={layout === "block" && Number.isFinite(effectiveMaxLength)}
      variant={isSRQ ? "srq" : isCLOZE ? "cloze" : "default"}
    />
  );
};
