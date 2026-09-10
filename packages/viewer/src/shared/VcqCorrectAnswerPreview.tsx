import { useMemo } from "react";
import { parseHTMLElement } from "../parser/parseHtmlElement";
import type { ResponseValue, ResponseValueMap } from "../types/question";
import { getVcqResponseGridElementFromQtiXml } from "../utils/choiceAnswerDisplayFromQti";

export interface VcqCorrectAnswerPreviewProps {
  qtiXml: string;
  correctAnswer: ResponseValueMap;
  token?: string;
  baseUrl?: string;
}

/** 피드백 정답용 VCQ response 그리드 (`preview` + correctAnswers) */
export function VcqCorrectAnswerPreview({
  qtiXml,
  correctAnswer,
  token,
  baseUrl,
}: VcqCorrectAnswerPreviewProps) {
  const element = useMemo(() => getVcqResponseGridElementFromQtiXml(qtiXml), [qtiXml]);

  if (!element) return null;

  return (
    <div className="rqti:-my-1 rqti:block rqti:w-full">
      {parseHTMLElement(
        element,
        {
          mode: "preview",
          token,
          baseUrl,
          itemKey: "feedback-vcq",
          isSubmit: true,
          correct: true,
          responses: correctAnswer,
          correctAnswers: correctAnswer as Record<string, ResponseValue>,
        },
        0
      )}
    </div>
  );
}
