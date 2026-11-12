import { useMemo } from "react";
import { parseHotspotInteraction } from "../interactions/hotspot/HotspotParser";
import type { ResponseValueMap } from "../types/question";
import { getHotspotInteractionElementsFromQtiXml } from "../utils/choiceAnswerDisplayFromQti";

export interface HotspotCorrectAnswerPreviewProps {
  qtiXml: string;
  correctAnswer: ResponseValueMap;
  responseIdentifier: string;
  token?: string;
}

/** 정답 영역은 문항과 같은 뷰어로 정답 ID의 마커를 보여 준다. */
export function HotspotCorrectAnswerPreview({
  qtiXml,
  correctAnswer,
  responseIdentifier,
  token,
}: HotspotCorrectAnswerPreviewProps) {
  const responseId = responseIdentifier.trim();
  const element = useMemo(
    () =>
      getHotspotInteractionElementsFromQtiXml(qtiXml).find(
        (el) => el.getAttribute("response-identifier")?.trim() === responseId
      ) ?? null,
    [qtiXml, responseId]
  );

  if (!element) return null;

  return (
    <div className="qti-ext-hotspot-answer">
      {parseHotspotInteraction(
        element,
        {
          mode: "preview",
          token,
          itemKey: "feedback-hotspot",
          answerKeyPreview: true,
          responses: { [responseId]: correctAnswer[responseId] ?? [] },
        },
        0
      )}
    </div>
  );
}
