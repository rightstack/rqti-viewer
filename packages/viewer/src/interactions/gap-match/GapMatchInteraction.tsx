import React, { useCallback, useEffect, useMemo, useState } from "react";
import { extractListStyleType } from "../../parser/listGrouping";
import { isFormattingWhitespace, parseHTMLElement } from "../../parser/parseHtmlElement";
import { parseTextWithLaTeX } from "../../parser/parseLatexToReact";
import type {
  GapChoiceType,
  GapType,
  QTIParserOptions,
  ResponseValue,
  ResponseValueMap,
} from "../../types";
import { extractMediaFromElement, extractTextFromElement } from "../../utils";
import { getListStyleLabel } from "../../utils/listStyleLabel";
import { Gap } from "./components/Gap";
import { GapChoice } from "./components/GapChoice";

interface GapMatchInteractionProps {
  element: Element;
  options: Omit<QTIParserOptions, "onResponseChange" | "responses"> & {
    onResponseChange?: (identifier: string, value: ResponseValue) => void;
    responses?: ResponseValueMap;
  };
  index: number;
}

/** 선택 방식: class로 결정 (기본 drag) */
type GapMatchMode = "click" | "drag";

const resolveGapMatchMode = (className: string): GapMatchMode => {
  if (className.includes("qti-ext-gap-match-click")) return "click";
  // qti-ext-gap-match-drag 또는 미지정 시 drag(기본)
  return "drag";
};

/** 선택지(gap-text) 패널 자리표시 요소 여부: <div class="qti-ext-gap-text-panel"/> */
const isGapTextPanel = (el: Element): boolean =>
  el.tagName.toLowerCase() === "div" &&
  (el.getAttribute("class") || "").includes("qti-ext-gap-text-panel");

export const GapMatchInteraction: React.FC<GapMatchInteractionProps> = ({
  element,
  options,
  index,
}) => {
  const responseIdentifier = element.getAttribute("response-identifier") || "";
  const className = element.getAttribute("class") || "";
  const choicesPosition = className.includes("qti-choices-top") ? "top" : "bottom";
  // 선택 방식 (click | drag)
  const mode = useMemo(() => resolveGapMatchMode(className), [className]);
  // gap 라벨 스타일 (qti-list-style-type-*), 미지정 시 decimal
  const listStyleType = useMemo(() => extractListStyleType(className), [className]);
  // 선택지 패널 자리표시(qti-ext-gap-text-panel) 존재 여부 → 있으면 그 위치에 렌더
  const hasGapTextPanel = useMemo(
    () => !!element.querySelector(".qti-ext-gap-text-panel"),
    [element]
  );

  const gapTextElements = element.querySelectorAll("qti-gap-text");
  const gapTexts: GapChoiceType[] = useMemo(() => {
    const result: GapChoiceType[] = [];
    gapTextElements.forEach((choice) => {
      const identifier = choice.getAttribute("identifier") || "";
      const text = extractTextFromElement(choice);
      const media = extractMediaFromElement(choice);

      result.push({
        identifier,
        text: text || undefined,
        media: media.length > 0 ? media : undefined,
      });
    });
    return result;
  }, [gapTextElements]);

  // choiceId → match-max (0 = 무제한/다중, 미지정 = 1(단일 사용))
  const matchMaxMap = useMemo(() => {
    const map: Record<string, number> = {};
    gapTextElements.forEach((choice) => {
      const id = choice.getAttribute("identifier") || "";
      const raw = choice.getAttribute("match-max");
      map[id] = raw != null ? Number.parseInt(raw, 10) || 0 : 1;
    });
    return map;
  }, [gapTextElements]);

  // gap 목록 추출 (순서 유지, width 포함)
  const gaps = useMemo(() => {
    const gapList: Array<GapType & { inputWidth?: string }> = [];
    const gapElements = element.querySelectorAll("qti-gap");
    gapElements.forEach((gap) => {
      const identifier = gap.getAttribute("identifier") || "";
      const gapClassName = gap.getAttribute("class") || "";
      const widthMatch = gapClassName.match(/qti-input-width-(\d+)/);
      const inputWidth = widthMatch ? widthMatch[0] : undefined;
      gapList.push({ identifier, inputWidth });
    });
    return gapList;
  }, [element]);

  const pairsArrayToMap = (arr: unknown[]): Record<string, string> => {
    const selections: Record<string, string> = {};
    arr.forEach((pair) => {
      if (
        Array.isArray(pair) &&
        pair.length === 2 &&
        typeof pair[0] === "string" &&
        typeof pair[1] === "string"
      ) {
        selections[pair[0]] = pair[1];
      }
    });
    return selections;
  };

  // 내부 상태 관리
  const [gapSelections, setGapSelections] = useState<Record<string, string>>(() => {
    if (options.gapSelections) {
      return options.gapSelections;
    }
    if (options.responses && responseIdentifier in options.responses) {
      const responseValue = options.responses[responseIdentifier];
      if (typeof responseValue === "object" && Array.isArray(responseValue)) {
        const fromResponses = pairsArrayToMap(responseValue);
        if (Object.keys(fromResponses).length > 0) return fromResponses;
      }
    }
    // 정답 프리필은 preview(정답 확인) 모드에서만. practice 등에서는 빈 값으로 시작.
    if (options.mode === "preview") {
      const rawCorrect = options.correctAnswers?.[responseIdentifier];
      if (Array.isArray(rawCorrect)) {
        const fromCorrect = pairsArrayToMap(rawCorrect);
        if (Object.keys(fromCorrect).length > 0) return fromCorrect;
      }
    }
    return {};
  });

  const isPreview = options.mode === "preview";
  const [isSubmit, setIsSubmit] = useState(!!options.isSubmit);

  useEffect(() => {
    setIsSubmit(!!options.isSubmit);
  }, [options.isSubmit]);
  const [dragOverGapId, setDragOverGapId] = useState<string | null>(null);
  // click 모드에서 현재 '선택(armed)'된 choiceId
  const [armedChoiceId, setArmedChoiceId] = useState<string | null>(null);

  // choiceId → 현재 배치된 gap 수
  const usedCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    Object.values(gapSelections).forEach((cId) => {
      counts[cId] = (counts[cId] || 0) + 1;
    });
    return counts;
  }, [gapSelections]);

  // match-max 도달 여부 (0이면 무제한 → 항상 false)
  const isChoiceExhausted = useCallback(
    (choiceId: string) => {
      const max = matchMaxMap[choiceId] ?? 1;
      if (max === 0) return false;
      return (usedCounts[choiceId] || 0) >= max;
    },
    [matchMaxMap, usedCounts]
  );

  // 정답 맵: { gapId: choiceId }
  const correctMap = useMemo<Record<string, string>>(() => {
    const raw =
      options.submitResponse?.correctAnswer?.[responseIdentifier] ??
      options.correctAnswers?.[responseIdentifier];
    if (!Array.isArray(raw)) return {};
    const map: Record<string, string> = {};
    for (const pair of raw) {
      if (Array.isArray(pair) && pair.length === 2) {
        map[pair[0]] = pair[1];
      }
    }
    return map;
  }, [options.submitResponse, options.correctAnswers, responseIdentifier]);

  // response 변경 알림 헬퍼
  const notifyResponseChange = useCallback(
    (newSelections: Record<string, string>) => {
      const responseValue: Array<[string, string]> = Object.entries(newSelections).map(
        ([gId, cId]) => [gId, cId]
      );
      options.onResponseChange?.(responseIdentifier, responseValue as unknown as ResponseValue);
    },
    [options, responseIdentifier]
  );

  // choice를 gap에 배치 (drag/click 공통). match-max를 고려해 재사용/이동을 처리한다.
  const assignChoiceToGap = useCallback(
    (targetGapId: string, choiceId: string, sourceGapId?: string) => {
      if (isSubmit || isPreview) return;

      const newSelections = { ...gapSelections };
      // gap → gap 이동 시 원래 gap 비우기
      if (sourceGapId) delete newSelections[sourceGapId];

      const max = matchMaxMap[choiceId] ?? 1;
      if (max !== 0) {
        const countExcludingTarget = Object.entries(newSelections).filter(
          ([g, c]) => g !== targetGapId && c === choiceId
        ).length;
        if (countExcludingTarget >= max) {
          if (max === 1) {
            // 단일 사용: 기존 위치에서 옮긴다
            Object.keys(newSelections).forEach((g) => {
              if (g !== targetGapId && newSelections[g] === choiceId) delete newSelections[g];
            });
          } else {
            // 최대치 도달 → 배치 불가
            return;
          }
        }
      }

      newSelections[targetGapId] = choiceId;
      setGapSelections(newSelections);
      setIsSubmit(false);
      setArmedChoiceId(null);
      notifyResponseChange(newSelections);
    },
    [gapSelections, isSubmit, isPreview, matchMaxMap, notifyResponseChange]
  );

  // gap 비우기 헬퍼
  const clearGap = useCallback(
    (gapId: string) => {
      if (isSubmit || isPreview) return;
      if (!gapSelections[gapId]) return;
      const newSelections = { ...gapSelections };
      delete newSelections[gapId];
      setGapSelections(newSelections);
      setIsSubmit(false);
      notifyResponseChange(newSelections);
    },
    [gapSelections, isSubmit, isPreview, notifyResponseChange]
  );

  // ── drag 모드 핸들러 ──
  const handleDragStart = useCallback(
    (e: React.DragEvent, choiceId: string) => {
      if (isSubmit) {
        e.preventDefault();
        return;
      }
      e.dataTransfer.setData("text/plain", choiceId);
      e.dataTransfer.setData("source", "choice"); // 소스 구분
      e.dataTransfer.effectAllowed = "move";
    },
    [isSubmit]
  );

  const handleGapDragStart = useCallback(
    (e: React.DragEvent, gapId: string, choiceId: string) => {
      if (isSubmit) {
        e.preventDefault();
        return;
      }
      e.dataTransfer.setData("text/plain", choiceId);
      e.dataTransfer.setData("source", "gap");
      e.dataTransfer.setData("sourceGapId", gapId);
      e.dataTransfer.effectAllowed = "move";
    },
    [isSubmit]
  );

  const handleDragOver = useCallback(
    (e: React.DragEvent, gapId: string) => {
      if (isSubmit) return;
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";
      setDragOverGapId(gapId);
    },
    [isSubmit]
  );

  const handleDragLeave = useCallback(() => {
    setDragOverGapId(null);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent, targetGapId: string) => {
      if (isSubmit) return;
      e.preventDefault();
      setDragOverGapId(null);

      const choiceId = e.dataTransfer.getData("text/plain");
      const source = e.dataTransfer.getData("source");
      const sourceGapId = e.dataTransfer.getData("sourceGapId");
      if (!choiceId) return;

      assignChoiceToGap(targetGapId, choiceId, source === "gap" ? sourceGapId : undefined);
    },
    [isSubmit, assignChoiceToGap]
  );

  const handleDropOnChoices = useCallback(
    (e: React.DragEvent) => {
      if (isSubmit) return;
      e.preventDefault();

      const source = e.dataTransfer.getData("source");
      const sourceGapId = e.dataTransfer.getData("sourceGapId");

      // gap에서 드래그한 경우에만 제거
      if (source === "gap" && sourceGapId) {
        clearGap(sourceGapId);
      }
    },
    [isSubmit, clearGap]
  );

  // ── click 모드 핸들러 ──
  const handleChoiceClick = useCallback(
    (choiceId: string) => {
      if (isSubmit || isPreview) return;
      setArmedChoiceId((prev) => {
        if (prev === choiceId) return null; // 다시 누르면 해제
        if (isChoiceExhausted(choiceId)) return prev; // 최대치면 선택 불가
        return choiceId;
      });
    },
    [isSubmit, isPreview, isChoiceExhausted]
  );

  // click 모드: gap 클릭 → armed choice 배치, armed 없으면 채워진 gap 비우기
  const handleGapActivate = useCallback(
    (gapId: string) => {
      if (isSubmit || isPreview) return;
      if (armedChoiceId) {
        assignChoiceToGap(gapId, armedChoiceId);
        return;
      }
      clearGap(gapId);
    },
    [isSubmit, isPreview, armedChoiceId, assignChoiceToGap, clearGap]
  );

  // drag 모드: 채워진 gap 클릭 → 비우기
  const handleGapClick = useCallback(
    (gapId: string) => {
      if (isSubmit) return;
      clearGap(gapId);
    },
    [isSubmit, clearGap]
  );

  // qti-gap만 처리하는 함수
  const processGapNode = useCallback(
    (gapElement: Element, gapIndexCounter: { current: number }): React.ReactElement | null => {
      const gapId = gapElement.getAttribute("identifier") || "";
      const gap = gaps.find((g) => g.identifier === gapId);
      if (!gap) return null;

      const currentGapIndex = gapIndexCounter.current++;
      const selectedChoiceId = gapSelections[gapId] || null;
      const selectedChoice = selectedChoiceId
        ? gapTexts.find((c) => c.identifier === selectedChoiceId)
        : null;

      const gapIsCorrect: boolean | undefined =
        options.isSubmit && selectedChoiceId && Object.keys(correctMap).length > 0
          ? selectedChoiceId === correctMap[gapId]
          : undefined;

      const label = getListStyleLabel(listStyleType, currentGapIndex + 1);

      // preview에서는 클릭 반응 없음. click 모드: 항상 클릭(배치/비우기). drag 모드: 채워졌을 때만 클릭(비우기).
      const onClick = isPreview
        ? undefined
        : mode === "click"
          ? () => handleGapActivate(gapId)
          : selectedChoiceId
            ? () => handleGapClick(gapId)
            : undefined;

      return (
        <Gap
          key={`gap-${responseIdentifier}-${gapId}`}
          gap={gap}
          index={currentGapIndex}
          label={label}
          canDrag={mode === "drag"}
          selectedChoiceId={selectedChoiceId}
          selectedChoiceText={selectedChoice?.text || null}
          isSubmit={!!options.isSubmit}
          isPreview={isPreview}
          isCorrect={gapIsCorrect}
          inputWidth={gap.inputWidth}
          isDragOver={dragOverGapId === gapId}
          onDragOver={(e) => handleDragOver(e, gapId)}
          onDragLeave={handleDragLeave}
          onDrop={(e) => handleDrop(e, gapId)}
          onDragStart={
            mode === "drag" && selectedChoiceId
              ? (e) => handleGapDragStart(e, gapId, selectedChoiceId)
              : undefined
          }
          onClick={onClick}
        />
      );
    },
    [
      gaps,
      gapSelections,
      gapTexts,
      responseIdentifier,
      correctMap,
      dragOverGapId,
      listStyleType,
      mode,
      isPreview,
      options.isSubmit,
      handleDragOver,
      handleDragLeave,
      handleDrop,
      handleGapDragStart,
      handleGapActivate,
      handleGapClick,
    ]
  );

  // gap-text 선택 옵션들 렌더링
  const gapTextChoices =
    gapTexts.length > 0 &&
    gapTexts.map((choice) => {
      const exhausted = isChoiceExhausted(choice.identifier);
      const isArmed = armedChoiceId === choice.identifier;
      return (
        <GapChoice
          key={`gap-choice-${choice.identifier}`}
          choice={choice}
          isUsed={exhausted}
          isSubmit={!!options.isSubmit}
          isPreview={isPreview}
          draggable={mode === "drag" && !options.isSubmit && !isPreview && !exhausted}
          onDragStart={(e) => handleDragStart(e, choice.identifier)}
          clickable={mode === "click" && !options.isSubmit && !isPreview && !exhausted}
          selected={isArmed}
          onClick={mode === "click" ? () => handleChoiceClick(choice.identifier) : undefined}
        />
      );
    });

  const choicesGroup = gapTextChoices ? (
    <div
      className="qti-ext-gap-choices"
      role="group"
      aria-label="선택지 목록"
      onDragOver={(e: React.DragEvent) => {
        if (mode !== "drag") return;
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
      }}
      onDrop={mode === "drag" ? handleDropOnChoices : undefined}
    >
      {gapTextChoices}
    </div>
  ) : null;

  // 본문 콘텐츠 렌더: 공용 파서(parseHTMLElement)를 재사용하고,
  // qti-gap / qti-gap-text / gap-text 패널만 renderCustomNode 훅으로 커스텀 처리한다.
  const renderContent = useMemo(() => {
    const gapIndexCounter = { current: 0 };

    // 공용 파서가 각 자식 요소에서 호출하는 훅 (undefined=기본 처리)
    const renderCustomNode = (el: Element, _idx: number): React.ReactNode | undefined => {
      const tag = el.tagName.toLowerCase();
      if (tag === "qti-gap") return processGapNode(el, gapIndexCounter) ?? null;
      if (tag === "qti-gap-text") return null; // 선택지는 패널/상·하단에서 별도 렌더
      if (isGapTextPanel(el)) return choicesGroup ?? null;
      return undefined;
    };

    const optionsWithHook: QTIParserOptions = { ...options, renderCustomNode };
    const children: React.ReactNode[] = [];

    // 인터랙션 요소 자체는 HTML 태그가 아니므로 직속 자식만 여기서 순회하고,
    // 하위 트리는 공용 파서에 위임한다(내부 qti-gap도 훅으로 처리됨).
    element.childNodes.forEach((child, idx) => {
      if (child.nodeType === Node.TEXT_NODE) {
        const text = child.textContent;
        if (isFormattingWhitespace(text)) return;
        if (text != null && text !== "") {
          children.push(...parseTextWithLaTeX(text, `gm-text-${idx}`));
        }
        return;
      }
      if (child.nodeType !== Node.ELEMENT_NODE) return;

      const el = child as Element;
      const custom = renderCustomNode(el, idx);
      if (custom !== undefined) {
        if (custom !== null) children.push(custom);
        return;
      }
      const parsed = parseHTMLElement(el, optionsWithHook, idx);
      if (parsed) children.push(parsed);
    });

    let seq = 0;
    return children.map((c) => {
      if (React.isValidElement(c) && c.key === null) {
        seq += 1;
        return React.cloneElement(c, { key: `gm-child-${seq}` });
      }
      return c;
    });
  }, [element, options, processGapNode, choicesGroup]);

  return (
    <div
      key={`gap-match-${responseIdentifier}-${index}`}
      className={`qti-ext-gap-match qti-ext-gap-match-${mode}`}
    >
      {!hasGapTextPanel && choicesPosition === "top" && choicesGroup}
      {renderContent}
      {!hasGapTextPanel && choicesPosition === "bottom" && choicesGroup}
    </div>
  );
};
