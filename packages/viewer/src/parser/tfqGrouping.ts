/**
 * TFQ(True/False, OX) row 그룹핑 및 레이아웃 클래스
 * - div.qti-ext-prompt + qti-choice-interaction(CHOICE_O/CHOICE_X) → tfq-row
 */
import React from "react";
import { ITEM_TYPE } from "../constants/itemType";
import type { QTIParserOptions } from "../types";
import { isTrueFalseQuestion } from "../utils/detectQuestionType";
import { isInteraction } from "./constants";
import { groupListItems } from "./listGrouping";
import { parseHTMLElement } from "./parseHtmlElement";
import { parseNode } from "./parseInteraction";
import { parseTextWithLaTeX } from "./parseLatexToReact";

export const isDivPrompt = (el: Element): boolean =>
  el.tagName.toLowerCase() === "div" &&
  (el.getAttribute("class") ?? el.getAttribute("className") ?? "").includes("qti-ext-prompt");

export const isNextChoiceInteraction = (
  nodes: NodeListOf<ChildNode>,
  i: number
): Element | null => {
  const next = nodes[i + 1];
  if (!next || next.nodeType !== Node.ELEMENT_NODE) return null;
  const nextEl = next as Element;
  return nextEl.tagName.toLowerCase() === "qti-choice-interaction" ? nextEl : null;
};

export const countTfqPairs = (nodes: NodeListOf<ChildNode>): number => {
  let count = 0;
  for (let i = 0; i < nodes.length; i++) {
    if (nodes[i].nodeType !== Node.ELEMENT_NODE) continue;
    if (!isDivPrompt(nodes[i] as Element)) continue;
    const next = isNextChoiceInteraction(nodes, i);
    if (next && isTrueFalseQuestion(next)) {
      count++;
      i++;
    }
  }
  return count;
};

/**
 * TFQ row 레이아웃 클래스. 뷰포트 너비 기반 CSS 반응형.
 * - 1문항: 항상 세로(below)
 * - 2문항 이상: 좁은 화면 세로 → 480px 이상에서 가로 배치
 */
export function getTfqLayoutClasses(tfqCount: number): {
  row: string;
  prompt: string;
  buttons: string;
} {
  if (tfqCount <= 1) {
    return {
      row: "tfq-row tfq-single rtqi:flex rtqi:flex-col rtqi:gap-3",
      prompt: "tfq-prompt rtqi:w-full",
      buttons: "tfq-buttons rtqi:w-full rtqi:flex rtqi:justify-start rtqi:gap-2 rtqi:shrink-0",
    };
  }
  return {
    row: "tfq-row rtqi:flex rtqi:flex-col rtqi:gap-3 rtqi:min-[480px]:flex-row rtqi:min-[480px]:items-center rtqi:min-[480px]:justify-between rtqi:min-[480px]:gap-6",
    prompt: "tfq-prompt rtqi:w-full rtqi:min-w-0 rtqi:min-[480px]:w-[60%]",
    buttons:
      "tfq-buttons rtqi:w-full rtqi:flex rtqi:justify-start rtqi:gap-2 rtqi:min-[480px]:w-[40%] rtqi:min-[480px]:justify-end rtqi:min-w-[120px] rtqi:shrink-0",
  };
}

export function buildTfqGroupedChildren(
  nodes: NodeListOf<ChildNode>,
  options: QTIParserOptions,
  startIndex: number
): Array<React.ReactElement | string> {
  const tfqCount = countTfqPairs(nodes);
  const { row, prompt, buttons } = getTfqLayoutClasses(tfqCount);
  const result: Array<React.ReactElement | string> = [];
  let elementIndex = startIndex;

  for (let i = 0; i < nodes.length; i++) {
    const child = nodes[i];

    if (child.nodeType === Node.TEXT_NODE) {
      const text = child.textContent;
      if (text !== null && text !== undefined && text.trim()) {
        const parsed = parseTextWithLaTeX(text.trim(), `item-body-text-${elementIndex}`);
        result.push(...parsed);
      }
      continue;
    }

    if (child.nodeType !== Node.ELEMENT_NODE) continue;

    const el = child as Element;
    const tagName = el.tagName.toLowerCase();

    if (isDivPrompt(el)) {
      const nextChoice = isNextChoiceInteraction(nodes, i);
      if (nextChoice && isTrueFalseQuestion(nextChoice)) {
        const statementNode = parseHTMLElement(el, options, elementIndex);
        const interactionNode = parseNode(
          nextChoice,
          { ...options, questionType: ITEM_TYPE.TFQ },
          elementIndex + 1
        );
        if (statementNode && interactionNode) {
          result.push(
            React.createElement(
              "div",
              { key: `tfq-row-${elementIndex}`, className: row },
              React.createElement("div", { className: prompt }, statementNode),
              React.createElement("div", { className: buttons }, interactionNode)
            )
          );
        } else {
          if (statementNode) result.push(statementNode);
          if (interactionNode) result.push(interactionNode);
        }
        i += 1;
        elementIndex += 2;
        continue;
      }
    }

    if (isInteraction(tagName)) {
      const parsed = parseNode(el, options, elementIndex);
      if (parsed) result.push(parsed);
      elementIndex++;
      continue;
    }

    const parsed = parseHTMLElement(el, options, elementIndex, undefined);
    if (parsed) result.push(parsed);
    elementIndex++;
  }

  return groupListItems(result);
}
