import { useMemo } from "react";
import { parseImageInputBlankInteraction } from "../interactions/image-input-blank/ImageInputBlankParser";
import type { ResponseValue, ResponseValueMap } from "../types/question";
import { getImageInputBlankPciElementsFromQtiXml } from "../utils/choiceAnswerDisplayFromQti";

export interface ImageInputBlankCorrectAnswerPreviewProps {
  qtiXml: string;
  correctAnswer: ResponseValueMap;
  responseIdentifier: string;
  token?: string;
  baseUrl?: string;
}

/** 정답 영역에서도 그림 위에 정답이 채워진 칸을 그대로 보여준다. 수식 빈칸과 같은 방식이다. */
export function ImageInputBlankCorrectAnswerPreview({
  qtiXml,
  correctAnswer,
  responseIdentifier,
  token,
  baseUrl,
}: ImageInputBlankCorrectAnswerPreviewProps) {
  const element = useMemo(() => {
    const rid = responseIdentifier.trim();
    return (
      getImageInputBlankPciElementsFromQtiXml(qtiXml).find(
        (el) => el.getAttribute("response-identifier")?.trim() === rid
      ) ?? null
    );
  }, [qtiXml, responseIdentifier]);

  if (!element) return null;

  return (
    <div className="qti-ext-image-input-blank-answer">
      {parseImageInputBlankInteraction(
        element,
        {
          mode: "preview",
          token,
          baseUrl,
          itemKey: "feedback-image-blank",
          answerKeyPreview: true,
          correctAnswers: correctAnswer as Record<string, ResponseValue>,
        },
        0
      )}
    </div>
  );
}
