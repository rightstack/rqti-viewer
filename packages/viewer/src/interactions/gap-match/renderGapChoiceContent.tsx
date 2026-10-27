import React from "react";
import { isFormattingWhitespace, parseHTMLElement } from "../../parser/parseHtmlElement";
import { renderQtiNode } from "../../parser/renderQtiNode";
import type { QTIParserOptions } from "../../types";
import { getNodeKey } from "../../utils/getNodeKey";
import { removeMediaFromElementClone } from "../../utils/extractTextFromElement";

/** 이미지·오디오·비디오를 뺀 qti-gap-text 자식을 그린다. 남는 내용이 없으면 undefined. */
export function renderGapChoiceContent(
  choice: Element,
  options: QTIParserOptions
): React.ReactNode | undefined {
  const clone = choice.cloneNode(true) as Element;
  removeMediaFromElementClone(clone);
  const hasMathMarkup = !!clone.querySelector(
    ".qti-ext-mathfield, .qti-ext-input-blank, .qti-ext-math-input-blank"
  );
  if (!(clone.textContent ?? "").trim() && !hasMathMarkup) return undefined;

  const parts: React.ReactNode[] = [];
  Array.from(clone.childNodes).forEach((child, idx) => {
    if (child.nodeType === Node.TEXT_NODE) {
      const text = child.textContent;
      if (!text || isFormattingWhitespace(text)) return;
    }

    // 수식은 data-latex와 \inputblank를 아는 parseHTMLElement로 그린다.
    const rendered =
      child.nodeType === Node.ELEMENT_NODE
        ? parseHTMLElement(child as Element, options, idx)
        : renderQtiNode(child, options);
    if (rendered === null || rendered === "") return;
    parts.push(<React.Fragment key={getNodeKey(child)}>{rendered}</React.Fragment>);
  });
  return parts.length > 0 ? parts : undefined;
}
