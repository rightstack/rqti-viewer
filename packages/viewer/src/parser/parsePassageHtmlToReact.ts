/**
 * 지문 HTML( qti-item-body 없는 조각 또는 예외적 QTI 래퍼 )을
 * 문항 본문과 동일한 buildTfqGroupedChildren 파이프라인으로 React로 변환합니다.
 */
import React from "react";
import type { QTIParserOptions } from "../types";
import { buildReactChildrenFromItemBodyNodes } from "./parseQtiToReact";

export const parsePassageHtmlToReact = (
  html: string,
  options: QTIParserOptions = {}
): React.ReactElement | null => {
  if (!html || typeof html !== "string" || html.trim() === "") return null;

  const trimmed = html.trim();

  if (/qti-item-body/i.test(trimmed)) {
    const xmlDoc = new DOMParser().parseFromString(trimmed, "text/xml");
    const xmlErr = xmlDoc.querySelector("parsererror");
    if (!xmlErr) {
      const itemBody = xmlDoc.querySelector("qti-item-body");
      if (itemBody) {
        const processed = buildReactChildrenFromItemBodyNodes(itemBody.childNodes, options);
        if (processed.length === 0) return null;
        return React.createElement(React.Fragment, null, ...processed);
      }
    }
  }

  const htmlDoc = new DOMParser().parseFromString(trimmed, "text/html");
  const htmlErr = htmlDoc.querySelector("parsererror");
  if (htmlErr?.textContent) {
    console.error("parsePassageHtmlToReact: HTML parsererror", htmlErr.textContent);
    return null;
  }

  const { body } = htmlDoc;
  if (!body) {
    console.error("parsePassageHtmlToReact: missing document body");
    return null;
  }

  const processed = buildReactChildrenFromItemBodyNodes(body.childNodes, options);
  if (processed.length === 0) return null;
  return React.createElement(React.Fragment, null, ...processed);
};
