import { cn } from "../../../lib/utils";
import type { OrderChoiceType, QTIParserOptions } from "../../../types";
import { getListStyleLabel } from "../../../utils/listStyleLabel";
import OrderChoiceContent from "./OrderChoiceContent";

interface OrderClickOptionProps {
  choices: OrderChoiceType[];
  /** 사용자가 누른 순서 (선택된 identifier 시퀀스) */
  clickedOrder: string[];
  responseIdentifier: string;
  options: Omit<
    QTIParserOptions,
    "onOrderChange" | "onDragStart" | "onDragEnd" | "selectedOrder"
  >;
  /** 이미지형 레이아웃(그리드) 여부 */
  isImageOrder?: boolean;
  /** 순번 라벨 스타일 (qti-list-style-type-*) */
  listStyleType?: string | null;
  /** 나열 방식 클래스 (qti-orientation-* / qti-choices-stacking-*) */
  layoutClass?: string;
  onOrderChange: (order: string[]) => void;
}

/**
 * 클릭 방식 순서 정하기.
 * - 선택지는 원래 위치에 고정된다.
 * - 왼쪽 칸은 누른 순번 1, 2, 3이다.
 * - 다시 누르면 해제되고 뒤 순번이 당겨진다.
 * - thumbnail·preview는 읽기 전용이다.
 */
const OrderClickOption = ({
  choices,
  clickedOrder,
  responseIdentifier,
  options,
  isImageOrder = false,
  listStyleType,
  layoutClass,
  onOrderChange,
}: OrderClickOptionProps) => {
  const isSubmit = options.isSubmit ?? false;
  const isPreview = options.mode !== "practice";
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
        isImageOrder && "qti-ext-order-click-list-image",
        layoutClass,
      )}
      role="group"
      aria-label="순서대로 선택하세요"
    >
      {choices.map((choice, domIndex) => {
        const order = clickedOrder.indexOf(choice.identifier);
        const selected = order !== -1;
        const orderRank = selected ? order + 1 : null;

        const isCorrect =
          isSubmit && selected && correctOrder[order] === choice.identifier;
        const isIncorrect = isSubmit && selected && !isCorrect;

        const className = cn(
          "qti-ext-option-base",
          "qti-ext-order-click-choice",
          selected && "qti-ext-order-click-choice-selected",
          isSubmit && isCorrect && "qti-ext-order-choice-correct",
          isSubmit && isIncorrect && "qti-ext-order-choice-incorrect",
          disabled && "qti-ext-option-disabled",
        );

        const choiceLabel =
          listStyleType === "none" ? null : (
            <span className="qti-ext-choice-option-label">
              {getListStyleLabel(listStyleType, domIndex + 1)}
            </span>
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
            <span className="qti-ext-order-click-rank">{orderRank}</span>
            <span className="qti-ext-order-click-body">
              {choiceLabel}
              <span className="qti-ext-order-click-content">
                {choice.element ? (
                  <OrderChoiceContent element={choice.element} options={options} />
                ) : null}
              </span>
            </span>
          </button>
        );
      })}
    </div>
  );
};

export default OrderClickOption;
