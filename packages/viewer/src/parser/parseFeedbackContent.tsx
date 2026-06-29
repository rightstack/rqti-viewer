/**
 * parseFeedbackContentToReact
 * 피드백 content HTML 조각을 파싱하여 이미지(resolveMediaUrl), 수식(LaTeX)이 반영된 React 노드로 변환
 */
import React from "react";
import type { QTIParserOptions } from "../types";
import { groupListItems } from "./listGrouping";
import { parseHTMLElement } from "./parseHtmlElement";
import { parseTextWithLaTeX } from "./parseLatexToReact";

/**
 * 피드백 content(HTML 문자열)를 파싱하여 React 노드로 반환.
 * 이미지 src는 resolveMediaUrl로 해석되고, $...$ 수식은 LaTeX로 렌더링됨.
 */
export function parseFeedbackContentToReact(
  html: string,
  options: QTIParserOptions = {},
  keyPrefix = "fb"
): React.ReactNode {
  if (!html || typeof html !== "string" || html.trim() === "") return null;

  const doc = new DOMParser().parseFromString(
    `<!DOCTYPE html><html><body><div>${html}</div></body></html>`,
    "text/html"
  );
  const wrapper = doc.body?.firstElementChild;
  if (!wrapper) return null;

  const nodes: React.ReactNode[] = [];
  let keySeq = 0;

  wrapper.childNodes.forEach((child) => {
    if (child.nodeType === Node.TEXT_NODE) {
      const text = child.textContent;
      if (text !== null && text !== undefined && text !== "") {
        const parsed = parseTextWithLaTeX(text, `${keyPrefix}-t-${keySeq}`);
        const arr = Array.isArray(parsed) ? parsed : [parsed];
        arr.forEach((p) => {
          if (typeof p === "string") {
            keySeq += 1;
            nodes.push(React.createElement(React.Fragment, { key: `${keyPrefix}-${keySeq}` }, p));
          } else if (React.isValidElement(p)) {
            keySeq += 1;
            nodes.push(
              p.key === null ? React.cloneElement(p, { key: `${keyPrefix}-${keySeq}` }) : p
            );
          }
        });
      }
      return;
    }

    if (child.nodeType !== Node.ELEMENT_NODE) return;

    const el = child as Element;
    const parsed = parseHTMLElement(el, options, keySeq);
    if (parsed) {
      keySeq += 1;
      nodes.push(
        React.isValidElement(parsed) && parsed.key === null
          ? React.cloneElement(parsed, { key: `${keyPrefix}-${keySeq}` })
          : parsed
      );
    }
  });

  if (nodes.length === 0) return null;

  const grouped = groupListItems(nodes as Array<React.ReactElement | string>);
  if (grouped.length === 0) return null;
  if (grouped.length === 1) return grouped[0];
  return React.createElement(React.Fragment, {}, ...grouped);
}
