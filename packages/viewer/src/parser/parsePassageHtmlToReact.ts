/**
 * 지문 HTML( qti-item-body 없는 조각 또는 예외적 QTI 래퍼 )을
 * 문항 본문과 동일한 buildTfqGroupedChildren 파이프라인으로 React로 변환합니다.
 */
import React from "react";
import type { QuestionMode, Theme } from "../types";
import { buildReactChildrenFromItemBodyNodes } from "./parseQtiToReact";

export interface PassageParseOptions {
  /** 지문 안 미디어·수식 스타일. 조상에 넣는 테마와 같은 객체를 넘긴다. */
  theme?: Theme;
  /** practice가 아니면 지문 안 인터랙션을 비활성화한다. */
  mode?: QuestionMode;
  /**
   * 상대 경로 미디어에 `?t=`를 붙일 때 사용한다.
   * HTML의 img src가 이미 완전한 주소면 생략한다.
   */
  token?: string;
  /**
   * 상대 경로 미디어를 절대 URL로 바꿀 베이스.
   * HTML의 img src가 이미 완전한 주소면 생략한다.
   */
  baseUrl?: string;
}

export const parsePassageHtmlToReact = (
  html: string,
  options: PassageParseOptions = {},
): React.ReactElement | null => {
  if (!html || typeof html !== "string" || html.trim() === "") return null;

  const trimmed = html.trim();

  if (/qti-item-body/i.test(trimmed)) {
    const xmlDoc = new DOMParser().parseFromString(trimmed, "text/xml");
    const xmlErr = xmlDoc.querySelector("parsererror");
    if (!xmlErr) {
      const itemBody = xmlDoc.querySelector("qti-item-body");
      if (itemBody) {
        const processed = buildReactChildrenFromItemBodyNodes(
          itemBody.childNodes,
          options,
        );
        if (processed.length === 0) return null;
        return React.createElement(React.Fragment, null, ...processed);
      }
    }
  }

  const htmlDoc = new DOMParser().parseFromString(trimmed, "text/html");
  const htmlErr = htmlDoc.querySelector("parsererror");
  if (htmlErr?.textContent) {
    console.error(
      "parsePassageHtmlToReact: HTML parsererror",
      htmlErr.textContent,
    );
    return null;
  }

  const { body } = htmlDoc;
  if (!body) {
    console.error("parsePassageHtmlToReact: missing document body");
    return null;
  }

  const processed = buildReactChildrenFromItemBodyNodes(
    body.childNodes,
    options,
  );
  if (processed.length === 0) return null;
  return React.createElement(React.Fragment, null, ...processed);
};
