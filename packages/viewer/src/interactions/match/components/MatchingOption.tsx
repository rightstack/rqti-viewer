import { forwardRef, useCallback } from "react";
import { cn } from "../../../lib/utils";
import type { MatchingOptionType } from "../../../types";

interface MatchingOptionProps {
  option: MatchingOptionType;
  isSelected: boolean;
  isMatched: boolean;
  isMatchedLeft?: boolean; // center용: 왼쪽과 매칭되었는지
  isMatchedRight?: boolean; // center용: 오른쪽과 매칭되었는지
  canMatchMore?: boolean; // 추가 매칭 가능 여부 (1:N 매칭용)
  isCorrect: boolean;
  isWrong: boolean;
  isSubmit?: boolean;
  isPreview?: boolean;
  onSelect: (optionId: string) => void;
  side: "left" | "center" | "right";
  /** 같은 행 소스/타겟 높이 통일용 (CSS px) */
  minHeight?: number;
  children?: React.ReactNode;
}

const MatchingOption = forwardRef<HTMLDivElement, MatchingOptionProps>(function MatchingOption(
  {
    option,
    isSelected,
    isMatched,
    isMatchedLeft = false,
    isMatchedRight = false,
    canMatchMore = false,
    isCorrect,
    isWrong: isIncorrect,
    isSubmit = false,
    isPreview = false,
    onSelect,
    side,
    minHeight,
    children,
  },
  ref
) {
  const disabled = isSubmit || isPreview;
  /** 제출 후에만 비활성 스타일 적용, preview는 동작만 막음 */
  const showDisabledStyle = isSubmit;
  const handleClick = useCallback(() => {
    if (disabled) return;
    onSelect(option.identifier);
  }, [onSelect, option.identifier, disabled]);

  const optionClassName = cn(
    "qti-ext-option-base",
    "qti-ext-match-option",
    "focus-visible:ring-ring cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
    isSelected && "qti-ext-match-option-selected",
    isMatched && !canMatchMore && "qti-ext-match-option-matched",
    isMatched && canMatchMore && "qti-ext-match-option-partial", // 부분 매칭 (추가 가능)
    isCorrect && "qti-ext-match-option-correct",
    isIncorrect && "qti-ext-match-option-incorrect",
    showDisabledStyle && "qti-ext-option-disabled",
    isPreview && "pointer-events-none",
    (showDisabledStyle || disabled) && "pointer-events-none"
  );

  const getPointClassName = (position: "left" | "right") => {
    const isPointMatched =
      side === "center" ? (position === "left" ? isMatchedLeft : isMatchedRight) : isMatched;

    return cn(
      "qti-ext-match-point",
      position === "left" ? "qti-ext-match-point-left" : "qti-ext-match-point-right",
      isSelected && "qti-ext-match-point-selected",
      isPointMatched && "qti-ext-match-point-matched",
      isCorrect && "qti-ext-match-point-correct",
      isIncorrect && "qti-ext-match-point-incorrect"
    );
  };

  const getSideLabel = () => {
    switch (side) {
      case "left":
        return "왼쪽";
      case "center":
        return "중앙";
      case "right":
        return "오른쪽";
    }
  };

  return (
    <div
      ref={ref}
      role="button"
      tabIndex={0}
      className={optionClassName}
      data-option-id={option.identifier}
      aria-label={`${getSideLabel()} 옵션 ${option.identifier}`}
      style={minHeight !== undefined ? { minHeight: `${minHeight}px` } : undefined}
      onClick={handleClick}
      onKeyDown={(e) => {
        if (disabled) return;
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect(option.identifier);
        }
      }}
    >
      {/* 왼쪽 연결점 (center, right) */}
      {(side === "center" || side === "right") && (
        <div className={getPointClassName("left")} data-point-id={`${option.identifier}-left`} />
      )}

      {/* 옵션 콘텐츠 (element를 renderQtiNode로 렌더한 결과) */}
      <div className="qti-ext-match-option-content">{children}</div>

      {/* 오른쪽 연결점 (left, center) */}
      {(side === "left" || side === "center") && (
        <div className={getPointClassName("right")} data-point-id={`${option.identifier}-right`} />
      )}
    </div>
  );
});

export default MatchingOption;
