import React from "react";

const QN_INLINE_CLASS = "qti-ext-qn-inline";
const INJECTABLE_TAGS = ["p", "div", "span"];
const QN_NUMBER_KEY = "qti-qn-number";

function isInjectableElementType(type: unknown): boolean {
  return typeof type === "string" && INJECTABLE_TAGS.includes(type.toLowerCase());
}

function injectIntoNode(node: React.ReactNode, numberNode: React.ReactNode): React.ReactNode {
  if (node === undefined || node === null) return numberNode;

  if (typeof node === "string") {
    return (
      <span className={QN_INLINE_CLASS} key="qti-qn-wrap">
        {numberNode}
        {node}
      </span>
    );
  }

  if (!React.isValidElement(node)) {
    return (
      <span className={QN_INLINE_CLASS} key="qti-qn-wrap">
        {numberNode}
        {node}
      </span>
    );
  }

  const nodeProps = node.props as { className?: string; children?: React.ReactNode };
  const nodeClassName = nodeProps.className ?? "";
  const childrenArray = React.Children.toArray(nodeProps.children);

  const isWrapper =
    typeof nodeClassName === "string" &&
    (nodeClassName.includes("qti-ext-prompt") || nodeClassName.includes("qti-ext-question"));

  if (isWrapper) {
    const idx = childrenArray.findIndex(
      (c) =>
        React.isValidElement(c) &&
        isInjectableElementType((c as React.ReactElement).type as unknown)
    );
    if (idx >= 0) {
      const firstBlock = childrenArray[idx];
      const newChildren = [
        ...childrenArray.slice(0, idx),
        injectIntoNode(firstBlock, numberNode),
        ...childrenArray.slice(idx + 1),
      ];
      return React.cloneElement(
        node as React.ReactElement<{ className?: string; children?: React.ReactNode }>,
        { key: node.key ?? "qti-qn-first", children: newChildren }
      );
    }
  }

  const keyedNumberNode =
    React.isValidElement(numberNode) && numberNode.key !== undefined && numberNode.key !== null
      ? numberNode
      : React.createElement(React.Fragment, { key: QN_NUMBER_KEY }, numberNode);

  return React.cloneElement(
    node as React.ReactElement<{ className?: string; children?: React.ReactNode }>,
    {
      key: node.key ?? "qti-qn-first",
      className: nodeClassName ? `${nodeClassName} ${QN_INLINE_CLASS}` : QN_INLINE_CLASS,
      children: [keyedNumberNode, ...childrenArray],
    }
  );
}

/**
 * Injects the question number node into the parsed QTI React tree
 * so it appears inline with the first prompt (before question text).
 * Handles Fragment first-child, div.qti-ext-prompt and div.qti-ext-question with nested p/div/span.
 */
export function injectInlineQuestionNumber(
  tree: React.ReactNode,
  numberNode: React.ReactNode
): React.ReactNode {
  if (!tree || !React.isValidElement(tree)) return tree;

  const props = tree.props as { children?: React.ReactNode };
  const siblings = React.Children.toArray(props.children);
  const first = siblings[0];
  const rest = siblings.slice(1);

  let firstWithNumber: React.ReactNode;
  if (React.isValidElement(first) && first.type === React.Fragment) {
    const fragProps = first.props as { children?: React.ReactNode };
    const fragChildren = React.Children.toArray(fragProps.children);
    const fragFirst = fragChildren[0];
    const fragRest = fragChildren.slice(1);
    firstWithNumber = React.createElement(
      React.Fragment,
      { key: first.key },
      injectIntoNode(fragFirst, numberNode),
      ...fragRest
    );
  } else {
    firstWithNumber = injectIntoNode(first, numberNode);
  }

  const keyedFirst =
    firstWithNumber !== null &&
    firstWithNumber !== undefined &&
    React.isValidElement(firstWithNumber) &&
    firstWithNumber.key !== undefined &&
    firstWithNumber.key !== null
      ? firstWithNumber
      : React.createElement(React.Fragment, { key: "qti-qn-first" }, firstWithNumber);

  return React.cloneElement(tree as React.ReactElement<{ children?: React.ReactNode }>, {
    children: [keyedFirst, ...rest],
  });
}
