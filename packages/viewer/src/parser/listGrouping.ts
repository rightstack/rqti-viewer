import React from "react";

const LIST_STYLE_TYPE_RE = /qti-list-style-type-([a-z-]+)/;
const TEXT_INDENT_RE = /qti-text-indent-(\d+)/;

const ORDERED_TYPES = new Set([
  "decimal",
  "lower-alpha",
  "upper-alpha",
  "lower-roman",
  "upper-roman",
  "hangul-consonant",
  "hangul-consonant-paren",
  "hangul-consonant-bracket",
  "hangul-syllable",
  "circled",
]);

export function extractListStyleType(className: string): string | null {
  if (!className) return null;
  const match = className.match(LIST_STYLE_TYPE_RE);
  return match?.[1] ?? null;
}

export function extractIndentLevel(className: string): number {
  const match = className.match(TEXT_INDENT_RE);
  if (!match) return 0;
  return parseInt(match[1], 10);
}

export function isOrderedListType(type: string): boolean {
  return ORDERED_TYPES.has(type);
}

/* ── internal types ── */

interface LiNode {
  element: React.ReactElement;
  subList: React.ReactElement | null;
}

interface StackFrame {
  indent: number;
  items: LiNode[];
  listStyleType: string;
}

/* ── helpers ── */

function buildList(
  frame: StackFrame,
  keyBase: number,
  listSeq: number,
  marginLeft?: string
): React.ReactElement {
  const tag = isOrderedListType(frame.listStyleType) ? "ol" : "ul";

  const listItems = frame.items.map((li) => {
    const elKey = li.element.key ?? "";
    const itemProps = li.element.props as {
      children?: React.ReactNode;
      [key: string]: unknown;
    };
    if (li.subList) {
      return React.createElement("li", { key: `li-${elKey}` }, itemProps.children, li.subList);
    }
    return React.createElement("li", { key: `li-${elKey}` }, itemProps.children);
  });

  const style: React.CSSProperties | undefined = marginLeft ? { marginLeft } : undefined;

  return React.createElement(
    tag,
    {
      key: `${tag}-${keyBase}-${listSeq}`,
      className: `qti-list-style-type-${frame.listStyleType}`,
      style,
    },
    ...listItems
  );
}

/**
 * 연속된 리스트 아이템들을 indent level 기반으로
 * 중첩 ol/ul 구조로 변환한다.
 */
function nestGroup(items: React.ReactElement[], keyBase: number): React.ReactElement[] {
  const result: React.ReactElement[] = [];
  const stack: StackFrame[] = [];
  let listKeySeq = 0;

  for (const item of items) {
    const props = item.props as Record<string, unknown>;
    const className = (props.className as string) || "";
    const indent = extractIndentLevel(className);
    const listStyleType = extractListStyleType(className)!;

    while (stack.length > 0 && stack[stack.length - 1].indent > indent) {
      const frame = stack.pop()!;
      const parentIndent = stack.length > 0 ? stack[stack.length - 1].indent : indent;
      const diff = frame.indent - parentIndent;
      const ml = diff > 0 ? `${diff}em` : undefined;
      listKeySeq += 1;
      const listEl = buildList(frame, keyBase, listKeySeq, ml);
      if (stack.length > 0) {
        const parentItems = stack[stack.length - 1].items;
        parentItems[parentItems.length - 1].subList = listEl;
      } else {
        result.push(listEl);
      }
    }

    if (stack.length === 0 || stack[stack.length - 1].indent < indent) {
      stack.push({
        indent,
        items: [{ element: item, subList: null }],
        listStyleType,
      });
    } else {
      stack[stack.length - 1].items.push({ element: item, subList: null });
    }
  }

  while (stack.length > 0) {
    const frame = stack.pop()!;
    if (stack.length > 0) {
      const parentIndent = stack[stack.length - 1].indent;
      const diff = frame.indent - parentIndent;
      const ml = diff > 0 ? `${diff}em` : undefined;
      listKeySeq += 1;
      const listEl = buildList(frame, keyBase, listKeySeq, ml);
      const parentItems = stack[stack.length - 1].items;
      parentItems[parentItems.length - 1].subList = listEl;
    } else {
      const ml = frame.indent > 0 ? `${frame.indent}em` : undefined;
      listKeySeq += 1;
      const listEl = buildList(frame, keyBase, listKeySeq, ml);
      result.push(listEl);
    }
  }

  return result;
}

/**
 * processedChildren 배열을 순회하며 qti-list-style-type-* <p> 요소들을
 * indent level 기반으로 그룹핑하여 중첩 <ol>/<ul> > <li> 구조로 변환한다.
 *
 * 그룹핑 규칙:
 * - qti-list-style-type-* 없음 → 리스트 아이템 아님 (그룹 종료)
 * - 연속된 리스트 아이템은 qti-text-indent-N 기반으로 중첩 처리
 */
export function groupListItems(
  children: Array<React.ReactElement | string>
): Array<React.ReactElement | string> {
  const result: Array<React.ReactElement | string> = [];
  let currentGroup: React.ReactElement[] = [];
  let groupKeyBase = 0;

  const flushGroup = () => {
    if (currentGroup.length === 0) return;
    result.push(...nestGroup(currentGroup, groupKeyBase));
    currentGroup = [];
  };

  for (let i = 0; i < children.length; i++) {
    const child = children[i];

    if (typeof child === "string" || !React.isValidElement(child)) {
      flushGroup();
      result.push(child);
      continue;
    }

    if (child.type !== "p") {
      flushGroup();
      result.push(child);
      continue;
    }

    const props = child.props as Record<string, unknown>;
    const className = (props.className as string) || "";
    const listStyleType = extractListStyleType(className);

    if (!listStyleType) {
      flushGroup();
      result.push(child);
      continue;
    }

    if (currentGroup.length === 0) {
      groupKeyBase = i;
    }

    currentGroup.push(child);
  }

  flushGroup();
  return result;
}
