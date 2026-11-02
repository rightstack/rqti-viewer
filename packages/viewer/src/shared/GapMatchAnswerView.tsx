import { Fragment } from "react";
import { renderGapChoiceContent } from "../interactions/gap-match/renderGapChoiceContent";
import { parseTextWithLaTeX } from "../parser/parseLatexToReact";
import type { QTIParserOptions } from "../types";
import type { GapMatchAnswerDisplayPart } from "../utils/choiceAnswerDisplayFromQti";

export function GapMatchAnswerView({
  parts,
  token,
  theme,
}: {
  parts: GapMatchAnswerDisplayPart[];
  token?: string;
  theme?: QTIParserOptions["theme"];
}) {
  if (parts.length === 0) return null;

  const options = { token, mode: "preview" as const, theme };
  return (
    <>
      {parts.map((part, index) => (
        <Fragment key={part.gapId}>
          {index > 0 ? <span aria-hidden="true">, </span> : null}
          {"element" in part
            ? renderGapChoiceContent(part.element, options)
            : parseTextWithLaTeX(part.text, `gap-match-answer-${part.gapId}`)}
        </Fragment>
      ))}
    </>
  );
}
