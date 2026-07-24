import { useMemo, useState } from "react";
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

/** Fisher-Yates 셔플 (원본 불변) */
const shuffleArray = <T,>(arr: T[]): T[] => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

export const OrderInteraction = ({ element, options, index }: OrderInteractionProps) => {
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
  // 나열 방식 (orientation/stacking) — SCQ와 동일 명명. 세로 1열이 기본이라 미지정 시 빈 문자열.
  const layoutClass = useMemo(() => {
    const cls = element.getAttribute("class") || "";
    const orientation = cls.match(/qti-orientation-(?:horizontal|vertical)/)?.[0];
    const stacking = cls.match(/qti-choices-stacking-\d+/)?.[0];
    return [orientation, stacking].filter(Boolean).join(" ");
  }, [element]);
  // shuffle 속성 (boolean). true면 simple-choice를 무작위 배치.
  const shuffleEnabled = useMemo(
    () => (element.getAttribute("shuffle") || "").toLowerCase() === "true",
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

  // 표시 순서(식별자). shuffle=true면 무작위, 아니면 DOM 순서.
  // 문항(choicesKey)/shuffle 값이 바뀔 때만 재계산하고, 재파싱(리렌더)에서는 상태에 보관된 순서를 유지한다.
  // 키가 바뀌면 렌더 중 상태를 조정한다(effect 불필요 패턴).
  const shuffleKey = `${choicesKey}::${shuffleEnabled}`;
  const [displayState, setDisplayState] = useState<{ key: string; ids: string[] }>(() => ({
    key: shuffleKey,
    ids: shuffleEnabled ? shuffleArray(choiceIds) : choiceIds,
  }));
  if (displayState.key !== shuffleKey) {
    setDisplayState({
      key: shuffleKey,
      ids: shuffleEnabled ? shuffleArray(choiceIds) : choiceIds,
    });
  }
  const displayIds = displayState.ids;

  // 클릭형 표시용: 셔플된 순서로 재배열한 choices
  const displayChoices = useMemo(() => {
    const byId = new Map(choices.map((c) => [c.identifier, c]));
    return displayIds.map((id) => byId.get(id)).filter((c): c is OrderChoiceType => Boolean(c));
  }, [choices, displayIds]);

  const isPreview = options.mode === "preview";

  // 제어형(responses 주입) 응답 동기화 + 문항(choices) 교체 시 초기화.
  // effect 안에서 setState하면 cascading render 경고가 발생하므로,
  // 값 기반 동기화 키가 바뀔 때 "렌더 중 상태 조정" 패턴으로 처리한다.
  // (https://react.dev/learn/you-might-not-need-an-effect)
  const savedResponse = options.responses?.[responseIdentifier];
  const savedKey = Array.isArray(savedResponse) ? savedResponse.join("|") : "";
  const syncKey = `${savedKey}::${choicesKey}::${orderingMode}::${displayIds.join("|")}`;

  // 동기화 키에 대응하는 초기/재설정 순서
  // - 저장 응답이 있으면 그 순서
  // - click: 빈 배열 (사용자가 누른 순서만 채워짐)
  // - drag: 표시 순서(displayIds) 전체 (항상 정렬된 리스트)
  const resolveSyncedOrder = (): string[] =>
    savedKey ? savedKey.split("|") : orderingMode === "click" ? [] : displayIds;

  const [orderState, setOrderState] = useState<{ key: string; order: string[] }>(() => ({
    key: syncKey,
    order: resolveSyncedOrder(),
  }));
  if (orderState.key !== syncKey) {
    setOrderState({ key: syncKey, order: resolveSyncedOrder() });
  }
  const selectedOrder = orderState.order;

  // 순서 변경 핸들러 (공통)
  const handleOrderChange = (order: string[]) => {
    if (isPreview) return;
    setOrderState({ key: syncKey, order });
    options.onResponseChange?.(responseIdentifier, order as ResponseValue);
  };

  return (
    <div key={`order-${responseIdentifier}-${index}`} className="my-4">
      {orderingMode === "click" ? (
        <OrderClickOption
          choices={displayChoices}
          clickedOrder={selectedOrder}
          responseIdentifier={responseIdentifier}
          options={options}
          isImageOrder={isImageOrder}
          listStyleType={listStyleType}
          layoutClass={layoutClass}
          onOrderChange={handleOrderChange}
        />
      ) : (
        <OrderOption
          choices={choices}
          selectedOrder={selectedOrder}
          responseIdentifier={responseIdentifier}
          options={options}
          listStyleType={listStyleType}
          layoutClass={layoutClass}
          onOrderChange={handleOrderChange}
        />
      )}
    </div>
  );
};
