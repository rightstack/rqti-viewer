import { type FC, useMemo } from "react";
import { renderQtiNode } from "../../../parser";
import type { QTIParserOptions } from "../../../types";

type OrderChoiceContentProps = {
  element: Element;
  options: Omit<QTIParserOptions, "onOrderChange" | "onDragStart" | "onDragEnd" | "selectedOrder">;
};

/** 선택지 element의 `<p>`와 수식을 유지한다. */
const OrderChoiceContent: FC<OrderChoiceContentProps> = ({ element, options }) => {
  const contentSignature = element.outerHTML;
  const themeId = options.theme?.id ?? "";
  const token = options.token ?? "";
  const itemKey = options.itemKey ?? "";

  return useMemo(
    () => renderQtiNode(element, options),
    // 재파싱으로 element 정체성이 바뀌어도 본문·테마·토큰이 같으면 다시 그리지 않는다.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [contentSignature, themeId, token, itemKey]
  );
};

export default OrderChoiceContent;
