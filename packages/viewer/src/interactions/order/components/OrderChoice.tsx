import { useRef, useState } from "react";
import { cn } from "../../../lib/utils";
import { MediaContent } from "../../../shared";
import type { OrderChoiceType } from "../../../types";
import { getListStyleLabel } from "../../../utils/listStyleLabel";

interface OrderChoiceProps {
  choice: OrderChoiceType;
  index: number;
  /** 순번 라벨 스타일 (qti-list-style-type-*) */
  listStyleType?: string | null;
  isSelected: boolean;
  isCorrect: boolean;
  isSubmit: boolean;
  isPreview?: boolean;
  showCorrectAnswer: boolean;
  showAnswerFeedback?: boolean;
  onDragStart: (choiceId: string) => void;
  onDragEnd: () => void;
  onTouchStart?: (e: React.TouchEvent, choiceId: string) => void;
  isDropped?: boolean;
  token?: string;
}

const OrderChoice = ({
  choice,
  index,
  listStyleType,
  isSelected: _isSelected,
  isCorrect,
  isSubmit,
  isPreview = false,
  showCorrectAnswer,
  showAnswerFeedback: _showAnswerFeedback = false,
  onDragStart,
  onDragEnd,
  onTouchStart,
  isDropped = false,
  token,
}: OrderChoiceProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const isTouchMode = useRef(false);
  const disabled = isSubmit || isPreview;

  // 정답/오답 판단 (제출 후에만)
  const isIncorrect = isSubmit && !isCorrect;

  // 드래그 시작 (마우스)
  const handleDragStart = (e: React.DragEvent) => {
    if (showCorrectAnswer || disabled) return;
    setIsDragging(true);
    onDragStart(choice.identifier);
    e.dataTransfer.setData("text/plain", choice.identifier);
    e.dataTransfer.effectAllowed = "move";

    // 커스텀 드래그 이미지 생성
    const targetElement = e.currentTarget as HTMLElement;
    const dragElement = targetElement.cloneNode(true) as HTMLElement;
    const container = document.createElement("div");
    container.style.position = "rtqi:absolute";
    container.style.top = "-1000px";
    container.style.left = "-1000px";

    // CSS 변수 값을 가져와서 인라인 스타일로 적용 (드래그 이미지는 DOM에서 분리되어 CSS 변수 접근 불가)
    const computedStyle = getComputedStyle(targetElement);
    const selectedBorderColor = computedStyle.getPropertyValue("--qti-option-border-selected");
    const selectedBgColor = computedStyle.getPropertyValue("--qti-option-bg-selected");
    const selectedTextColor =
      computedStyle.getPropertyValue("--qti-option-text-selected") ||
      computedStyle.getPropertyValue("--qti-option-text");
    const borderWidth =
      computedStyle.getPropertyValue("--qti-option-border-width") ||
      computedStyle.getPropertyValue("rtqi:border-width");

    // 드래그 요소에 원본과 동일한 스타일 적용
    const borderRadius = computedStyle.getPropertyValue("rtqi:border-radius");
    const padding = computedStyle.getPropertyValue("padding");
    const display = computedStyle.getPropertyValue("display");
    const alignItems = computedStyle.getPropertyValue("align-items");
    const fontFamily = computedStyle.getPropertyValue("rtqi:font-family");
    const fontSize = computedStyle.getPropertyValue("rtqi:font-size");
    const fontWeight = computedStyle.getPropertyValue("rtqi:font-weight");
    const lineHeight = computedStyle.getPropertyValue("line-height");

    dragElement.style.width = `${targetElement.offsetWidth}px`;
    dragElement.style.height = `${targetElement.offsetHeight}px`;
    dragElement.style.backgroundColor = selectedBgColor;
    dragElement.style.borderColor = selectedBorderColor;
    dragElement.style.borderWidth = borderWidth;
    dragElement.style.borderStyle = "solid";
    dragElement.style.color = selectedTextColor;
    dragElement.style.borderRadius = borderRadius;
    dragElement.style.padding = padding;
    dragElement.style.display = display;
    dragElement.style.alignItems = alignItems;
    dragElement.style.fontFamily = fontFamily;
    dragElement.style.fontSize = fontSize;
    dragElement.style.fontWeight = fontWeight;
    dragElement.style.lineHeight = lineHeight;
    dragElement.style.transform = "rotate(-3deg)";
    dragElement.style.boxSizing = "rtqi:border-box";

    // 순서번호 스타일 적용
    const numberElement = dragElement.querySelector("rtqi:[data-order-number]")
      ?.parentElement as HTMLElement;
    if (numberElement) {
      numberElement.style.backgroundColor = selectedBgColor;
      numberElement.style.borderColor = selectedBorderColor;
      numberElement.style.borderWidth = borderWidth;
    }
    const numberText = dragElement.querySelector("rtqi:[data-order-number]") as HTMLElement;
    if (numberText) {
      numberText.style.color = selectedBorderColor;
    }

    // 이미지가 있으면 동일한 크기 유지
    const images = dragElement.querySelectorAll("img");
    images.forEach((img) => {
      const originalImg = targetElement.querySelector(
        `img[src="${img.getAttribute("src")}"]`
      ) as HTMLImageElement;
      if (originalImg) {
        img.style.width = `${originalImg.offsetWidth}px`;
        img.style.height = `${originalImg.offsetHeight}px`;
        img.style.objectFit = "contain";
      }
    });

    container.appendChild(dragElement);
    document.body.appendChild(container);

    e.dataTransfer.setDragImage(
      container,
      targetElement.offsetWidth / 2,
      targetElement.offsetHeight / 2
    );

    setTimeout(() => {
      if (document.body.contains(container)) {
        document.body.removeChild(container);
      }
    }, 0);
  };

  const handleDragEnd = () => {
    setIsDragging(false);
    onDragEnd();
  };

  // 터치 시작
  const handleTouchStart = (e: React.TouchEvent) => {
    if (showCorrectAnswer || disabled) return;
    isTouchMode.current = true;
    setIsDragging(true);
    onDragStart(choice.identifier);
    onTouchStart?.(e, choice.identifier);
  };

  // 터치 종료 (컨테이너에서 실제 드롭 처리)
  const handleTouchEnd = () => {
    if (showCorrectAnswer || disabled) return;
    // isDropped 상태가 설정될 때까지 rotate 유지
    setTimeout(() => {
      setIsDragging(false);
      isTouchMode.current = false;
    }, 0);
    onDragEnd();
  };

  const choiceClassName = cn(
    "qti-ext-option-base",
    "qti-ext-order-choice",
    isDragging && "qti-ext-order-choice-dragging",
    isDropped && !disabled && "qti-ext-order-choice-dropped",
    isSubmit && isCorrect && "qti-ext-order-choice-correct",
    isSubmit && isIncorrect && "qti-ext-order-choice-incorrect",
    isSubmit && "qti-ext-option-disabled"
  );

  const numberClassName = cn(
    "qti-ext-order-number",
    isDropped && !disabled && "qti-ext-order-number-dropped",
    isSubmit && isCorrect && "qti-ext-order-number-correct",
    isSubmit && isIncorrect && "qti-ext-order-number-incorrect"
  );

  return (
    <div
      className={choiceClassName}
      draggable={!showCorrectAnswer && !disabled}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      role="listitem"
      aria-label={`${choice.text || ""}`}
    >
      <div className="qti-ext-order-choice-content">
        {/* 순서 번호 */}
        <div className={numberClassName}>
          <span className="qti-ext-order-number-text" data-order-number="true">
            {getListStyleLabel(listStyleType, index + 1)}
          </span>
        </div>
        {/* 선택지 콘텐츠 */}
        <div className="qti-ext-order-choice-text">
          {choice.text && <span>{choice.text}</span>}
          {choice.media && <MediaContent media={choice.media} token={token} />}
        </div>
      </div>
      {/* {isSubmit && <FeedbackIcon isCorrect={isCorrect} isIncorrect={isIncorrect} />} */}
    </div>
  );
};

export default OrderChoice;
