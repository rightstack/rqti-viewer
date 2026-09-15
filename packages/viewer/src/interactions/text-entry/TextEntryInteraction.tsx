import React, { useEffect, useMemo, useState } from "react";
import { ITEM_TYPE } from "../../constants/itemType";
import { MathKeyboard } from "../../math-keyboard/MathKeyboard";
import {
  getTextEntryValue,
  type FeedbackSubmitResponse,
  type QTIParserOptions,
  type ResponseValue,
  type ResponseValueMap,
} from "../../types";
import { cn } from "../../lib/utils";
import { stripOuterMathDelimiters } from "../../utils/latex";
import { TextEntryInput } from "./components";

function readTextEntryString(raw: unknown, fallback: string): string {
  if (raw === undefined || raw === null) return fallback.trim();
  return getTextEntryValue(raw, fallback).trim();
}

/** API/맵에 문자열·객체·string[]로 올 수 있는 응답에서 표시용 문자열 추출 */
function getTextEntryResponseString(
  map: ResponseValueMap | undefined,
  id: string,
  fallback: string,
  unwrapMath: boolean
): string {
  if (!map) return fallback.trim();
  const extracted = readTextEntryString(map[id], fallback);
  return unwrapMath ? stripOuterMathDelimiters(extracted) : extracted;
}

/** correctAnswers에서 해당 식별자의 정답 문자열을 추출 */
function getCorrectAnswerString(
  correctAnswers: Record<string, ResponseValue> | undefined,
  id: string,
  unwrapMath: boolean
): string | undefined {
  if (!correctAnswers) return undefined;
  const raw = correctAnswers[id];
  if (raw === undefined || raw === null) return undefined;
  const extracted = readTextEntryString(raw, "");
  if (!extracted) return undefined;
  return unwrapMath ? stripOuterMathDelimiters(extracted) : extracted;
}

const CORRECT_ANSWER_WIDTH_PADDING = 2;

/** 정답 문자열 길이 기반 expectedLength 추정 (ch 단위) */
function estimateWidthFromAnswer(answer: string): number {
  const stripped = answer.replace(/\\[a-zA-Z]+\{?|\}|\\|\$|\^|_/g, "");
  const len = stripped.length;
  return len + CORRECT_ANSWER_WIDTH_PADDING;
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
  const maxLengthAttr = element.getAttribute("maxlength");

  // pattern-mask 속성 처리
  const getPattern = (mask: string | null): string | undefined => {
    if (!mask) return undefined;
    if (mask in PATTERNS) {
      return PATTERNS[mask as keyof typeof PATTERNS];
    }
    return mask;
  };

  const isMath = options.isMath === true;
  const pattern = isMath ? undefined : getPattern(patternMask);
  const xmlExpectedLength = expectedLengthAttr ? Number.parseInt(expectedLengthAttr, 10) : undefined;
  const maxLength = isMath ? undefined : maxLengthAttr ? Number.parseInt(maxLengthAttr, 10) : undefined;

  const correctAnswerStr = getCorrectAnswerString(
    options.correctAnswers,
    responseIdentifier,
    isMath
  );
  const expectedLength = useMemo(() => {
    if (Number.isFinite(xmlExpectedLength)) return xmlExpectedLength;
    if (correctAnswerStr) return estimateWidthFromAnswer(correctAnswerStr);
    return undefined;
  }, [xmlExpectedLength, correctAnswerStr]);

  const isPreview = options.mode === "preview";

  const initialValue = useMemo(
    () => getTextEntryResponseString(options.responses, responseIdentifier, "", isMath),
    [options.responses, responseIdentifier, isMath]
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
  const layout: "rqti:inline" | "rqti:block" = "rqti:inline";

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
    const next = isMath ? stripOuterMathDelimiters(val) : val;
    if (!isMath && isSRQ && next.length > 50) {
      return;
    }

    setValue(next);
    options.onResponseChange?.(id, { value: next, isMath });
  };

  useEffect(() => {
    setValue(initialValue);
  }, [initialValue]);

  if (isMath) {
    return (
      <span
        className={cn(
          "qti-ext-text-entry",
          "qti-ext-text-entry-math",
          isPreview && "rqti:pointer-events-none"
        )}
      >
        <MathKeyboard
          key={`math-${responseIdentifier}-${index}`}
          value={value}
          onChange={(latex) => handleAnswerChange(responseIdentifier, latex)}
          readOnly={isPreview}
          historyScope={options.itemKey}
          isCorrect={isCorrect}
          isSubmit={options.isSubmit}
        />
      </span>
    );
  }

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
      variant={isSRQ ? "srq" : isCLOZE ? "cloze" : "default"}
    />
  );
};
