import { Fragment } from "react";
import { renderQtiNode } from "../parser/renderQtiNode";
import type { ChoiceCorrectAnswerItem } from "../utils/choiceAnswerDisplayFromQti";
import { getNodeKey } from "../utils/getNodeKey";

export interface ChoiceCorrectAnswerPreviewProps {
  items: ChoiceCorrectAnswerItem[];
  token?: string;
  baseUrl?: string;
}

export function ChoiceCorrectAnswerPreview({
  items,
  token,
  baseUrl,
}: ChoiceCorrectAnswerPreviewProps) {
  return (
    <div className="qti-ext-choice-correct-answer">
      {items.map((item, index) => (
        <Fragment key={item.key}>
          {index > 0 && <span aria-hidden="true">, </span>}
          <div className="qti-ext-choice-correct-answer-body">
            {item.kind === "text"
              ? item.text
              : Array.from(item.element.childNodes).map((child) => (
                  <Fragment key={getNodeKey(child)}>
                    {renderQtiNode(child, { token, baseUrl })}
                  </Fragment>
                ))}
          </div>
        </Fragment>
      ))}
    </div>
  );
}
