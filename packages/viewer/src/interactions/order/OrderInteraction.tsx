import React, { useMemo, useState } from "react";
import type { OrderChoiceType, QTIParserOptions, ResponseValue } from "../../types";
import { extractMediaFromElement, extractTextFromElement } from "../../utils";
import OrderOption from "./components/OrderOption";

interface OrderInteractionProps {
  element: Element;
  options: Omit<QTIParserOptions, "onOrderChange" | "onDragStart" | "onDragEnd" | "selectedOrder">;
  index: number;
}

export const OrderInteraction: React.FC<OrderInteractionProps> = ({ element, options, index }) => {
  const responseIdentifier = element.getAttribute("response-identifier") || "";

  // choices 추출
  const choices: OrderChoiceType[] = useMemo(() => {
    const result: OrderChoiceType[] = [];
    element.querySelectorAll("qti-simple-choice").forEach((choiceEl) => {
      const identifier = choiceEl.getAttribute("identifier") || "";
      const choiceText = extractTextFromElement(choiceEl);
      const media = extractMediaFromElement(choiceEl);

      result.push({
        identifier,
        text: choiceText || undefined,
        media: media.length > 0 ? media : undefined,
      });
    });
    return result;
  }, [element]);

  // 초기 순서 (저장된 응답이 있으면 복원, 없으면 choices 순서)
  const initialOrder = useMemo(() => {
    const savedResponse = options.responses?.[responseIdentifier];
    if (Array.isArray(savedResponse) && savedResponse.length > 0) {
      return savedResponse;
    }
    return choices.map((c) => c.identifier);
  }, [options.responses, responseIdentifier, choices]);

  // 내부 상태 관리
  const [selectedOrder, setSelectedOrder] = useState<string[]>(initialOrder);
  const isPreview = options.mode === "preview";

  // responses가 변경되면 selectedOrder 업데이트
  React.useEffect(() => {
    const savedResponse = options.responses?.[responseIdentifier];
    if (Array.isArray(savedResponse) && savedResponse.length > 0) {
      setSelectedOrder(savedResponse);
    } else if (!savedResponse) {
      // 응답이 없으면 초기 순서로 리셋
      setSelectedOrder(choices.map((c) => c.identifier));
    }
  }, [options.responses, responseIdentifier, choices]);

  // options.theme이 있으면 사용하고, 없으면 default 테마 사용
  // theme과 correctOrder는 OrderOption에서 처리

  // ORQ 순서 변경 핸들러
  const handleOrderChange = (order: string[]) => {
    if (isPreview) return;
    setSelectedOrder(order);
    options.onResponseChange?.(responseIdentifier, order as ResponseValue);
  };

  return (
    <div key={`order-${responseIdentifier}-${index}`} className="my-4">
      <OrderOption
        choices={choices}
        selectedOrder={selectedOrder}
        responseIdentifier={responseIdentifier}
        options={options}
        onOrderChange={handleOrderChange}
      />
    </div>
  );
};
