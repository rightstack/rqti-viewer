import React, { useCallback, useEffect, useRef, useState } from "react";
import type { OrderChoiceType, QTIParserOptions } from "../../../types";
import OrderChoice from "./OrderChoice";

interface OrderOptionProps {
  choices: OrderChoiceType[];
  selectedOrder: string[];
  responseIdentifier: string;
  options: Omit<QTIParserOptions, "onOrderChange" | "onDragStart" | "onDragEnd" | "selectedOrder">;
  onOrderChange: (order: string[]) => void;
}

const OrderOption: React.FC<OrderOptionProps> = ({
  choices,
  selectedOrder,
  responseIdentifier,
  options,
  onOrderChange,
}) => {
  const isSubmit = options.isSubmit ?? false;
  const isPreview = options.mode === "preview";

  // 드래그 상태 관리
  const [draggedChoiceId, setDraggedChoiceId] = useState<string | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [droppedChoiceId, setDroppedChoiceId] = useState<string | null>(null);

  // 터치 이벤트 상태
  const touchStartY = useRef<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // 타겟 인덱스 계산
  const calculateTargetIndex = useCallback((clientY: number, container: HTMLElement) => {
    const children = Array.from(container.children);
    if (children.length === 0) return 0;

    const firstChild = children[0] as HTMLElement;
    const firstChildRect = firstChild.getBoundingClientRect();
    const firstChildMiddle = firstChildRect.top + firstChildRect.height / 2;

    if (clientY < firstChildMiddle) return 0;

    for (let i = 0; i < children.length; i++) {
      const child = children[i] as HTMLElement;
      const rect = child.getBoundingClientRect();
      const elementMiddle = rect.top + rect.height / 2;

      if (clientY < elementMiddle) return i;
    }

    return children.length;
  }, []);

  // 순서 업데이트
  const updateOrder = useCallback(
    (choiceId: string, targetIndex: number) => {
      const newOrder = [...selectedOrder];
      const draggedIndex = newOrder.indexOf(choiceId);

      if (draggedIndex === -1 || draggedIndex === targetIndex) return;

      newOrder.splice(draggedIndex, 1);
      let insertIndex = targetIndex;

      if (draggedIndex < targetIndex) {
        insertIndex = targetIndex - 1;
      }

      if (insertIndex === 0) {
        newOrder.unshift(choiceId);
      } else if (insertIndex >= newOrder.length) {
        newOrder.push(choiceId);
      } else {
        newOrder.splice(insertIndex, 0, choiceId);
      }

      onOrderChange(newOrder);
    },
    [selectedOrder, onOrderChange]
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

      const targetIndex = calculateTargetIndex(e.clientY, containerRef.current);
      setDragOverIndex(targetIndex);
    },
    [calculateTargetIndex]
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
      const targetIndex = calculateTargetIndex(e.clientY, container);

      updateOrder(choiceId, targetIndex);
      setDragOverIndex(null);
      setDraggedChoiceId(null);
      handleDropComplete(choiceId);
    },
    [calculateTargetIndex, updateOrder, handleDropComplete]
  );

  const handleDragStart = useCallback((choiceId: string) => {
    setDraggedChoiceId(choiceId);
  }, []);

  const handleDragEnd = useCallback(() => {
    setDraggedChoiceId(null);
  }, []);

  // 터치 이벤트 핸들러
  const handleTouchStart = useCallback((e: React.TouchEvent, choiceId: string) => {
    const touch = e.touches[0];
    touchStartY.current = touch.clientY;
    setDraggedChoiceId(choiceId);
  }, []);

  const handleTouchMove = useCallback(
    (e: TouchEvent) => {
      if (!draggedChoiceId || !containerRef.current || touchStartY.current === null) return;

      e.preventDefault();
      const touch = e.touches[0];
      const targetIndex = calculateTargetIndex(touch.clientY, containerRef.current);
      setDragOverIndex(targetIndex);
    },
    [draggedChoiceId, calculateTargetIndex]
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
      const targetIndex = calculateTargetIndex(touch.clientY, containerRef.current);

      setDroppedChoiceId(draggedChoiceId);
      updateOrder(draggedChoiceId, targetIndex);
      setDragOverIndex(null);
      setDraggedChoiceId(null);
      touchStartY.current = null;
      handleDropComplete(draggedChoiceId);
    },
    [draggedChoiceId, calculateTargetIndex, updateOrder, handleDropComplete]
  );

  // 터치 이벤트 리스너 등록
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.addEventListener("touchmove", handleTouchMove, { passive: false });
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
      className="space-y-3"
      role="group"
      aria-label="드래그하여 순서를 정하세요"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {selectedOrder.map((choiceId, idx) => {
        const choice = choices.find((c) => c.identifier === choiceId);
        if (!choice) return null;

        const isDragOver = dragOverIndex === idx;
        const isSelected = draggedChoiceId === choiceId || droppedChoiceId === choiceId;
        const isDropped = droppedChoiceId === choiceId;
        const isLastElement = idx === selectedOrder.length - 1;
        const isDragOverLast = dragOverIndex !== null && dragOverIndex >= selectedOrder.length;
        const isCorrect = isSubmit && correctOrder[idx] === choiceId;

        return (
          <div key={choice.identifier} className="rtqi:relative">
            {/* 드래그 오버 시 요소 위 중간 영역에 선 표시 */}
            {isDragOver && (
              <div className="qti-ext-order-drag-indicator qti-ext-order-drag-indicator-top" />
            )}

            {/* 마지막 위치로 이동할 때 마지막 요소 아래에 선 표시 */}
            {isLastElement && isDragOverLast && (
              <div className="qti-ext-order-drag-indicator qti-ext-order-drag-indicator-bottom" />
            )}

            <div className="rtqi:transition-all rtqi:duration-200">
              <OrderChoice
                choice={choice}
                index={idx}
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
