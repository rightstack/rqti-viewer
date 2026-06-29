/**
 * parseQTIToReact
 * - itemBody 파싱, TFQ는 tfqGrouping에서 처리 (div.qti-ext-prompt + choice-interaction → tfq-row)
 */
import React from "react";
import type { QTIParserOptions } from "../types";
import { buildTfqGroupedChildren } from "./tfqGrouping";

/**
 * qti-item-body(또는 동일 구조의 HTML 루트) 자식 노드에 TFQ 그룹핑·parseHTMLElement 파이프라인을 적용합니다.
 */
export function buildReactChildrenFromItemBodyNodes(
  nodes: NodeListOf<ChildNode>,
  options: QTIParserOptions
): Array<React.ReactElement | string> {
  let children: Array<React.ReactElement | string> = [];

  if (nodes.length === 1 && nodes[0].nodeType === Node.ELEMENT_NODE) {
    const sole = nodes[0] as Element;
    const tag = sole.tagName.toLowerCase();
    const cls = sole.getAttribute("class") ?? sole.getAttribute("className") ?? "";
    if (tag === "div" && cls.includes("qti-ext-question")) {
      const inner = buildTfqGroupedChildren(sole.childNodes, options, 0);
      let qeqKeySeq = 0;
      const withKeys = inner.map((c) => {
        if (typeof c === "string") {
          qeqKeySeq += 1;
          return React.createElement(React.Fragment, { key: `qeq-t-${qeqKeySeq}` }, c);
        }
        if (React.isValidElement(c) && c.key === null) {
          qeqKeySeq += 1;
          return React.cloneElement(c, { key: `qeq-c-${qeqKeySeq}` });
        }
        return c;
      });
      children = [
        React.createElement(
          "div",
          { key: "qti-ext-question", className: cls.trim() || undefined },
          ...withKeys
        ),
      ];
    }
  }

  if (children.length === 0) children = buildTfqGroupedChildren(nodes, options, 0);

  let bodyKeySeq = 0;
  return children.map((child) => {
    if (typeof child === "string") {
      bodyKeySeq += 1;
      return React.createElement(React.Fragment, { key: `item-body-text-${bodyKeySeq}` }, child);
    }
    if (React.isValidElement(child) && child.key === null) {
      bodyKeySeq += 1;
      return React.cloneElement(child, { key: `item-body-child-${bodyKeySeq}` });
    }
    return child;
  });
}

function hasSingleQtiExtQuestionWrapper(children: Array<React.ReactElement | string>): boolean {
  if (children.length !== 1) return false;
  const el = children[0];
  if (!React.isValidElement(el) || el.type !== "div") return false;
  const className = (el.props as { className?: string }).className;
  return typeof className === "string" && className.includes("qti-ext-question");
}

export const parseQTIToReact = (
  xmlString: string,
  options: QTIParserOptions = {}
): React.ReactElement | null => {
  if (!xmlString || typeof xmlString !== "string" || xmlString.trim() === "") return null;

  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(xmlString, "text/xml");
  const parseError = xmlDoc.querySelector("parsererror");
  if (parseError) {
    console.error("XML Parse Error:", parseError.textContent);
    return null;
  }

  const assessmentItem = xmlDoc.querySelector("qti-assessment-item");
  const itemBody = assessmentItem?.querySelector("qti-item-body");
  if (!itemBody) return null;

  const processedChildren = buildReactChildrenFromItemBodyNodes(itemBody.childNodes, options);
  const itemBodyProps: { key: string; className?: string } = { key: "item-body" };
  if (!hasSingleQtiExtQuestionWrapper(processedChildren)) {
    itemBodyProps.className = "qti-ext-question";
  }
  return React.createElement("div", itemBodyProps, processedChildren);
};
