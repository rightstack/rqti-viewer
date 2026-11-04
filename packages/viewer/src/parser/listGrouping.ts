import React from "react";
import { INDENT_UNIT_EM, parseTextIndent } from "../themes/utils";

const LIST_STYLE_TYPE_RE = /qti-list-style-type-([a-z-]+)/;
const TEXT_INDENT_RE = /qti-text-indent-(\d+)/;
const TEXT_INDENT_BLOCK_RE = /qti-text-indent-(?!first-)(\d+)/g;

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

  const buildListItemContent = (itemProps: {
    children?: React.ReactNode;
    className?: string;
  }): React.ReactNode => {
    const className = itemProps.className ?? "";
    const style = parseTextIndent(className).style;
    const blockIndent = sumBlockIndentLevel(className) * INDENT_UNIT_EM;

    if (typeof style.marginLeft === "string" && style.marginLeft.endsWith("em")) {
      const parsedMarginLeft = parseFloat(style.marginLeft);
      const contentMarginLeft = parsedMarginLeft - blockIndent;

      if (contentMarginLeft === 0) {
        delete style.marginLeft;
      } else {
        style.marginLeft = `${contentMarginLeft}em`;
      }
    }

    if (Object.keys(style).length === 0) {
      return itemProps.children;
    }

    return React.createElement("div", { style }, itemProps.children);
  };

  const listItems = frame.items.map((li) => {
    const elKey = li.element.key ?? "";
    const itemProps = li.element.props as {
      children?: React.ReactNode;
      className?: string;
      [key: string]: unknown;
    };
    const content = buildListItemContent(itemProps);

    if (li.subList) {
      return React.createElement("li", { key: `li-${elKey}` }, content, li.subList);
    }
    return React.createElement("li", { key: `li-${elKey}` }, content);
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

function sumBlockIndentLevel(className: string): number {
  let acc = 0;
  for (const match of className.matchAll(TEXT_INDENT_BLOCK_RE)) {
    const token = match[1];
    if (token) acc += parseInt(token, 10);
  }
  return acc;
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
      const ml = diff > 0 ? `${diff * INDENT_UNIT_EM}em` : undefined;
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
      const ml = diff > 0 ? `${diff * INDENT_UNIT_EM}em` : undefined;
      listKeySeq += 1;
      const listEl = buildList(frame, keyBase, listKeySeq, ml);
      const parentItems = stack[stack.length - 1].items;
      parentItems[parentItems.length - 1].subList = listEl;
    } else {
      const ml = frame.indent > 0 ? `${frame.indent * INDENT_UNIT_EM}em` : undefined;
      listKeySeq += 1;
      const listEl = buildList(frame, keyBase, listKeySeq, ml);
      result.push(listEl);
    }
  }

  return result;
}

const LIST_ITEM_HOSTS = new Set(["p", "div"]);

function isListItemHost(child: React.ReactElement, className: string): boolean {
  if (!LIST_ITEM_HOSTS.has(child.type as string) || extractListStyleType(className) === null) {
    return false;
  }

  // 표 구조 래퍼도 선택지 라벨 표시를 위해 qti-list-style-type-*를 쓴다.
  // 목록으로 바꾸면 qti-ext-grid 클래스와 레이아웃이 사라진다.
  const isGridWrapper = className
    .split(/\s+/)
    .some((token) => token === "qti-ext-grid" || /^qti-ext-grid-\d+$/.test(token));

  return !isGridWrapper;
}

/**
 * processedChildren 배열을 순회하며 qti-list-style-type-* 항목을
 * indent level 기반으로 그룹핑하여 중첩 <ol>/<ul> > <li> 구조로 변환한다.
 *
 * 그룹핑 규칙:
 * - qti-list-style-type-* 가 있는 p/div만 리스트 아이템
 * - qti-ext-grid 래퍼는 리스트 아이템에서 제외
 * - 그 외 → 리스트 아이템 아님 (그룹 종료)
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

    const props = child.props as Record<string, unknown>;
    const className = (props.className as string) || "";

    if (!isListItemHost(child, className)) {
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
