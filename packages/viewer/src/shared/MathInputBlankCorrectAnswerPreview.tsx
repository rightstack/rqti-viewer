import { useMemo } from "react";
import { parseMathInputBlankInteraction } from "../interactions/math-input-blank/MathInputBlankParser";
import type { ResponseValue, ResponseValueMap } from "../types/question";
import { getMathInputBlankPciElementsFromQtiXml } from "../utils/choiceAnswerDisplayFromQti";

export interface MathInputBlankCorrectAnswerPreviewProps {
  qtiXml: string;
  correctAnswer: ResponseValueMap;
  responseIdentifier: string;
  token?: string;
}

export function MathInputBlankCorrectAnswerPreview({
  qtiXml,
  correctAnswer,
  responseIdentifier,
  token,
}: MathInputBlankCorrectAnswerPreviewProps) {
  const element = useMemo(() => {
    const rid = responseIdentifier.trim();
    return (
      getMathInputBlankPciElementsFromQtiXml(qtiXml).find(
        (el) => el.getAttribute("response-identifier")?.trim() === rid
      ) ?? null
    );
  }, [qtiXml, responseIdentifier]);

  if (!element) return null;

  return (
    <span className="-my-1">
      {parseMathInputBlankInteraction(
        element,
        {
          mode: "preview",
          token,
          itemKey: "feedback-math-blank",
          answerKeyPreview: true,
          correctAnswers: correctAnswer as Record<string, ResponseValue>,
        },
        0
      )}
    </span>
  );
}
