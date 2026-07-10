import React, { useEffect, useMemo, useState } from "react";
import { ITEM_TYPE } from "../../constants/itemType";
import { renderQtiNode } from "../../parser";
import type {
  ChoiceButtonType,
  ChoiceType,
  FeedbackSubmitResponse,
  QTIParserOptions,
  ResponseValue,
} from "../../types";
import { extractMediaFromElement, extractTextFromElement } from "../../utils";
import { ChoiceButtons, ChoiceOption, McqChoiceOption } from "./components";

type ChoiceWithElement = ChoiceType & { element: Element };

interface ChoiceInteractionProps {
  element: Element;
  options: QTIParserOptions;
  index: number;
}

export const ChoiceInteraction: React.FC<ChoiceInteractionProps> = ({
  element,
  options,
  index,
}) => {
  const responseIdentifier = element.getAttribute("response-identifier") || "";
  // QTI max-choices: 미지정 시 단일 선택(1). "0"은 무제한(다중).
  const maxChoicesAttr = element.getAttribute("max-choices");
  const maxChoices = maxChoicesAttr === null ? 1 : Number(maxChoicesAttr);
  const xmlClass = element.getAttribute("class") || "";
  const isMultiple = Number.isFinite(maxChoices) && maxChoices !== 1;

  const [value, setValue] = useState<ResponseValue>("");

  const initialValue = useMemo(() => {
    const restored = options.responses?.[responseIdentifier];
    if (isMultiple) {
      return Array.isArray(restored)
        ? restored.filter((v): v is string => typeof v === "string")
        : [];
    }
    return Array.isArray(restored) && restored[0] !== undefined
      ? restored[0]
      : typeof restored === "string"
        ? restored
        : "";
  }, [options.responses, responseIdentifier, isMultiple]);

  useEffect(() => {
    setValue(initialValue);
  }, [initialValue]);

  const choices: ChoiceWithElement[] = useMemo(() => {
    const result: ChoiceWithElement[] = [];
    element.querySelectorAll("qti-simple-choice").forEach((choiceEl) => {
      const identifier = choiceEl.getAttribute("identifier") || "";
      const choiceText = extractTextFromElement(choiceEl);
      const media = extractMediaFromElement(choiceEl);
      const label = choiceEl.getAttribute("label") || undefined;

      const correctAnswers = options.correctAnswers?.[responseIdentifier];
      const correctList = Array.isArray(correctAnswers) ? (correctAnswers as string[]) : null;
      const isCorrect = isMultiple
        ? !!correctList &&
          correctList.every((v): v is string => typeof v === "string") &&
          correctList.includes(identifier)
        : correctList
          ? correctList.includes(identifier)
          : typeof correctAnswers === "string" && correctAnswers === identifier;

      result.push({
        identifier,
        text: choiceText || undefined,
        media: media.length > 0 ? media : undefined,
        correct: isCorrect,
        label: label && label.trim() !== "" ? label : undefined,
        element: choiceEl,
      });
    });
    return result;
  }, [responseIdentifier, isMultiple, options.correctAnswers, options.itemKey]);

  const handleSelect = (choiceId: string) => {
    if (isMultiple) {
      const current: string[] =
        Array.isArray(value) && value.every((v): v is string => typeof v === "string") ? value : [];
      const newValue = current.includes(choiceId)
        ? current.filter((id) => id !== choiceId)
        : [...current, choiceId];
      setValue(newValue);
      options.onResponseChange?.(responseIdentifier, newValue as ResponseValue);
      return;
    }
    setValue(choiceId);
    options.onResponseChange?.(responseIdentifier, choiceId as ResponseValue);
  };

  // SIMULTANEOUS: 답안(responses)은 복원하되, 정오답/피드백은 절대 표시하지 않음
  // INDIVIDUAL: isSubmit(제출 여부) + submitResponse 기반 정오답. preview에서 채점 테마는 options.isSubmit일 때만
  const isPreview = options.mode === "preview";
  const showFeedback = isPreview || options.submissionMode !== "SIMULTANEOUS";
  const isSubmit = showFeedback ? !!options.isSubmit : false;
  const effectiveSubmitResponse = showFeedback
    ? isPreview
      ? ({
          correct: options.correct || false,
          response: options.responses,
          correctAnswer: options.correctAnswers,
        } as FeedbackSubmitResponse)
      : options.submitResponse
    : undefined;

  /** GapMatch와 동일: 제출 응답의 correctAnswer 우선, 없으면 options.correctAnswers */
  const correctIdList = useMemo(() => {
    const fromResponse = effectiveSubmitResponse?.correctAnswer?.[responseIdentifier];
    const fromOptions = options.correctAnswers?.[responseIdentifier];
    const raw = fromResponse ?? fromOptions;
    if (raw === undefined || raw === null) return [];
    if (Array.isArray(raw)) {
      return raw.filter((v): v is string => typeof v === "string");
    }
    if (typeof raw === "string") return [raw];
    return [];
  }, [effectiveSubmitResponse, options.correctAnswers, responseIdentifier]);

  // TFQ 타입일 때 ChoiceButtons 사용 (radio/checkbox 없음)
  if (options.questionType === ITEM_TYPE.TFQ) {
    const selectedIdentifier: string | null =
      typeof value === "string"
        ? value
        : Array.isArray(value) && value.length === 1 && typeof value[0] === "string"
          ? value[0]
          : null;

    const correctAnswers = options.correctAnswers?.[responseIdentifier];
    const correctIdentifiers = Array.isArray(correctAnswers)
      ? correctAnswers.filter((v): v is string => typeof v === "string")
      : typeof correctAnswers === "string"
        ? correctAnswers
        : "";

    const buttonChoices: ChoiceButtonType[] = choices.map((choice) => {
      const isCorrect: boolean = Boolean(
        typeof correctIdentifiers === "string"
          ? correctIdentifiers === choice.identifier
          : Array.isArray(correctIdentifiers) && correctIdentifiers.includes(choice.identifier)
      );

      return {
        identifier: choice.identifier,
        content: renderQtiNode(choice.element, options),
        isCorrect,
      };
    });

    return (
      <ChoiceButtons
        key={`choice-${responseIdentifier}-${index}`}
        choices={buttonChoices}
        selectedIdentifier={selectedIdentifier}
        onSelect={handleSelect}
        isSubmit={isSubmit}
        isPreview={isPreview}
        submitResponse={effectiveSubmitResponse}
        responseIdentifier={responseIdentifier}
      />
    );
  }

  const isMcq = options.questionType === ITEM_TYPE.MCQ || isMultiple;

  return (
    <div
      key={`choice-${responseIdentifier}-${index}`}
      className={`qti-choice-interaction-wrapper rtqi:my-4 rtqi:flex rtqi:flex-col rtqi:gap-4 ${xmlClass}`.trim()}
    >
      {choices.map((choice) => {
        const isSelected: boolean = Boolean(
          isMultiple
            ? Array.isArray(value) &&
                value.every((v): v is string => typeof v === "string") &&
                value.includes(choice.identifier)
            : value === choice.identifier
        );

        if (isMcq) {
          const submitAnswersSet = new Set(
            effectiveSubmitResponse?.response?.[responseIdentifier] ?? []
          );
          return (
            <McqChoiceOption
              key={choice.identifier}
              choice={choice}
              isSelected={isSelected}
              submitAnswers={submitAnswersSet}
              isSubmit={isSubmit}
              isPreview={isPreview}
              onSelect={handleSelect}
              submitResponse={effectiveSubmitResponse}
              responseIdentifier={responseIdentifier}
              correctIdList={correctIdList}
            >
              {renderQtiNode(choice.element, options)}
            </McqChoiceOption>
          );
        }

        const submitAnswerStr = effectiveSubmitResponse?.response?.[responseIdentifier]?.[0] ?? "";

        return (
          <ChoiceOption
            key={choice.identifier}
            choice={choice}
            isSelected={isSelected}
            submitAnswer={submitAnswerStr}
            isSubmit={isSubmit}
            isPreview={isPreview}
            onSelect={handleSelect}
            submitResponse={effectiveSubmitResponse}
            responseIdentifier={responseIdentifier}
            correctIdList={correctIdList}
          >
            {renderQtiNode(choice.element, options)}
          </ChoiceOption>
        );
      })}
    </div>
  );
};
