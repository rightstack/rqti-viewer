import { Fragment, useMemo } from "react";
import { renderQtiNode } from "../parser/renderQtiNode";
import type { OrderCorrectAnswerItem } from "../utils/choiceAnswerDisplayFromQti";
import { getNodeKey } from "../utils/getNodeKey";

export interface OrderCorrectAnswerPreviewProps {
  items: OrderCorrectAnswerItem[];
  token?: string;
}

function parseOrderAnswerNodes(html: string): ChildNode[] {
  const doc = new DOMParser().parseFromString(`<g>${html}</g>`, "text/xml");
  const root = doc.documentElement;
  if (root.getElementsByTagName("parsererror").length > 0) return [];
  return Array.from(root.childNodes);
}

function OrderAnswerBody({ html, token }: { html: string; token?: string }) {
  const nodes = useMemo(() => parseOrderAnswerNodes(html), [html]);
  return nodes.map((child) => (
    <Fragment key={getNodeKey(child)}>{renderQtiNode(child, { token })}</Fragment>
  ));
}

export function OrderCorrectAnswerPreview({ items, token }: OrderCorrectAnswerPreviewProps) {
  return (
    <span className="qti-ext-order-correct-answer">
      {items.map((item, index) => (
        <Fragment key={item.key}>
          {item.kind === "text" ? item.text : <OrderAnswerBody html={item.html} token={token} />}
          {index < items.length - 1 && <span aria-hidden="true"> - </span>}
        </Fragment>
      ))}
    </span>
  );
}
