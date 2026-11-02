import React, { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "../../../lib/utils";
import type { OrderChoiceType, QTIParserOptions } from "../../../types";
import OrderChoice from "./OrderChoice";

function isHorizontalStackingLayout(layoutClass?: string): boolean {
  return /qti-choices-stacking-[2-5](?!\d)/.test(layoutClass ?? "");
}

function rectsOverlapVertically(a: DOMRect, b: DOMRect): boolean {
  return a.top < b.bottom && b.top < a.bottom;
}

function calculateGridInsertIndex(
  clientX: number,
  clientY: number,
  children: HTMLElement[]
): number {
  for (let i = 0; i < children.length; i++) {
    const rect = children[i].getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;

    if (clientY > rect.bottom) continue;

    if (clientY < rect.top) {
      const prev = i > 0 ? children[i - 1].getBoundingClientRect() : null;
      const pointerInPrevRow = prev !== null && clientY >= prev.top && clientY <= prev.bottom;
      if (pointerInPrevRow) return i;
      if (clientX < centerX) return i;

      const next = children[i + 1];
      if (!next) return children.length;
      if (!rectsOverlapVertically(rect, next.getBoundingClientRect())) return i + 1;
      continue;
    }

    if (clientX < centerX) return i;
  }

  return children.length;
}

function calculateVerticalInsertIndex(clientY: number, children: HTMLElement[]): number {
  const firstChildRect = children[0].getBoundingClientRect();
  const firstChildMiddle = firstChildRect.top + firstChildRect.height / 2;

  if (clientY < firstChildMiddle) return 0;

  for (let i = 0; i < children.length; i++) {
    const rect = children[i].getBoundingClientRect();
    const elementMiddle = rect.top + rect.height / 2;
    if (clientY < elementMiddle) return i;
  }

  return children.length;
}

interface OrderOptionProps {
  choices: OrderChoiceType[];
  selectedOrder: string[];
  responseIdentifier: string;
  options: Omit<
    QTIParserOptions,
    "onOrderChange" | "onDragStart" | "onDragEnd" | "selectedOrder"
  >;
  /** 순번 라벨 스타일 (qti-list-style-type-*) */
  listStyleType?: string | null;
  /** 나열 방식 클래스 (qti-orientation-* / qti-choices-stacking-*) */
  layoutClass?: string;
  onOrderChange: (order: string[]) => void;
}

const OrderOption = ({
  choices,
  selectedOrder,
  responseIdentifier,
  options,
  listStyleType,
  layoutClass,
  onOrderChange,
}: OrderOptionProps) => {
  const isSubmit = options.isSubmit ?? false;
  const isPreview = options.mode !== "practice";

  // 드래그 상태 관리
  const [draggedChoiceId, setDraggedChoiceId] = useState<string | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [droppedChoiceId, setDroppedChoiceId] = useState<string | null>(null);

  // 터치 이벤트 상태
  const touchStartY = useRef<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const isHorizontalStack = isHorizontalStackingLayout(layoutClass);

  const calculateTargetIndex = useCallback(
    (clientX: number, clientY: number, container: HTMLElement) => {
      const children = Array.from(container.children) as HTMLElement[];
      if (children.length === 0) return 0;
      if (isHorizontalStack) return calculateGridInsertIndex(clientX, clientY, children);
      return calculateVerticalInsertIndex(clientY, children);
    },
    [isHorizontalStack]
  );

  // 카드는 DOM 순서를 유지한다. 놓은 시각적 위치의 순위만 selectedOrder에 반영한다.
  const updateOrder = useCallback(
    (choiceId: string, targetIndex: number) => {
      const visualIndex = choices.findIndex((choice) => choice.identifier === choiceId);
      let insertIndex = targetIndex;
      if (visualIndex !== -1 && visualIndex < targetIndex) {
        insertIndex -= 1;
      }

      const newOrder = selectedOrder.filter((id) => id !== choiceId);
      if (insertIndex <= 0) {
        newOrder.unshift(choiceId);
      } else if (insertIndex >= newOrder.length) {
        newOrder.push(choiceId);
      } else {
        newOrder.splice(insertIndex, 0, choiceId);
      }

      if (
        newOrder.length === selectedOrder.length &&
        newOrder.every((id, index) => id === selectedOrder[index])
      ) {
        return;
      }

      onOrderChange(newOrder);
    },
    [choices, selectedOrder, onOrderChange]
  );

  // 드롭 완료 처리
  const handleDropComplete = useCallback((choiceId: string) => {
    setDroppedChoiceId(choiceId);
    setTimeout(() => {
      setDroppedChoiceId(null);
    }, 1000);
  }, []);

  // 드래그 앤 드롭 핸들러 (마우스)
  const handleDragOver = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      if (!containerRef.current) return;

      const targetIndex = calculateTargetIndex(e.clientX, e.clientY, containerRef.current);
      setDragOverIndex(targetIndex);
    },
    [calculateTargetIndex],
  );

  const handleDragLeave = useCallback(() => {
    setDragOverIndex(null);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const choiceId = e.dataTransfer.getData("text/plain");
      if (!choiceId) return;

      const container = e.currentTarget as HTMLElement;
      const targetIndex = calculateTargetIndex(e.clientX, e.clientY, container);

      updateOrder(choiceId, targetIndex);
      setDragOverIndex(null);
      setDraggedChoiceId(null);
      handleDropComplete(choiceId);
    },
    [calculateTargetIndex, updateOrder, handleDropComplete],
  );

  const handleDragStart = useCallback((choiceId: string) => {
    setDraggedChoiceId(choiceId);
  }, []);

  const handleDragEnd = useCallback(() => {
    setDraggedChoiceId(null);
  }, []);

  // 터치 이벤트 핸들러
  const handleTouchStart = useCallback(
    (e: React.TouchEvent, choiceId: string) => {
      const touch = e.touches[0];
      touchStartY.current = touch.clientY;
      setDraggedChoiceId(choiceId);
    },
    [],
  );

  const handleTouchMove = useCallback(
    (e: TouchEvent) => {
      if (
        !draggedChoiceId ||
        !containerRef.current ||
        touchStartY.current === null
      )
        return;

      e.preventDefault();
      const touch = e.touches[0];
      const targetIndex = calculateTargetIndex(
        touch.clientX,
        touch.clientY,
        containerRef.current,
      );
      setDragOverIndex(targetIndex);
    },
    [draggedChoiceId, calculateTargetIndex],
  );

  const handleTouchEnd = useCallback(
    (e: TouchEvent) => {
      if (!draggedChoiceId || !containerRef.current) {
        setDraggedChoiceId(null);
        setDragOverIndex(null);
        touchStartY.current = null;
        return;
      }

      const touch = e.changedTouches[0];
      const targetIndex = calculateTargetIndex(
        touch.clientX,
        touch.clientY,
        containerRef.current,
      );

      setDroppedChoiceId(draggedChoiceId);
      updateOrder(draggedChoiceId, targetIndex);
      setDragOverIndex(null);
      setDraggedChoiceId(null);
      touchStartY.current = null;
      handleDropComplete(draggedChoiceId);
    },
    [draggedChoiceId, calculateTargetIndex, updateOrder, handleDropComplete],
  );

  // 터치 이벤트 리스너 등록
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.addEventListener("touchmove", handleTouchMove, {
      passive: false,
    });
    container.addEventListener("touchend", handleTouchEnd, { passive: false });

    return () => {
      container.removeEventListener("touchmove", handleTouchMove);
      container.removeEventListener("touchend", handleTouchEnd);
    };
  }, [handleTouchMove, handleTouchEnd]);

  const correctOrder =
    options.correctOrder ||
    (Array.isArray(options.correctAnswers?.[responseIdentifier])
      ? (options.correctAnswers[responseIdentifier] as string[])
      : []);

  return (
    <div
      ref={containerRef}
      className={cn("qti-ext-order-list", "space-y-3", layoutClass)}
      role="group"
      aria-label="드래그하여 순서를 정하세요"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {choices.map((choice, domIndex) => {
        const choiceId = choice.identifier;
        const rankIndex = selectedOrder.indexOf(choiceId);
        const orderRank = rankIndex >= 0 ? rankIndex + 1 : null;

        const isDragOver = dragOverIndex === domIndex;
        const isSelected = draggedChoiceId === choiceId || droppedChoiceId === choiceId;
        const isDropped = droppedChoiceId === choiceId;
        const isLastElement = domIndex === choices.length - 1;
        const isDragOverLast = dragOverIndex !== null && dragOverIndex >= choices.length;
        const isCorrect = isSubmit && rankIndex >= 0 && correctOrder[rankIndex] === choiceId;

        return (
          <div key={choice.identifier} className="rqti:relative">
            {/* 드래그 오버 시 요소 위 중간 영역에 선 표시 */}
            {isDragOver && (
              <div className="qti-ext-order-drag-indicator qti-ext-order-drag-indicator-top" />
            )}

            {/* 마지막 위치로 이동할 때 마지막 요소 아래에 선 표시 */}
            {isLastElement && isDragOverLast && (
              <div className="qti-ext-order-drag-indicator qti-ext-order-drag-indicator-bottom" />
            )}

            <div className="rqti:transition-all rqti:duration-200">
              <OrderChoice
                choice={choice}
                index={domIndex}
                orderRank={orderRank}
                listStyleType={listStyleType}
                isSelected={isSelected}
                isDropped={isDropped}
                isCorrect={isCorrect}
                isSubmit={isSubmit}
                isPreview={isPreview}
                showCorrectAnswer={false}
                showAnswerFeedback={isSubmit}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
                onTouchStart={handleTouchStart}
                token={options.token}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default OrderOption;
