import React from "react";
import { isOwnedBodyInteraction, stripLeadingBreaks } from "./inlineQuestionNumber";

const QN_NUMBER_KEY = "qti-qn-number";
const TEXT_LINE_TAGS = new Set(["p", "div", "span"]);

function classNameOf(node: React.ReactNode): string {
  if (!React.isValidElement(node)) return "";
  const className = (node.props as { className?: unknown }).className;
  return typeof className === "string" ? className : "";
}

function hasClassToken(node: React.ReactNode, token: string): boolean {
  return classNameOf(node).split(/\s+/).includes(token);
}

function childrenOf(node: React.ReactElement): React.ReactNode[] {
  return React.Children.toArray((node.props as { children?: React.ReactNode }).children);
}

function withKey(node: React.ReactNode, key: string): React.ReactNode {
  if (React.isValidElement(node) && node.key !== undefined && node.key !== null) return node;
  return React.createElement(React.Fragment, { key }, node);
}

const MEDIA_TAGS = new Set(["img", "svg", "video", "audio"]);

function hasVisibleContent(node: React.ReactNode): boolean {
  if (typeof node === "string" || typeof node === "number") {
    return (
      String(node)
        .replace(/\u00a0/g, " ")
        .trim() !== ""
    );
  }
  if (!React.isValidElement(node)) return false;
  if (typeof node.type !== "string") return true;
  if (node.type === "br") return false;
  if (MEDIA_TAGS.has(node.type)) return true;
  return childrenOf(node).some(hasVisibleContent);
}

/** 빈 텍스트, nbsp만 있는 p. 문항이 시작하는 영역이 아니다. */
function isIgnorableLeadingNode(node: React.ReactNode): boolean {
  if (node === null || node === undefined || node === false) return true;
  if (typeof node === "string" || typeof node === "number") {
    return (
      String(node)
        .replace(/\u00a0/g, " ")
        .trim() === ""
    );
  }
  if (!React.isValidElement(node) || node.type !== "p") return false;
  return !hasVisibleContent(node);
}

function isTextLineHost(node: React.ReactElement): boolean {
  return typeof node.type === "string" && TEXT_LINE_TAGS.has(node.type);
}

function leavesNumberToInteraction(node: React.ReactNode): boolean {
  if (!React.isValidElement(node)) return false;
  if (isOwnedBodyInteraction(node)) return true;
  if (node.type === React.Fragment) {
    const first = childrenOf(node).find((child) => !isIgnorableLeadingNode(child));
    return leavesNumberToInteraction(first);
  }
  if (typeof node.type !== "string") return false;
  const first = childrenOf(node).find((child) => !isIgnorableLeadingNode(child));
  return first !== undefined && leavesNumberToInteraction(first);
}

function prependInside(node: React.ReactElement, numberNode: React.ReactNode): React.ReactElement {
  const children = stripLeadingBreaks(childrenOf(node));
  return React.cloneElement(
    node,
    { key: node.key ?? "qti-qn-first" },
    withKey(numberNode, QN_NUMBER_KEY),
    ...children,
  );
}

/**
 * 앵커의 첫 텍스트 줄 안에 번호를 넣는다.
 * 블록 p의 앞 형제로 두면 번호만 윗줄에 남으므로, p가 있으면 그 안으로 들어간다.
 * 세로셈(qti-ext-vcq)은 그리드가 깨지지 않게 상자 앞에 둔다.
 */
function placeInFirstLine(node: React.ReactNode, numberNode: React.ReactNode): React.ReactNode {
  if (typeof node === "string" || typeof node === "number") {
    return (
      <span key="qti-qn-wrap">
        {numberNode}
        {String(node).replace(/^(?:[ \t\r]*\n)+/, "")}
      </span>
    );
  }
  if (!React.isValidElement(node)) {
    return (
      <span key="qti-qn-wrap">
        {numberNode}
        {node}
      </span>
    );
  }
  if (isOwnedBodyInteraction(node) || leavesNumberToInteraction(node)) return node;
  if (classNameOf(node).includes("qti-ext-vcq")) {
    return (
      <React.Fragment key={node.key ?? "qti-qn-before"}>
        {withKey(numberNode, QN_NUMBER_KEY)}
        {node}
      </React.Fragment>
    );
  }
  if (node.type === "p") return prependInside(node, numberNode);
  if (!isTextLineHost(node) && node.type !== React.Fragment) return prependInside(node, numberNode);

  const children = childrenOf(node);
  const index = children.findIndex((child) => !isIgnorableLeadingNode(child));
  if (index < 0) return prependInside(node, numberNode);

  const first = children[index];
  const firstIsFragment = React.isValidElement(first) && first.type === React.Fragment;
  if (!React.isValidElement(first) || (!isTextLineHost(first) && !firstIsFragment)) {
    return prependInside(node, numberNode);
  }

  const replaced = placeInFirstLine(first, numberNode);
  if (replaced === first) return node;
  const next = [...children];
  next[index] = replaced;
  return React.cloneElement(node, { key: node.key ?? "qti-qn-first" }, ...next);
}

function containsQuestion(node: React.ReactNode): boolean {
  if (!React.isValidElement(node)) return false;
  if (hasClassToken(node, "qti-ext-question")) return true;
  return childrenOf(node).some(containsQuestion);
}

function numberQuestion(question: React.ReactElement, numberNode: React.ReactNode): React.ReactElement {
  const children = childrenOf(question);
  const index = children.findIndex((child) => !isIgnorableLeadingNode(child));
  if (index < 0) return question;

  const anchor = children[index];
  if (leavesNumberToInteraction(anchor)) return question;

  const placed = placeInFirstLine(anchor, numberNode);
  if (placed === anchor) return question;
  const next = [...children];
  next[index] = placed;
  return React.cloneElement(question, undefined, ...next);
}

function injectInto(node: React.ReactElement, numberNode: React.ReactNode): React.ReactElement {
  if (hasClassToken(node, "qti-ext-question")) return numberQuestion(node, numberNode);

  const children = childrenOf(node);
  const index = children.findIndex(containsQuestion);
  if (index < 0) return numberQuestion(node, numberNode);

  const next = [...children];
  const child = children[index];
  next[index] = React.isValidElement(child) ? injectInto(child, numberNode) : child;
  return React.cloneElement(node, undefined, ...next);
}

/**
 * 문항 번호(앞)를 div.qti-ext-question의 첫 의미 있는 child 첫 줄에 넣는다.
 * 앞의 빈 텍스트와 빈 p는 건너뛴다. 그 child가 빈칸매칭·핫텍스트·핫스팟이면
 * 번호를 형제 span으로 두지 않고, 각 인터랙션이 본문 첫 줄에 넣게 둔다.
 */
export function injectInlineQuestionNumber(
  tree: React.ReactNode,
  numberNode: React.ReactNode,
): React.ReactNode {
  if (!tree || !React.isValidElement(tree)) return tree;
  return injectInto(tree, numberNode);
}
