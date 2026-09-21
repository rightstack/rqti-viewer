import { useMemo } from "react";
import { parseMathInputBlankInteraction } from "../interactions/math-input-blank/MathInputBlankParser";
import { extractResponseIds, findMarkupDiv } from "../interactions/math-input-blank/utils";
import type { ResponseValue, ResponseValueMap } from "../types/question";
import { getMathInputBlankPciElementsFromQtiXml } from "../utils/choiceAnswerDisplayFromQti";

export interface MathInputBlankCorrectAnswerPreviewProps {
  qtiXml: string;
  correctAnswer: ResponseValueMap;
  responseIdentifier: string;
  token?: string;
  baseUrl?: string;
}

export function MathInputBlankCorrectAnswerPreview({
  qtiXml,
  correctAnswer,
  responseIdentifier,
  token,
  baseUrl,
}: MathInputBlankCorrectAnswerPreviewProps) {
  const element = useMemo(() => {
    const rid = responseIdentifier.trim();
    const pcis = getMathInputBlankPciElementsFromQtiXml(qtiXml);
    return (
      pcis.find((el) => el.getAttribute("response-identifier")?.trim() === rid) ??
      pcis.find((el) =>
        extractResponseIds(findMarkupDiv(el)?.getAttribute("data-latex") ?? "").includes(rid)
      ) ??
      null
    );
  }, [qtiXml, responseIdentifier]);

  if (!element) return null;

  return (
    <span className="rqti:-my-1">
      {parseMathInputBlankInteraction(
        element,
        {
          mode: "preview",
          token,
          baseUrl,
          itemKey: "feedback-math-blank",
          answerKeyPreview: true,
          correctAnswers: correctAnswer as Record<string, ResponseValue>,
        },
        0
      )}
    </span>
  );
}
