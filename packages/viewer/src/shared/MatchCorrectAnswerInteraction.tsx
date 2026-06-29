import { useMemo } from "react";
import { MatchInteraction } from "../interactions/match/MatchInteraction";
import { cn } from "../lib/utils";
import type { Theme } from "../types/theme";
import { getMatchInteractionElementFromQtiXml } from "../utils/choiceAnswerDisplayFromQti";
import { MatchAnswerView } from "./MatchAnswerView";

export interface MatchCorrectAnswerInteractionProps {
  qtiXml: string;
  responseIdentifier: string;
  matchStrings: string[];
  token?: string;
  theme?: Theme;
  itemKey?: string;
  matchItems?: { rows: string[]; cols: string[] };
  /** 피드백 블록 안 `MatchInteraction` 루트 `my-4` 보정 등 */
  className?: string;
}

export function MatchCorrectAnswerInteraction({
  qtiXml,
  responseIdentifier,
  matchStrings,
  token,
  theme,
  itemKey,
  matchItems = { rows: [], cols: [] },
  className,
}: MatchCorrectAnswerInteractionProps) {
  const element = useMemo(
    () => getMatchInteractionElementFromQtiXml(qtiXml, responseIdentifier),
    [qtiXml, responseIdentifier]
  );

  if (!element) {
    return <MatchAnswerView items={matchItems} correctResponse={matchStrings} />;
  }

  const feedbackItemKey = itemKey ? `feedback-${itemKey}-${responseIdentifier}` : undefined;

  return (
    <div className={cn("-my-4", className)}>
      <MatchInteraction
        element={element}
        index={0}
        options={{
          mode: "preview",
          token,
          theme,
          itemKey: feedbackItemKey,
          isSubmit: true,
          correct: true,
          submissionMode: "INDIVIDUAL",
          responses: { [responseIdentifier]: matchStrings },
          correctAnswers: { [responseIdentifier]: matchStrings },
        }}
      />
    </div>
  );
}
