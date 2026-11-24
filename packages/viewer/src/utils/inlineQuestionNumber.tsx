import React, { type ReactNode } from "react";
import { QuestionNumber } from "../components/QuestionNumber";

const OWNED_INTERACTION_TAGS = new Set([
  "qti-gap-match-interaction",
  "qti-hottext-interaction",
  "qti-hotspot-interaction",
]);

const SKIP_CLASS_TOKENS = ["qti-ext-example", "qti-ext-gap-text-panel", "qti-ext-gap-choices"];
const LEADING_BREAK = /^(?:[ \t\r]*\n)+/;

function classNameOf(node: React.ReactElement): string {
  const className = (node.props as { className?: unknown }).className;
  return typeof className === "string" ? className : "";
}

export function isOwnedBodyInteraction(node: React.ReactNode): boolean {
  if (!React.isValidElement(node)) return false;
  const element = (node.props as { element?: { tagName?: string } }).element;
  const tag = element?.tagName?.toLowerCase();
  return !!tag && OWNED_INTERACTION_TAGS.has(tag);
}

function isQuestionTextElement(candidate: Element, interaction: Element): boolean {
  if (candidate === interaction || candidate.contains(interaction)) return false;
  const tag = candidate.tagName.toLowerCase();
  if (OWNED_INTERACTION_TAGS.has(tag)) return false;
  const className = candidate.getAttribute("class") ?? "";
  if (className.includes("qti-ext-prompt")) return true;
  if (tag === "p") return (candidate.textContent ?? "").trim() !== "";
  if (tag !== "div" && tag !== "span") return false;
  return Array.from(candidate.querySelectorAll("p")).some(
    (paragraph) => (paragraph.textContent ?? "").trim() !== "",
  );
}

function hasPrecedingQuestionText(interaction: Element): boolean {
  let current: Element | null = interaction;
  while (current) {
    const tag = current.tagName.toLowerCase();
    if (tag === "qti-item-body" || tag === "qti-assessment-item") break;
    let previous = current.previousElementSibling;
    while (previous) {
      if (isQuestionTextElement(previous, interaction)) return true;
      previous = previous.previousElementSibling;
    }
    current = current.parentElement;
  }
  return false;
}

export function inlineQuestionNumberNode(
  label: string | undefined,
  badge: ReactNode | undefined,
  interaction: Element,
): React.ReactNode | null {
  if (!label || label.trim() === "" || hasPrecedingQuestionText(interaction)) return null;
  return (
    <QuestionNumber key="qti-inline-qn" label={label} position="rqti:inline" feedbackBadge={badge} />
  );
}

export function stripLeadingBreaks(nodes: React.ReactNode[]): React.ReactNode[] {
  const next = [...nodes];
  while (next.length > 0) {
    const first = next[0];
    if (typeof first === "string" || typeof first === "number") {
      const text = String(first);
      if (text.trim() === "" && text.includes("\n")) {
        next.shift();
        continue;
      }
      const stripped = text.replace(LEADING_BREAK, "");
      if (stripped !== text) next[0] = stripped;
      break;
    }
    if (React.isValidElement(first) && first.type === React.Fragment) {
      const inner = React.Children.toArray((first.props as { children?: React.ReactNode }).children);
      const stripped = stripLeadingBreaks(inner);
      if (stripped.length === 0) {
        next.shift();
        continue;
      }
      if (stripped.length !== inner.length || stripped[0] !== inner[0]) {
        next[0] = React.cloneElement(first, undefined, ...stripped);
      }
      break;
    }
    break;
  }
  return next;
}

function isSkippedHost(node: React.ReactElement): boolean {
  const className = classNameOf(node);
  return SKIP_CLASS_TOKENS.some((token) => className.includes(token));
}

function isParagraph(
  node: React.ReactNode,
): node is React.ReactElement<{ children?: React.ReactNode }> {
  return React.isValidElement(node) && node.type === "p";
}

function isLeadingContent(node: React.ReactNode): boolean {
  if (typeof node === "string" || typeof node === "number") return String(node).trim() !== "";
  return React.isValidElement(node);
}

function isHottextGroup(
  node: React.ReactNode,
): node is React.ReactElement<{ children?: React.ReactNode }> {
  return React.isValidElement(node) && classNameOf(node).includes("qti-ext-hottext-group");
}

function placeNumberBeforeContent(
  children: React.ReactNode[],
  numberNode: React.ReactNode,
): React.ReactNode[] {
  const index = children.findIndex(isLeadingContent);
  const first = children[index];
  if (!isHottextGroup(first)) return [numberNode, ...children];

  const inner = React.Children.toArray(first.props.children);
  const next = [...children];
  next[index] = React.cloneElement(first, undefined, numberNode, ...inner);
  return next;
}

export function placeBodyInlineQuestionNumber(
  nodes: React.ReactNode[],
  label: string | undefined,
  badge: ReactNode | undefined,
  interaction: Element,
): React.ReactNode[] {
  const numberNode = inlineQuestionNumberNode(label, badge, interaction);
  if (!numberNode) return nodes;
  return placeInlineQuestionNumber(nodes, numberNode);
}

function placeInlineQuestionNumber(
  nodes: React.ReactNode[],
  numberNode: React.ReactNode,
): React.ReactNode[] {
  let placed = false;

  const walk = (items: React.ReactNode[]): React.ReactNode[] =>
    items.map((item) => {
      if (placed || !React.isValidElement(item) || typeof item.type !== "string") return item;
      if (isSkippedHost(item)) return item;
      if (isParagraph(item)) {
        placed = true;
        const children = stripLeadingBreaks(React.Children.toArray(item.props.children));
        return React.cloneElement(item, undefined, ...placeNumberBeforeContent(children, numberNode));
      }
      const children = React.Children.toArray(
        (item.props as { children?: React.ReactNode }).children,
      );
      if (children.length === 0) return item;
      const inner = walk(children);
      if (!placed) return item;
      return React.cloneElement(item, undefined, ...inner);
    });

  const next = walk(nodes);
  return placed ? next : [numberNode, ...nodes];
}
