import React, { useMemo, useState } from "react";
import { extractListStyleType } from "../../parser/listGrouping";
import type { OrderChoiceType, QTIParserOptions, ResponseValue } from "../../types";
import { extractMediaFromElement, extractTextFromElement } from "../../utils";
import OrderClickOption from "./components/OrderClickOption";
import OrderOption from "./components/OrderOption";

interface OrderInteractionProps {
  element: Element;
  options: Omit<QTIParserOptions, "onOrderChange" | "onDragStart" | "onDragEnd" | "selectedOrder">;
  index: number;
}

/** 선택 방식: class로 결정 (기본 drag) */
type OrderingMode = "click" | "drag";

const resolveOrderingMode = (element: Element): OrderingMode => {
  const className = element.getAttribute("class") || "";
  if (className.includes("qti-ext-ordering-click")) return "click";
  // qti-ext-ordering-drag 또는 미지정 시 drag(기본)
  return "drag";
};

export const OrderInteraction: React.FC<OrderInteractionProps> = ({ element, options, index }) => {
  const responseIdentifier = element.getAttribute("response-identifier") || "";

  // 선택 방식 (click | drag)
  const orderingMode = useMemo(() => resolveOrderingMode(element), [element]);
  // 이미지형 여부 (레이아웃 분기용)
  const isImageOrder = useMemo(
    () => (element.getAttribute("class") || "").includes("qti-image-order"),
    [element]
  );
  // 순번 라벨 스타일 (qti-list-style-type-*), 미지정 시 decimal
  const listStyleType = useMemo(
    () => extractListStyleType(element.getAttribute("class") || ""),
    [element]
  );

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

  // choices 식별자 목록/키.
  // 주의: 상위(Question)는 응답 변경마다 XML을 재파싱하므로 element/choices의
  // 객체 정체성이 매 렌더 새로 생기지만, 식별자 문자열 키는 안정적이다.
  // effect가 이 키에만 의존하게 해서 재파싱으로 선택 상태가 초기화되는 것을 막는다.
  const choiceIds = useMemo(() => choices.map((c) => c.identifier), [choices]);
  const choicesKey = choiceIds.join("|");

  // 초기 순서
  // - drag: 저장 응답 없으면 choices 순서 전체 (항상 정렬된 리스트)
  // - click: 저장 응답 없으면 빈 배열 (사용자가 누른 순서만 채워짐)
  const initialOrder = useMemo(() => {
    const savedResponse = options.responses?.[responseIdentifier];
    if (Array.isArray(savedResponse) && savedResponse.length > 0) {
      return savedResponse;
    }
    return orderingMode === "click" ? [] : choiceIds;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 내부 상태 관리
  const [selectedOrder, setSelectedOrder] = useState<string[]>(initialOrder);
  const isPreview = options.mode === "preview";

  // 제어형(responses 주입) 응답 동기화 + 문항(choices) 교체 시에만 초기화.
  // 값 기반 키에만 의존하므로 재파싱(정체성 변화)으로는 재실행되지 않는다.
  const savedResponse = options.responses?.[responseIdentifier];
  const savedKey = Array.isArray(savedResponse) ? savedResponse.join("|") : "";
  React.useEffect(() => {
    if (savedKey) {
      setSelectedOrder(savedKey.split("|"));
    } else {
      setSelectedOrder(orderingMode === "click" ? [] : choicesKey ? choicesKey.split("|") : []);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [savedKey, choicesKey, orderingMode]);

  // 순서 변경 핸들러 (공통)
  const handleOrderChange = (order: string[]) => {
    if (isPreview) return;
    setSelectedOrder(order);
    options.onResponseChange?.(responseIdentifier, order as ResponseValue);
  };

  return (
    <div key={`order-${responseIdentifier}-${index}`} className="my-4">
      {orderingMode === "click" ? (
        <OrderClickOption
          choices={choices}
          clickedOrder={selectedOrder}
          responseIdentifier={responseIdentifier}
          options={options}
          isImageOrder={isImageOrder}
          listStyleType={listStyleType}
          onOrderChange={handleOrderChange}
        />
      ) : (
        <OrderOption
          choices={choices}
          selectedOrder={selectedOrder}
          responseIdentifier={responseIdentifier}
          options={options}
          listStyleType={listStyleType}
          onOrderChange={handleOrderChange}
        />
      )}
    </div>
  );
};
