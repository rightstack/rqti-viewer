/**
 * parseInteraction (parseNode)
 * 역할: QTI interaction 파싱 및 내부 자식 노드 처리
 * - interaction 타입에 따라 적절한 parser 호출
 * - qti-prompt 추출 및 렌더링 (스타일 없이)
 * - interaction 내부의 자식 노드 중 parser가 처리하지 않은 것들 처리
 *   (일반 HTML 요소, 다른 interaction 등)
 */
import React from "react";
import {
  parseChoiceInteraction,
  parseExtendedTextInteraction,
  parseGapMatchInteraction,
  parseInlineChoiceInteraction,
  parseMatchInteraction,
  parseOrderInteraction,
  parseTextEntryInteraction,
  parseUploadInteraction,
} from "../interactions";
import type { QTIParserOptions } from "../types";
import { isTrueFalseQuestion } from "../utils/detectQuestionType";
import { ITEM_TYPE } from "../constants/itemType";
import { isInteraction } from "./constants";
import { parseHTMLElement } from "./parseHtmlElement";

// 각 interaction parser가 처리하는 QTI 특정 요소 목록
const QTI_SPECIFIC_ELEMENTS: Record<string, string[]> = {
  "qti-choice-interaction": ["qti-simple-choice", "qti-prompt"],
  "qti-match-interaction": ["qti-simple-match-set", "qti-simple-associable-choice", "qti-prompt"],
  "qti-inline-choice-interaction": ["qti-inline-choice", "qti-prompt", "qti-label"],
  "qti-order-interaction": ["qti-simple-choice", "qti-prompt"],
  "qti-text-entry-interaction": ["qti-prompt"],
  "qti-extended-text-interaction": ["qti-prompt"],
  "qti-upload-interaction": ["qti-prompt"],
  "qti-gap-match-interaction": ["qti-gap", "qti-gap-text", "qti-prompt"],
};

const isQtiSpecificElement = (tagName: string, interactionTag: string): boolean => {
  const specificElements = QTI_SPECIFIC_ELEMENTS[interactionTag] || [];
  return specificElements.includes(tagName.toLowerCase());
};

export const parseNode = (
  node: Node,
  options: QTIParserOptions,
  index = 0
): React.ReactElement | null => {
  if (node.nodeType !== Node.ELEMENT_NODE) return null;

  const element = node as Element;
  const tagName = element.tagName.toLowerCase();

  if (!element) return null;
  // qti-prompt 추출 (공통 처리)
  const promptElement = element.querySelector("qti-prompt");
  const promptText = promptElement?.textContent?.trim() || "";

  let parsedInteraction: React.ReactElement | null = null;

  switch (tagName) {
    case "qti-text-entry-interaction":
      parsedInteraction = parseTextEntryInteraction(element, options, index);
      break;
    case "qti-choice-interaction": {
      const choiceOptions = isTrueFalseQuestion(element)
        ? { ...options, questionType: ITEM_TYPE.TFQ }
        : options;
      parsedInteraction = parseChoiceInteraction(element, choiceOptions, index);
      break;
    }
    case "qti-match-interaction":
      parsedInteraction = parseMatchInteraction(element, options, index);
      break;
    case "qti-inline-choice-interaction":
      parsedInteraction = parseInlineChoiceInteraction(element, options, index);
      break;
    case "qti-order-interaction":
      parsedInteraction = parseOrderInteraction(element, options, index);
      break;
    case "qti-extended-text-interaction":
      parsedInteraction = parseExtendedTextInteraction(element, options, index);
      break;
    case "qti-upload-interaction":
      parsedInteraction = parseUploadInteraction(element, options, index);
      break;
    case "qti-gap-match-interaction":
      parsedInteraction = parseGapMatchInteraction(element, options, index);
      break;
    default:
      break;
  }

  if (!parsedInteraction) {
    // interaction이 아니면 null 반환 (HTML은 parseHTMLElement에서 처리)
    return null;
  }

  // gap-match-interaction은 내부에서 HTML과 gap을 직접 처리하므로 추가 처리 불필요
  if (tagName === "qti-gap-match-interaction") {
    // prompt만 별도로 처리
    if (promptText) {
      return (
        <>
          {promptText && <p className="qti-ext-prompt">{promptText}</p>}
          <React.Fragment key={options.itemKey}>{parsedInteraction}</React.Fragment>
        </>
      );
    }
    return parsedInteraction;
  }

  // interaction 내부의 자식 노드 중 parser가 처리하지 않은 것들 처리
  // (일반 HTML 요소, 다른 interaction 등)
  const additionalChildren: Array<React.ReactElement | string> = [];
  element.childNodes.forEach((child, idx) => {
    // 텍스트 노드 처리
    if (child.nodeType === Node.TEXT_NODE) {
      // 텍스트 노드는 공백을 보존해야 함 (요소 사이의 공백이 의미가 있을 수 있음)
      const text = child.textContent;
      // 완전히 빈 텍스트 노드만 제외
      if (text !== null && text !== undefined) {
        additionalChildren.push(text);
      }
      return;
    }

    if (child.nodeType !== Node.ELEMENT_NODE) return;

    const childElement = child as Element;
    const childTagName = childElement.tagName.toLowerCase();

    // qti-prompt는 이미 처리됨
    if (childTagName === "qti-prompt") return;

    // QTI 특정 요소는 interaction parser가 처리
    if (isQtiSpecificElement(childTagName, tagName)) return;

    // 다른 interaction이면 재귀적으로 처리
    if (isInteraction(childTagName)) {
      const parsed = parseNode(childElement, options, idx);
      if (parsed) additionalChildren.push(parsed);
      return;
    }

    // 일반 HTML 요소는 parseHTMLElement로 처리
    const parsed = parseHTMLElement(childElement, options, idx);
    if (parsed) additionalChildren.push(parsed);
  });

  // parsedInteraction은 null이 아니므로 ReactElement임이 보장됨
  // prompt나 추가 자식 노드가 있으면 Fragment로 감싸서 반환
  if (promptText || additionalChildren.length > 0) {
    return (
      <>
        {promptText && <p className="qti-ext-prompt">{promptText}</p>}
        {parsedInteraction}
        {additionalChildren}
      </>
    );
  }

  return parsedInteraction;
};
