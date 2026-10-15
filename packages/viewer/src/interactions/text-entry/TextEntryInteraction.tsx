import React, { useMemo, useState } from "react";
import { ITEM_TYPE } from "../../constants/itemType";
import { cn } from "../../lib/utils";
import { MathKeyboard } from "../../math-keyboard";
import { renderLaTeX } from "../../parser";
import type {
  FeedbackSubmitResponse,
  QTIParserOptions,
  ResponseValue,
  ResponseValueMap,
} from "../../types";
import { isMathLatexAnswer, isMathResponseId, resolveMathKeyboardLevel } from "../../utils";
import { TextEntryInput } from "./components";
import { isFractionPartId, resolveTextEntryMaxLength, textEntryValueMatches } from "./utils";

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
  const maxLengthAttr = element.getAttribute("maxlength") || element.getAttribute("max-length");

  const getPattern = (mask: string | null): string | undefined => {
    if (!mask) return undefined;
    if (mask in PATTERNS) {
      return PATTERNS[mask as keyof typeof PATTERNS];
    }
    return mask;
  };

  const pattern = getPattern(patternMask);
  const parsedMaxLength = maxLengthAttr ? Number.parseInt(maxLengthAttr, 10) : undefined;
  const maxLength = resolveTextEntryMaxLength(
    Number.isFinite(parsedMaxLength) ? parsedMaxLength : undefined
  );

  const isPreview = options.mode === "preview";
  const mathKeyboardLevel = resolveMathKeyboardLevel(element);
  const mode = options.mode as string | undefined;
  const isReadOnly = mode === "preview" || mode === "paper" || mode === "thumbnail";

  const initialValue = useMemo(
    () =>
      getTextEntryResponseString(options.responses, responseIdentifier, "").replace(/[\r\n]/g, ""),
    [options.responses, responseIdentifier]
  );
  const [value, setValue] = useState(initialValue);
  const [seenInitial, setSeenInitial] = useState(initialValue);
  if (initialValue !== seenInitial) {
    setSeenInitial(initialValue);
    setValue(initialValue);
  }

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

  const isCorrect = useMemo(() => {
    if (!options.isSubmit) return undefined;
    const perBlank =
      effectiveSubmitResponse?.correctAnswer?.[responseIdentifier] ??
      options.correctAnswers?.[responseIdentifier];
    if (perBlank !== undefined) return textEntryValueMatches(value, perBlank);
    return effectiveSubmitResponse?.correct;
  }, [
    effectiveSubmitResponse,
    options.correctAnswers,
    options.isSubmit,
    responseIdentifier,
    value,
  ]);

  const placeholder = placeholderText || undefined;

  const handleAnswerChange = (id: string, val: string) => {
    setValue(val);
    options.onResponseChange?.(id, val);
  };

  if (mathKeyboardLevel && !isFractionPartId(responseIdentifier)) {
    const variant = isSRQ ? "srq" : isCLOZE ? "cloze" : "default";
    return (
      <span
        className={cn(
          "qti-ext-text-entry",
          "qti-text-entry",
          variant !== "srq" && "qti-text-entry--inline",
          "qti-ext-text-entry-math",
          isCLOZE && "qti-ext-text-entry-cloze",
          isSRQ && "qti-ext-text-entry-srq",
          isReadOnly && "rqti:pointer-events-none"
        )}
      >
        <MathKeyboard
          key={`math-${responseIdentifier}-${index}`}
          value={value}
          onChange={(latex) => {
            setValue(latex);
            options.onResponseChange?.(responseIdentifier, latex);
          }}
          readOnly={isReadOnly}
          level={mathKeyboardLevel}
          historyScope={options.itemKey}
          isCorrect={isCorrect}
          isSubmit={options.isSubmit}
          variant={variant}
          placeholder={placeholder}
          maxLength={maxLength}
        />
      </span>
    );
  }

  const content =
    (isPreview || options.isSubmit) &&
    value.trim() !== "" &&
    (isMathLatexAnswer(value) || isMathResponseId(responseIdentifier)) ? (
      <span className="qti-ext-mathfield">
        {renderLaTeX(value, `text-entry-${responseIdentifier}`, false)}
      </span>
    ) : undefined;

  return (
    <TextEntryInput
      key={`input-${responseIdentifier}-${index}`}
      inputId={responseIdentifier}
      index={index}
      value={value}
      content={content}
      isSubmit={options.isSubmit}
      isPreview={isReadOnly}
      isCorrect={isCorrect}
      onAnswerChange={handleAnswerChange}
      pattern={pattern}
      placeholder={placeholder}
      layout={layout}
      maxLength={maxLength}
      ariaLabel={`${responseIdentifier} 입력`}
      variant={isSRQ ? "srq" : isCLOZE ? "cloze" : "default"}
    />
  );
};
