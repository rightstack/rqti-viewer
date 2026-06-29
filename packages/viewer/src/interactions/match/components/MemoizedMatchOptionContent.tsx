import { type FC, useMemo } from "react";
import { renderQtiNode } from "../../../parser";
import type { QTIParserOptions } from "../../../types";

export type MemoizedMatchOptionContentProps = {
  element: Element;
  options: Omit<
    QTIParserOptions,
    "onMatchSelect" | "matchedPairs" | "selectedLeft" | "selectedRight"
  >;
};

/**
 * 매칭·디바이스 전환 등으로 상위가 리렌더될 때마다 DOMParser로 새 Element가 만들어져 참조가 매번 바뀝니다.
 * outerHTML·토큰·테마 id·문항 키가 같으면 renderQtiNode 결과를 재사용해 미디어 리마운트·깜빡임을 막습니다.
 */
export const MemoizedMatchOptionContent: FC<MemoizedMatchOptionContentProps> = ({
  element,
  options,
}) => {
  const contentSignature = element.outerHTML;
  const themeId = options.theme?.id ?? "";
  const token = options.token ?? "";
  const itemKey = options.itemKey ?? "";

  return useMemo(
    // eslint-disable-next-line react-hooks/preserve-manual-memoization
    () => renderQtiNode(element, options),

    [contentSignature, themeId, token, itemKey]
  );
};
