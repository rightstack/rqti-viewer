import React, { useCallback, useEffect, useMemo, useState } from "react";
import { parseHTMLElement } from "../../parser/parseHtmlElement";
import type {
  GapChoiceType,
  GapType,
  QTIParserOptions,
  ResponseValue,
  ResponseValueMap,
} from "../../types";
import { extractMediaFromElement, extractTextFromElement } from "../../utils";
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

export const GapMatchInteraction: React.FC<GapMatchInteractionProps> = ({
  element,
  options,
  index,
}) => {
  const responseIdentifier = element.getAttribute("response-identifier") || "";
  const className = element.getAttribute("class") || "";
  const choicesPosition = className.includes("qti-choices-top") ? "top" : "bottom";

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
    const rawCorrect = options.correctAnswers?.[responseIdentifier];
    if (Array.isArray(rawCorrect)) {
      const fromCorrect = pairsArrayToMap(rawCorrect);
      if (Object.keys(fromCorrect).length > 0) return fromCorrect;
    }
    return {};
  });

  const isPreview = options.mode === "preview";
  const [isSubmit, setIsSubmit] = useState(!!options.isSubmit);

  useEffect(() => {
    setIsSubmit(!!options.isSubmit);
  }, [options.isSubmit]);
  const [dragOverGapId, setDragOverGapId] = useState<string | null>(null);

  // 사용된 choiceId들 계산
  const usedChoices = useMemo(() => new Set(Object.values(gapSelections)), [gapSelections]);

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

  // GapChoice 드래그 시작
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

  // Gap에서 드래그 시작 (이미 할당된 choice를 다른 곳으로 이동)
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

  // Gap 위에 드래그 오버
  const handleDragOver = useCallback(
    (e: React.DragEvent, gapId: string) => {
      if (isSubmit) return;
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";
      setDragOverGapId(gapId);
    },
    [isSubmit]
  );

  // Gap에서 드래그 떠남
  const handleDragLeave = useCallback(() => {
    setDragOverGapId(null);
  }, []);

  // Gap에 드롭
  const handleDrop = useCallback(
    (e: React.DragEvent, targetGapId: string) => {
      if (isSubmit) return;
      e.preventDefault();
      setDragOverGapId(null);

      const choiceId = e.dataTransfer.getData("text/plain");
      const source = e.dataTransfer.getData("source");
      const sourceGapId = e.dataTransfer.getData("sourceGapId");

      if (!choiceId) return;

      const newSelections = { ...gapSelections };

      // 소스가 gap이면 원래 gap에서 제거
      if (source === "gap" && sourceGapId) {
        delete newSelections[sourceGapId];
      }

      // 이미 다른 gap에 할당되어 있으면 제거 (choice에서 드래그한 경우)
      if (source === "choice") {
        Object.keys(newSelections).forEach((gId) => {
          if (newSelections[gId] === choiceId) {
            delete newSelections[gId];
          }
        });
      }

      // 타겟 gap에 할당
      newSelections[targetGapId] = choiceId;
      setGapSelections(newSelections);
      setIsSubmit(false);
      notifyResponseChange(newSelections);
    },
    [gapSelections, isSubmit, notifyResponseChange]
  );

  // GapChoice 영역에 드롭 (Gap에서 choice를 제거)
  const handleDropOnChoices = useCallback(
    (e: React.DragEvent) => {
      if (isSubmit) return;
      e.preventDefault();

      const source = e.dataTransfer.getData("source");
      const sourceGapId = e.dataTransfer.getData("sourceGapId");

      // gap에서 드래그한 경우에만 처리
      if (source === "gap" && sourceGapId) {
        const newSelections = { ...gapSelections };
        delete newSelections[sourceGapId];
        setGapSelections(newSelections);
        setIsSubmit(false);
        notifyResponseChange(newSelections);
      }
    },
    [gapSelections, isSubmit, notifyResponseChange]
  );

  // Gap 클릭 시 선택 제거
  const handleGapClick = useCallback(
    (gapId: string) => {
      if (isSubmit) return;
      if (!gapSelections[gapId]) return; // 선택된 게 없으면 무시

      const newSelections = { ...gapSelections };
      delete newSelections[gapId];
      setGapSelections(newSelections);
      setIsSubmit(false);
      notifyResponseChange(newSelections);
    },
    [gapSelections, isSubmit, notifyResponseChange]
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

      return (
        <Gap
          key={`gap-${responseIdentifier}-${gapId}`}
          gap={gap}
          index={currentGapIndex}
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
            selectedChoiceId ? (e) => handleGapDragStart(e, gapId, selectedChoiceId) : undefined
          }
          onClick={selectedChoiceId ? () => handleGapClick(gapId) : undefined}
        />
      );
    },
    [
      gaps,
      gapSelections,
      isSubmit,
      gapTexts,
      responseIdentifier,
      correctMap,
      dragOverGapId,
      handleDragOver,
      handleDragLeave,
      handleDrop,
      handleGapDragStart,
      handleGapClick,
    ]
  );

  // HTML 요소를 처리하되 내부의 qti-gap도 처리하는 함수
  const parseHTMLElementWithGaps = (
    htmlElement: Element,
    gapIndexCounter: { current: number },
    htmlIndex: number,
    parentTagName?: string
  ): React.ReactElement | null => {
    const tagName = htmlElement.tagName.toLowerCase();

    // void elements는 children을 가질 수 없으므로 먼저 처리
    if (tagName === "br") {
      const brClassName = htmlElement.getAttribute("class") || undefined;
      return <br key={`br-${htmlIndex}`} className={brClassName} />;
    }

    // 자식 노드 처리 (HTML 요소, 텍스트, qti-gap 처리)
    const children: Array<React.ReactElement | string> = [];
    htmlElement.childNodes.forEach((child, idx) => {
      if (child.nodeType === Node.TEXT_NODE) {
        const text = child.textContent;
        if (text !== null && text !== undefined) {
          children.push(text);
        }
        return;
      }

      if (child.nodeType !== Node.ELEMENT_NODE) return;

      const childElement = child as Element;
      const childTagName = childElement.tagName.toLowerCase();

      // qti-gap은 직접 처리
      if (childTagName === "qti-gap") {
        const gapNode = processGapNode(childElement, gapIndexCounter);
        if (gapNode) children.push(gapNode);
        return;
      }

      // qti-gap-text는 제외
      if (childTagName === "qti-gap-text") return;

      // 일반 HTML 요소는 재귀적으로 처리 (parseHTMLElementWithGaps 재사용)
      const parsed = parseHTMLElementWithGaps(childElement, gapIndexCounter, idx, tagName);
      if (parsed) children.push(parsed);
    });

    // parseHTMLElement를 사용하여 HTML 태그로 감싸서 반환
    const baseElement = parseHTMLElement(htmlElement, options, htmlIndex, parentTagName);
    if (!baseElement) return null;

    return React.cloneElement(baseElement, {}, ...children);
  };

  // SAX 방식으로 HTML과 gap을 섞어서 파싱
  const renderContent = useMemo(() => {
    const children: Array<React.ReactElement | string> = [];
    const gapIndexCounter = { current: 0 };

    element.childNodes.forEach((child, idx) => {
      // 텍스트 노드 처리
      if (child.nodeType === Node.TEXT_NODE) {
        const text = child.textContent;
        if (text !== null && text !== undefined) {
          children.push(text);
        }
        return;
      }

      if (child.nodeType !== Node.ELEMENT_NODE) return;

      const childElement = child as Element;
      const childTagName = childElement.tagName.toLowerCase();

      // qti-gap은 직접 처리
      if (childTagName === "qti-gap") {
        const gapNode = processGapNode(childElement, gapIndexCounter);
        if (gapNode) children.push(gapNode);
        return;
      }

      // qti-gap-text는 제외
      if (childTagName === "qti-gap-text") return;

      // 일반 HTML 요소는 parseHTMLElementWithGaps로 처리
      const parsed = parseHTMLElementWithGaps(childElement, gapIndexCounter, idx);
      if (parsed) children.push(parsed);
    });

    return children;
  }, [element, processGapNode, parseHTMLElementWithGaps]);

  // gap-text 선택 옵션들 렌더링
  const gapTextChoices =
    gapTexts.length > 0 &&
    gapTexts.map((choice) => {
      const isUsed = usedChoices.has(choice.identifier);
      return (
        <GapChoice
          key={`gap-choice-${choice.identifier}`}
          choice={choice}
          isUsed={isUsed}
          isSubmit={!!options.isSubmit}
          isPreview={isPreview}
          draggable={!options.isSubmit && !isPreview && !isUsed}
          onDragStart={(e) => handleDragStart(e, choice.identifier)}
        />
      );
    });

  return (
    <div key={`gap-match-${responseIdentifier}-${index}`}>
      {choicesPosition === "top" && gapTextChoices && (
        <div
          className="qti-ext-gap-choices"
          role="group"
          aria-label="선택지 목록"
          onDragOver={(e: React.DragEvent) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = "move";
          }}
          onDrop={handleDropOnChoices}
        >
          {gapTextChoices}
        </div>
      )}
      {renderContent}
      {choicesPosition === "bottom" && gapTextChoices && (
        <div
          className="qti-ext-gap-choices"
          role="group"
          aria-label="선택지 목록"
          onDragOver={(e: React.DragEvent) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = "move";
          }}
          onDrop={handleDropOnChoices}
        >
          {gapTextChoices}
        </div>
      )}
    </div>
  );
};
