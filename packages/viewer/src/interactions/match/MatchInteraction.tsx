import React, { useCallback, useMemo, useRef, useState } from "react";
import type {
  FeedbackSubmitResponse,
  MatchingOptionType,
  MatchingPairType,
  QTIParserOptions,
  ResponseValue,
} from "../../types";
import { ConnectionLine, MatchInteractionColumns, MultiConnectionLine } from "./components";
import { useMatchHeightSync } from "./hooks";
import { parsePairs } from "./utils";

// 인접 컬럼 간의 매칭 (예: 0-1번 컬럼, 1-2번 컬럼)
interface AdjacentPair {
  leftId: string;
  rightId: string;
  pairIndex: number;
}

function pairsEqual(a: MatchingPairType[], b: MatchingPairType[]): boolean {
  return (
    a.length === b.length &&
    a.every(
      (pair, index) => pair.leftId === b[index]?.leftId && pair.rightId === b[index]?.rightId
    )
  );
}

function adjacentPairsEqual(a: AdjacentPair[], b: AdjacentPair[]): boolean {
  return (
    a.length === b.length &&
    a.every(
      (pair, index) =>
        pair.leftId === b[index]?.leftId &&
        pair.rightId === b[index]?.rightId &&
        pair.pairIndex === b[index]?.pairIndex
    )
  );
}

interface MatchInteractionProps {
  element: Element;
  options: Omit<
    QTIParserOptions,
    "onMatchSelect" | "matchedPairs" | "selectedLeft" | "selectedRight"
  >;
  index: number;
}

export const MatchInteraction: React.FC<MatchInteractionProps> = ({ element, options }) => {
  const responseIdentifier = element.getAttribute("response-identifier") || "";

  // 응답이 바뀌면 로컬 쌍만 맞춘다. 이 문자열을 그리드 key에 넣으면
  // 쌍을 연결·해제할 때마다 선택지가 언마운트된다.
  const responsesResetKey = useMemo(
    () => `${responseIdentifier}-${JSON.stringify(options.responses?.[responseIdentifier] ?? [])}`,
    [responseIdentifier, options.responses]
  );

  const itemKey = options.itemKey?.trim() ?? "";
  /** 문항·본문이 바뀔 때만 그리드를 다시 마운트하고 높이를 다시 잰다. */
  const contentKey = `${itemKey}\0${element.outerHTML}`;
  const heightSyncKey = contentKey;

  const matchSets = element.querySelectorAll("qti-simple-match-set");
  const matchSetCount = matchSets.length;
  const isMultiWay = matchSetCount > 2;

  // 매 렌더마다 현재 `element`에서 파생. `useMemo(..., [element])`는 리렌더마다 새 DOM 참조로 매번 무효화되고,
  // `itemKey`만 두면 XML 갱신과 어긋날 수 있어, 캐시 없이 항상 최신 choice Element를 쓴다.
  const allChoices: Array<Array<MatchingOptionType & { matchMax: number; element: Element }>> =
    Array.from(matchSets).map((matchSet) =>
      Array.from(matchSet.querySelectorAll("qti-simple-associable-choice")).map((choiceEl) => {
        const identifier = choiceEl.getAttribute("identifier") || "";
        const matchMaxAttr = choiceEl.getAttribute("match-max");
        const parsed = matchMaxAttr ? parseInt(matchMaxAttr, 10) : 1;
        const matchMax =
          matchMaxAttr !== null && matchMaxAttr !== "" && !Number.isNaN(parsed) ? parsed : 1;
        return {
          identifier,
          matchMax,
          text: undefined,
          media: undefined,
          element: choiceEl,
        };
      })
    );

  const matchMaxMap: Record<string, number> = {};
  allChoices.forEach((choices) => {
    choices.forEach((choice) => {
      matchMaxMap[choice.identifier] = choice.matchMax;
    });
  });

  const optionIdSets = allChoices.map((choices) => new Set(choices.map((c) => c.identifier)));

  // 선택 상태 초기화 헬퍼
  const createEmptySelections = () =>
    Array.from({ length: matchSetCount - 1 }, () => ({ left: null, right: null }));

  // === 2-way 매칭 초기값 ===
  const initialPairs = useMemo((): MatchingPairType[] => {
    if (isMultiWay) return [];
    return parsePairs(options.responses?.[responseIdentifier]);
  }, [options.responses, responseIdentifier, isMultiWay]);

  // === N-way 매칭 초기값 ===
  const initialAdjacentPairs = useMemo((): AdjacentPair[] => {
    if (!isMultiWay) return [];
    return parsePairs(options.responses?.[responseIdentifier]).map((p, i) => ({
      ...p,
      pairIndex: i,
    }));
  }, [options.responses, responseIdentifier, isMultiWay]);

  // 상태 관리
  const [matchedPairs, setMatchedPairs] = useState<MatchingPairType[]>(initialPairs);
  const [adjacentPairs, setAdjacentPairs] = useState<AdjacentPair[]>(initialAdjacentPairs);
  const [selectedByPairIndex, setSelectedByPairIndex] =
    useState<Array<{ left: string | null; right: string | null }>>(createEmptySelections());
  const isPreview = options.mode === "preview";
  const isReadOnly = options.mode !== "practice";
  const [isSubmit, setIsSubmit] = useState(!!options.isSubmit);
  const [submitMatchedPairs, setSubmitMatchedPairs] = useState<MatchingPairType[]>([]);

  // 제출 응답이 있으면 채점 스냅샷을 유지한다. 그 외에는 외부 responses와 로컬 쌍을 맞춘다.
  const shouldSyncPairsFromResponses = !options.submitResponse;

  // SIMULTANEOUS: 답안은 복원하되 정오답/피드백 미표시 (ChoiceInteraction과 동일)
  const showFeedback = isPreview || options.submissionMode !== "SIMULTANEOUS";
  const effectiveSubmitResponse: FeedbackSubmitResponse | undefined = showFeedback
    ? isPreview
      ? ({
          correct: options.correct ?? false,
          response: options.responses,
          correctAnswer: options.correctAnswers as FeedbackSubmitResponse["correctAnswer"],
        } as FeedbackSubmitResponse)
      : options.submitResponse
    : undefined;

  // 2-way용
  const leftChoices = allChoices[0] || [];
  const rightChoices = allChoices[1] || [];
  const hasSameOptionCount =
    !isMultiWay && leftChoices.length > 0 && leftChoices.length === rightChoices.length;

  // Refs for height measurement
  const srcCardRefs = useRef<Array<HTMLDivElement | null>>([]);
  const tgtCardRefs = useRef<Array<HTMLDivElement | null>>([]);
  const srcColRef = useRef<HTMLDivElement>(null);
  const tgtColRef = useRef<HTMLDivElement>(null);
  const srcOptionRefs = useRef<Array<HTMLDivElement | null>>([]);
  const tgtOptionRefs = useRef<Array<HTMLDivElement | null>>([]);
  const gridContainerRef = useRef<HTMLDivElement>(null);

  // Height synchronization hook
  const { rowHeights, shortColumn, shortColumnMinHeights } = useMatchHeightSync({
    isMultiWay,
    hasSameOptionCount,
    leftChoicesLength: leftChoices.length,
    rightChoicesLength: rightChoices.length,
    heightSyncKey,
    srcCardRefs,
    tgtCardRefs,
    srcOptionRefs,
    tgtOptionRefs,
    gridContainerRef,
  });

  const setOptionRefByIndex = useCallback(
    (optionIndex: number, setIndex: number) => (el: HTMLDivElement | null) => {
      (setIndex === 0 ? srcOptionRefs : tgtOptionRefs).current[optionIndex] = el;
    },
    []
  );
  const setCardRefByIndex = useCallback(
    (optionIndex: number, setIndex: number) => (el: HTMLDivElement | null) => {
      (setIndex === 0 ? srcCardRefs : tgtCardRefs).current[optionIndex] = el;
    },
    []
  );
  const setColRefBySetIndex = useCallback(
    (setIndex: number) => (el: HTMLDivElement | null) => {
      const ref = setIndex === 0 ? srcColRef : tgtColRef;
      (ref as React.MutableRefObject<HTMLDivElement | null>).current = el;
    },
    []
  );

  const correctPairs = useMemo(
    () => parsePairs(effectiveSubmitResponse?.correctAnswer?.[responseIdentifier]),
    [effectiveSubmitResponse, responseIdentifier]
  );

  // preview: 정적 미리보기, 인터랙션 비활성. 채점 테마는 options.isSubmit일 때만
  const effectiveIsSubmit = showFeedback ? !!options.isSubmit : false;

  // 응답 키가 바뀔 때만 외부 쌍을 맞춘다. matchedPairs 변경을 조건으로 쓰면
  // 부모 응답이 오기 전에 방금 연결한 쌍을 되돌린다.
  const responseSyncToken = shouldSyncPairsFromResponses ? responsesResetKey : null;
  const [syncedResponseToken, setSyncedResponseToken] = useState<string | null>(responseSyncToken);
  let pairsForSubmit = matchedPairs;
  if (syncedResponseToken !== responseSyncToken) {
    setSyncedResponseToken(responseSyncToken);
    if (responseSyncToken !== null) {
      const raw = options.responses?.[responseIdentifier];
      const nextPairs = isMultiWay ? [] : parsePairs(raw);
      const nextAdjacent = isMultiWay
        ? parsePairs(raw).map((p, i) => ({ ...p, pairIndex: i }))
        : [];
      const unchanged = isMultiWay
        ? adjacentPairsEqual(adjacentPairs, nextAdjacent)
        : pairsEqual(matchedPairs, nextPairs);
      if (!unchanged) {
        pairsForSubmit = nextPairs;
        setMatchedPairs(nextPairs);
        setAdjacentPairs(nextAdjacent);
        setSelectedByPairIndex(
          Array.from({ length: matchSetCount - 1 }, () => ({ left: null, right: null }))
        );
      }
    }
  }

  // 제출 여부가 바뀌거나, 제출 중 쌍이 바뀌면 채점 스냅샷을 맞춘다.
  if (effectiveIsSubmit && !isSubmit) {
    setSubmitMatchedPairs(pairsForSubmit);
    setIsSubmit(true);
  } else if (!effectiveIsSubmit && isSubmit) {
    setIsSubmit(false);
  } else if (
    effectiveIsSubmit &&
    isSubmit &&
    !isMultiWay &&
    !pairsEqual(submitMatchedPairs, pairsForSubmit)
  ) {
    setSubmitMatchedPairs(pairsForSubmit);
  }

  // 옵션이 어느 match-set에 속하는지 확인
  const getOptionSetIndex = (optionId: string): number =>
    optionIdSets.findIndex((set) => set.has(optionId));

  // 선택 상태 초기화
  const resetSelection = (pairIndex = 0) =>
    setSelectedByPairIndex((prev) => {
      const next = [...prev];
      next[pairIndex] = { left: null, right: null };
      return next;
    });

  // 응답 변경 알림
  const notify2Way = (pairs: MatchingPairType[]) =>
    options.onResponseChange?.(
      responseIdentifier,
      pairs.map((p) => `${p.leftId} ${p.rightId}`) as unknown as ResponseValue
    );

  const notifyNWay = (pairs: AdjacentPair[]) =>
    options.onResponseChange?.(
      responseIdentifier,
      pairs.map((p) => `${p.leftId} ${p.rightId}`) as unknown as ResponseValue
    );

  // === 2-way 로직 ===
  const handleMismatch2Way = (optionId: string) => {
    const pairToRemove = matchedPairs.find(
      (pair) => pair.leftId === optionId || pair.rightId === optionId
    );
    if (!pairToRemove) {
      resetSelection();
      return;
    }

    const newPairs = matchedPairs.filter(
      (pair) => !(pair.leftId === pairToRemove.leftId && pair.rightId === pairToRemove.rightId)
    );
    setMatchedPairs(newPairs);
    setIsSubmit(false);
    notify2Way(newPairs);
    resetSelection();
  };

  // 옵션이 현재 몇 개와 매칭되어 있는지 계산
  const getMatchCount = (optionId: string): number =>
    matchedPairs.filter((p) => p.leftId === optionId || p.rightId === optionId).length;

  // 해당 옵션이 추가 매칭 가능한지 확인 (matchMax 0 = 제한 없음, 중복 연결 허용)
  const canMatchMore = (optionId: string): boolean => {
    const matchMax = matchMaxMap[optionId] ?? 1;
    if (matchMax === 0) return true;
    const currentCount = getMatchCount(optionId);
    return currentCount < matchMax;
  };

  const handleMatch2Way = (leftId: string, rightId: string) => {
    // 이미 동일한 페어가 존재하는지 확인
    const isDuplicatePair = matchedPairs.some((p) => p.leftId === leftId && p.rightId === rightId);
    if (isDuplicatePair) {
      resetSelection();
      return;
    }

    // 각 옵션이 추가 매칭 가능한지 확인
    if (!canMatchMore(leftId) || !canMatchMore(rightId)) {
      resetSelection();
      return;
    }

    const newPairs = [...matchedPairs, { leftId, rightId }];
    setMatchedPairs(newPairs);
    setIsSubmit(false);
    notify2Way(newPairs);
    resetSelection();
  };

  // === N-way 로직 ===
  const findPairContainingOption = (
    optionId: string,
    pairIndex: number
  ): AdjacentPair | undefined =>
    adjacentPairs.find(
      (pair) =>
        pair.pairIndex === pairIndex && (pair.leftId === optionId || pair.rightId === optionId)
    );

  const handleMismatchMultiWay = (optionId: string, pairIndex: number) => {
    const pairToRemove = findPairContainingOption(optionId, pairIndex);
    if (!pairToRemove) {
      resetSelection(pairIndex);
      return;
    }

    const newPairs = adjacentPairs.filter(
      (p) =>
        !(
          p.pairIndex === pairToRemove.pairIndex &&
          p.leftId === pairToRemove.leftId &&
          p.rightId === pairToRemove.rightId
        )
    );
    setAdjacentPairs(newPairs);
    setIsSubmit(false);
    notifyNWay(newPairs);
    resetSelection(pairIndex);
  };

  const handleMatchMultiWay = (leftId: string, rightId: string, pairIndex: number) => {
    const isDuplicatePair = adjacentPairs.some(
      (p) => p.pairIndex === pairIndex && p.leftId === leftId && p.rightId === rightId
    );
    if (isDuplicatePair) {
      resetSelection(pairIndex);
      return;
    }

    // matchMax 0 = 해당 옵션은 중복 연결 허용. 0이 아닌 옵션만 같은 pairIndex에서 재사용 시 차단
    const matchMaxLeft = matchMaxMap[leftId] ?? 1;
    const matchMaxRight = matchMaxMap[rightId] ?? 1;
    const leftAlreadyUsed = adjacentPairs.some(
      (p) => p.pairIndex === pairIndex && p.leftId === leftId
    );
    const rightAlreadyUsed = adjacentPairs.some(
      (p) => p.pairIndex === pairIndex && p.rightId === rightId
    );
    if ((leftAlreadyUsed && matchMaxLeft !== 0) || (rightAlreadyUsed && matchMaxRight !== 0)) {
      resetSelection(pairIndex);
      return;
    }

    const newPairs = [...adjacentPairs, { leftId, rightId, pairIndex }];
    setAdjacentPairs(newPairs);
    setIsSubmit(false);
    notifyNWay(newPairs);
    resetSelection(pairIndex);
  };

  // 이미 매칭된 상대 컬럼의 옵션 찾기 (예: A-B 연결 후 C 클릭 시 B를 상대방으로 사용)
  const findMatchedPartnerInColumn = (
    pairIndex: number,
    partnerSetIndex: number
  ): string | null => {
    const columnChoices = allChoices[partnerSetIndex] || [];
    for (const choice of columnChoices) {
      const isMatchedInAnyPair = adjacentPairs.some(
        (p) => p.leftId === choice.identifier || p.rightId === choice.identifier
      );
      if (!isMatchedInAnyPair) continue;

      const isAlreadyMatchedInThisPair = adjacentPairs.some(
        (p) =>
          p.pairIndex === pairIndex &&
          (p.leftId === choice.identifier || p.rightId === choice.identifier)
      );
      if (!isAlreadyMatchedInThisPair) {
        return choice.identifier;
      }
    }
    return null;
  };

  // 통합 선택 핸들러
  const handleMatchSelect = (optionId: string) => {
    if (effectiveIsSubmit) return; // 제출 후 또는 preview 시 비활성
    const setIndex = getOptionSetIndex(optionId);
    if (setIndex === -1) return;

    // 2-way 로직
    if (!isMultiWay) {
      const isMatched = matchedPairs.some(
        (pair) => pair.leftId === optionId || pair.rightId === optionId
      );

      // 이미 매칭된 옵션이고, 추가 매칭이 불가능하면 매칭 해제
      if (isMatched && !canMatchMore(optionId)) {
        handleMismatch2Way(optionId);
        return;
      }

      const newSelections = [...selectedByPairIndex];
      const isLeft = setIndex === 0;
      const side = isLeft ? "left" : "right";
      const partnerSide = isLeft ? "right" : "left";

      const isTogglingOff = newSelections[0][side] === optionId;
      newSelections[0] = { ...newSelections[0], [side]: isTogglingOff ? null : optionId };
      setSelectedByPairIndex(newSelections);

      if (isTogglingOff) return;

      const partnerValue = newSelections[0][partnerSide];
      if (!partnerValue) return;

      if (isLeft) {
        handleMatch2Way(optionId, partnerValue);
      } else {
        handleMatch2Way(partnerValue, optionId);
      }
      return;
    }

    // N-way 로직
    const participatingPairs: Array<{ pairIndex: number; side: "left" | "right" }> = [];
    if (setIndex > 0) {
      participatingPairs.push({ pairIndex: setIndex - 1, side: "right" });
    }
    if (setIndex < matchSetCount - 1) {
      participatingPairs.push({ pairIndex: setIndex, side: "left" });
    }

    // 이미 매칭된 상태인지 확인 - 클릭하면 해당 매치 해제
    for (const { pairIndex } of participatingPairs) {
      const existingPair = findPairContainingOption(optionId, pairIndex);
      if (existingPair) {
        handleMismatchMultiWay(optionId, pairIndex);
        return;
      }
    }

    const newSelections = [...selectedByPairIndex];

    // 상대방 찾기: 선택 상태이거나 이미 매칭된 상대방
    let targetPair: { pairIndex: number; side: "left" | "right"; partnerId?: string } | null = null;

    for (const { pairIndex, side } of participatingPairs) {
      const partnerSide = side === "left" ? "right" : "left";
      const partnerSetIndex = side === "left" ? pairIndex + 1 : pairIndex;

      if (newSelections[pairIndex]?.[partnerSide]) {
        targetPair = { pairIndex, side };
        break;
      }

      const matchedPartner = findMatchedPartnerInColumn(pairIndex, partnerSetIndex);
      if (matchedPartner) {
        targetPair = { pairIndex, side, partnerId: matchedPartner };
        break;
      }
    }

    if (!targetPair) {
      targetPair = participatingPairs[0] || null;
    }
    if (!targetPair) return;

    const { pairIndex, side, partnerId } = targetPair;
    const currentSelection = newSelections[pairIndex];

    // 같은 옵션 재클릭 → 선택 해제
    if (currentSelection[side] === optionId) {
      newSelections[pairIndex] = { ...currentSelection, [side]: null };
      setSelectedByPairIndex(newSelections);
      return;
    }

    // 이미 매칭된 상대방이 있으면 바로 매치 생성
    if (partnerId) {
      if (side === "left") {
        handleMatchMultiWay(optionId, partnerId, pairIndex);
      } else {
        handleMatchMultiWay(partnerId, optionId, pairIndex);
      }
      return;
    }

    // 선택
    newSelections[pairIndex] = { ...currentSelection, [side]: optionId };

    const { left: leftSel, right: rightSel } = newSelections[pairIndex];
    if (leftSel && rightSel) {
      handleMatchMultiWay(leftSel, rightSel, pairIndex);
      return;
    }

    setSelectedByPairIndex(newSelections);
  };

  // 옵션 상태 확인 함수들
  const isOptionMatched = (optionId: string) => {
    if (isMultiWay) {
      return adjacentPairs.some((p) => p.leftId === optionId || p.rightId === optionId);
    }
    return matchedPairs.some((pair) => pair.leftId === optionId || pair.rightId === optionId);
  };

  const isOptionMatchedLeft = (optionId: string, setIndex: number) => {
    if (!isMultiWay || setIndex === 0) return false;
    return adjacentPairs.some((p) => p.pairIndex === setIndex - 1 && p.rightId === optionId);
  };

  const isOptionMatchedRight = (optionId: string, setIndex: number) => {
    if (!isMultiWay || setIndex === matchSetCount - 1) return false;
    return adjacentPairs.some((p) => p.pairIndex === setIndex && p.leftId === optionId);
  };

  const isOptionSelected = (optionId: string, setIndex: number) => {
    if (!isMultiWay)
      return (
        selectedByPairIndex[0]?.left === optionId || selectedByPairIndex[0]?.right === optionId
      );
    if (setIndex > 0 && selectedByPairIndex[setIndex - 1]?.right === optionId) return true;
    if (setIndex < matchSetCount - 1 && selectedByPairIndex[setIndex]?.left === optionId)
      return true;
    return false;
  };

  const isOptionCorrect = (optionId: string) => {
    if (!options.isSubmit || !isSubmit || isMultiWay) return false;
    return submitMatchedPairs.some(
      (mp) =>
        (mp.leftId === optionId || mp.rightId === optionId) &&
        correctPairs.some((cp) => cp.leftId === mp.leftId && cp.rightId === mp.rightId)
    );
  };

  const isOptionWrong = (optionId: string) => {
    if (!options.isSubmit || !isSubmit || isMultiWay) return false;
    if (isOptionCorrect(optionId)) return false;
    return submitMatchedPairs.some(
      (mp) =>
        (mp.leftId === optionId || mp.rightId === optionId) &&
        !correctPairs.some((cp) => cp.leftId === mp.leftId && cp.rightId === mp.rightId)
    );
  };

  // 그리드 클래스 (2 or 3)
  const gridColsClass = matchSetCount === 3 ? "rqti:grid-cols-3" : "rqti:grid-cols-2";
  const colSpanClass = matchSetCount === 3 ? "rqti:col-span-3" : "rqti:col-span-2";

  // side 결정 함수
  const getSide = (setIndex: number): "left" | "center" | "right" => {
    if (matchSetCount === 2) return setIndex === 0 ? "left" : "right";
    if (setIndex === 0) return "left";
    if (setIndex === matchSetCount - 1) return "right";
    return "center";
  };

  const getSetKey = (setIndex: number) => {
    const firstChoice = allChoices[setIndex]?.[0];
    return firstChoice ? `set-${firstChoice.identifier}` : `set-idx-${setIndex}`;
  };

  const gridMountKey = contentKey;

  return (
    <div
      ref={gridContainerRef}
      key={gridMountKey}
      className={`rqti:relative rqti:my-4 rqti:grid ${gridColsClass} rqti:gap-6`}
    >
      <div className={colSpanClass}>
        {isMultiWay ? (
          <MultiConnectionLine pairs={adjacentPairs} allChoices={allChoices} isSubmit={isSubmit} />
        ) : (
          <ConnectionLine
            pairs={matchedPairs}
            leftOptions={leftChoices}
            rightOptions={rightChoices}
            correctPairs={correctPairs}
            submitMatchedPairs={submitMatchedPairs}
            isSubmit={isSubmit}
          />
        )}
      </div>

      <MatchInteractionColumns
        allChoices={allChoices}
        isMultiWay={isMultiWay}
        hasSameOptionCount={hasSameOptionCount}
        shortColumn={shortColumn}
        shortColumnMinHeights={shortColumnMinHeights}
        rowHeights={rowHeights}
        setColRefBySetIndex={setColRefBySetIndex}
        setOptionRefByIndex={setOptionRefByIndex}
        setCardRefByIndex={setCardRefByIndex}
        getSetKey={getSetKey}
        isOptionSelected={isOptionSelected}
        isOptionMatched={isOptionMatched}
        isOptionMatchedLeft={isOptionMatchedLeft}
        isOptionMatchedRight={isOptionMatchedRight}
        canMatchMore={canMatchMore}
        isOptionCorrect={isOptionCorrect}
        isOptionWrong={isOptionWrong}
        getSide={getSide}
        handleMatchSelect={handleMatchSelect}
        options={options}
        isSubmit={isSubmit}
        isPreview={isReadOnly}
      />
    </div>
  );
};
