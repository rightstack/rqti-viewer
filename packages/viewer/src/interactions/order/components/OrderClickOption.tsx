import React from "react";
import { cn } from "../../../lib/utils";
import { MediaContent } from "../../../shared";
import type { OrderChoiceType, QTIParserOptions } from "../../../types";
import { getListStyleLabel } from "../../../utils/listStyleLabel";

interface OrderClickOptionProps {
  choices: OrderChoiceType[];
  /** 사용자가 누른 순서 (선택된 identifier 시퀀스) */
  clickedOrder: string[];
  responseIdentifier: string;
  options: Omit<QTIParserOptions, "onOrderChange" | "onDragStart" | "onDragEnd" | "selectedOrder">;
  /** 이미지형 레이아웃(그리드) 여부 */
  isImageOrder?: boolean;
  /** 순번 라벨 스타일 (qti-list-style-type-*) */
  listStyleType?: string | null;
  onOrderChange: (order: string[]) => void;
}

/**
 * 클릭 방식 순서 정하기.
 * - 선택지는 원래(셔플된) 위치에 고정되어 표시된다.
 * - 누르면 다음 순번이 부여되고, 다시 누르면 해제되어 뒤 순번이 자동으로 당겨진다.
 * - 응답값은 "누른 순서"의 identifier 배열.
 */
const OrderClickOption: React.FC<OrderClickOptionProps> = ({
  choices,
  clickedOrder,
  responseIdentifier,
  options,
  isImageOrder = false,
  listStyleType,
  onOrderChange,
}) => {
  const isSubmit = options.isSubmit ?? false;
  const isPreview = options.mode === "preview";
  const disabled = isSubmit || isPreview;

  const correctOrder =
    options.correctOrder ||
    (Array.isArray(options.correctAnswers?.[responseIdentifier])
      ? (options.correctAnswers[responseIdentifier] as string[])
      : []);

  const handleClick = (choiceId: string) => {
    if (disabled) return;
    const idx = clickedOrder.indexOf(choiceId);
    const next =
      idx === -1
        ? [...clickedOrder, choiceId]
        : clickedOrder.filter((id) => id !== choiceId);
    onOrderChange(next);
  };

  return (
    <div
      className={cn(
        "qti-ext-order-click-list",
        isImageOrder && "qti-ext-order-click-list-image"
      )}
      role="group"
      aria-label="순서대로 선택하세요"
    >
      {choices.map((choice) => {
        const order = clickedOrder.indexOf(choice.identifier);
        const selected = order !== -1;

        // 제출 후 정오답: 누른 순번 위치가 정답 순서와 일치하는지
        const isCorrect = isSubmit && selected && correctOrder[order] === choice.identifier;
        const isIncorrect = isSubmit && selected && !isCorrect;

        const className = cn(
          "qti-ext-option-base",
          "qti-ext-order-click-choice",
          selected && "qti-ext-order-click-choice-selected",
          isSubmit && isCorrect && "qti-ext-order-choice-correct",
          isSubmit && isIncorrect && "qti-ext-order-choice-incorrect",
          disabled && "qti-ext-option-disabled"
        );

        const badgeClassName = cn(
          "qti-ext-order-click-badge",
          selected && "qti-ext-order-click-badge-active",
          isSubmit && isCorrect && "qti-ext-order-number-correct",
          isSubmit && isIncorrect && "qti-ext-order-number-incorrect"
        );

        return (
          <button
            type="button"
            key={choice.identifier}
            className={className}
            onClick={() => handleClick(choice.identifier)}
            disabled={disabled}
            aria-pressed={selected}
          >
            <span className={badgeClassName} aria-hidden={!selected}>
              {selected ? getListStyleLabel(listStyleType, order + 1) : ""}
            </span>
            <span className="qti-ext-order-click-content">
              {choice.media && <MediaContent media={choice.media} token={options.token} />}
              {choice.text && <span className="qti-ext-order-click-text">{choice.text}</span>}
            </span>
          </button>
        );
      })}
    </div>
  );
};

export default OrderClickOption;
