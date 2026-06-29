import React from "react";
import type { MatchingOptionType, QTIParserOptions } from "../../../types";
import MatchingOption from "./MatchingOption";
import { MemoizedMatchOptionContent } from "./MemoizedMatchOptionContent";

export type MatchInteractionColumnsProps = {
  allChoices: Array<Array<MatchingOptionType & { matchMax: number; element: Element }>>;
  isMultiWay: boolean;
  hasSameOptionCount: boolean;
  shortColumn: "left" | "right" | null;
  shortColumnMinHeights: number[];
  rowHeights: number[];
  setColRefBySetIndex: (setIndex: number) => (el: HTMLDivElement | null) => void;
  setOptionRefByIndex: (
    optionIndex: number,
    setIndex: number
  ) => (el: HTMLDivElement | null) => void;
  setCardRefByIndex: (optionIndex: number, setIndex: number) => (el: HTMLDivElement | null) => void;
  getSetKey: (setIndex: number) => string;
  isOptionSelected: (optionId: string, setIndex: number) => boolean;
  isOptionMatched: (optionId: string) => boolean;
  isOptionMatchedLeft: (optionId: string, setIndex: number) => boolean;
  isOptionMatchedRight: (optionId: string, setIndex: number) => boolean;
  canMatchMore: (optionId: string) => boolean;
  isOptionCorrect: (optionId: string) => boolean;
  isOptionWrong: (optionId: string) => boolean;
  getSide: (setIndex: number) => "left" | "center" | "right";
  handleMatchSelect: (optionId: string) => void;
  options: Omit<
    QTIParserOptions,
    "onMatchSelect" | "matchedPairs" | "selectedLeft" | "selectedRight"
  >;
  isSubmit: boolean;
  isPreview: boolean;
};

/**
 * Ref를 소유하지 않는 자식에서만 ref 콜백 사용 → "refs during render" 규칙 회피
 */
export const MatchInteractionColumns: React.FC<MatchInteractionColumnsProps> = (props) => {
  const {
    allChoices,
    isMultiWay,
    hasSameOptionCount,
    shortColumn,
    shortColumnMinHeights,
    rowHeights,
    setColRefBySetIndex,
    setOptionRefByIndex,
    setCardRefByIndex,
    getSetKey,
    isOptionSelected,
    isOptionMatched,
    isOptionMatchedLeft,
    isOptionMatchedRight,
    canMatchMore,
    isOptionCorrect,
    isOptionWrong,
    getSide,
    handleMatchSelect,
    options,
    isSubmit,
    isPreview,
  } = props;

  return (
    <>
      {allChoices.map((choices, setIndex) => {
        const isMeasuredCol = !isMultiWay && (setIndex === 0 || setIndex === 1);
        const isShortCol =
          isMeasuredCol &&
          !hasSameOptionCount &&
          ((setIndex === 0 && shortColumn === "left") ||
            (setIndex === 1 && shortColumn === "right"));

        return (
          <div
            key={getSetKey(setIndex)}
            ref={isMeasuredCol && !hasSameOptionCount ? setColRefBySetIndex(setIndex) : undefined}
            className="flex flex-col gap-3"
          >
            {choices.map((option, optionIndex) => {
              const optionRef =
                isMeasuredCol && !hasSameOptionCount
                  ? setOptionRefByIndex(optionIndex, setIndex)
                  : undefined;
              const cardRef =
                isMeasuredCol && hasSameOptionCount
                  ? setCardRefByIndex(optionIndex, setIndex)
                  : undefined;
              const minHeight =
                isMeasuredCol && hasSameOptionCount
                  ? rowHeights[optionIndex]
                  : isShortCol && shortColumnMinHeights[optionIndex] !== undefined
                    ? shortColumnMinHeights[optionIndex]
                    : undefined;

              return (
                <div key={option.identifier}>
                  <MatchingOption
                    ref={optionRef ?? cardRef}
                    option={option}
                    isSelected={isOptionSelected(option.identifier, setIndex)}
                    isMatched={isOptionMatched(option.identifier)}
                    isMatchedLeft={isOptionMatchedLeft(option.identifier, setIndex)}
                    isMatchedRight={isOptionMatchedRight(option.identifier, setIndex)}
                    canMatchMore={canMatchMore(option.identifier)}
                    isCorrect={isOptionCorrect(option.identifier)}
                    isWrong={isOptionWrong(option.identifier)}
                    isSubmit={isSubmit}
                    isPreview={isPreview}
                    onSelect={handleMatchSelect}
                    side={getSide(setIndex)}
                    minHeight={minHeight}
                  >
                    <MemoizedMatchOptionContent element={option.element} options={options} />
                  </MatchingOption>
                </div>
              );
            })}
          </div>
        );
      })}
    </>
  );
};
