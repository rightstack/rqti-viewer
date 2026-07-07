import React, { useMemo } from "react";
import {
  BookA,
  BookOpen,
  CheckCircle,
  CircleCheckBig,
  FileText,
  Languages,
  Lightbulb,
  ScrollText,
  XCircle,
} from "lucide-react";
import { Separator } from "../components/ui/separator";
import { cn } from "../lib/utils";
import { parseFeedbackContentToReact, parseTextWithLaTeX, renderLaTeX } from "../parser";
import type { FeedbackItem, FeedbackType, ResponseValue } from "../types";
import {
  buildChoiceIdentifierDisplayMapsFromQtiXml,
  buildCorrectAnswerFeedbackSegments,
  extractMatchRowColIdentifiersFromQtiXml,
  formatCorrectAnswerValueForDisplay,
  getMatchCorrectResponseStrings,
} from "../utils/choiceAnswerDisplayFromQti";
import type { CSSVariables } from "../utils/themeToCSS";
import { MatchAnswerView } from "./MatchAnswerView";

const SECTION_ICONS: Record<FeedbackType, React.ComponentType<{ className?: string }>> = {
  CORRECT: CheckCircle,
  INCORRECT: XCircle,
  HINT: Lightbulb,
  SOLUTION: BookOpen,
  TRANSLATION: Languages,
  SAMPLE_ANSWER: FileText,
  SCRIPT: BookA,
};

const SECTION_DEFAULT_LABELS: Record<FeedbackType, string> = {
  CORRECT: "정답",
  INCORRECT: "오답",
  HINT: "힌트",
  SOLUTION: "해설",
  TRANSLATION: "해석",
  SAMPLE_ANSWER: "모범 답안",
  SCRIPT: "듣기 대본",
};

/** 피드백 섹션 표시 순서 (해석 → 해설) */
const FEEDBACK_SECTION_ORDER: Record<string, number> = {
  CORRECT: 0,
  INCORRECT: 1,
  HINT: 2,
  TRANSLATION: 3,
  SOLUTION: 4,
  SAMPLE_ANSWER: 5,
};

export interface FeedbackInlineProps {
  /** 정답 (response identifier → 정답 값) */
  correctAnswer?: Record<string, ResponseValue> | null;
  /** 해설/해석/힌트 등 피드백 섹션 */
  feedbacks?: FeedbackItem[];
  /** 지문 해설 HTML */
  passageFeedbacks?: string | null;
  /** 정답/연결형 표시용 문항 QTI XML */
  qtiXml?: string;
  /** 미디어 인증 토큰 */
  token?: string;
  /** 테마 CSS 변수 (없으면 부모 스코프 변수 사용) */
  themeVariables?: CSSVariables;
  /** 연결형(MATCH) 행/열 식별자. 없으면 qtiXml에서 추출 */
  matchItems?: {
    rows: string[];
    cols: string[];
  };
}

/**
 * 복습(preview) 모드에서 문항 하단에 표시되는 정답·피드백 블록.
 * - 정답: correctAnswer를 보기 라벨/연결선/수식으로 표시
 * - 피드백: 지문 해설 + 해설/해석/힌트 등 섹션
 */
export const FeedbackInline = ({
  correctAnswer,
  feedbacks,
  passageFeedbacks,
  qtiXml,
  token,
  themeVariables,
  matchItems,
}: FeedbackInlineProps) => {
  const parserOptions = { token: token ?? undefined };
  const safeCorrectAnswer = correctAnswer ?? {};

  const choiceDisplayMaps = useMemo(
    () =>
      qtiXml !== undefined && qtiXml !== null && qtiXml.trim() !== ""
        ? buildChoiceIdentifierDisplayMapsFromQtiXml(qtiXml)
        : null,
    [qtiXml]
  );

  const correctAnswerSegments = useMemo(
    () => buildCorrectAnswerFeedbackSegments(safeCorrectAnswer, qtiXml),
    [qtiXml, safeCorrectAnswer]
  );

  const resolvedMatchItems = useMemo(() => {
    if (matchItems) return matchItems;
    return extractMatchRowColIdentifiersFromQtiXml(qtiXml) ?? { rows: [], cols: [] };
  }, [matchItems, qtiXml]);

  const orderedFeedbacks = useMemo(() => {
    if (feedbacks === undefined || feedbacks === null || feedbacks.length === 0) {
      return [];
    }
    return [...feedbacks].sort(
      (a, b) => (FEEDBACK_SECTION_ORDER[a.type] ?? 99) - (FEEDBACK_SECTION_ORDER[b.type] ?? 99)
    );
  }, [feedbacks]);

  const hasPassageFeedbacks = Boolean(passageFeedbacks?.trim());
  const hasFeedbacks = orderedFeedbacks.length > 0;
  const hasCorrectEntries = Object.keys(safeCorrectAnswer).length > 0;
  /** 정답 블록과 피드백·지문 블록이 모두 있을 때만 구간 사이 구분선 표시 */
  const showSeparator = correctAnswerSegments.length > 0 && (hasFeedbacks || hasPassageFeedbacks);

  const renderedDescription = (() => {
    if (!hasFeedbacks && !hasPassageFeedbacks) {
      return null;
    }
    return (
      <div>
        {passageFeedbacks && (
          <div className="qti-ext-feedback-section">
            <div className="qti-ext-feedback-section-head">
              <span className="qti-ext-feedback-section-icon" aria-hidden>
                <ScrollText className="qti-ext-feedback-section-icon-svg" />
              </span>
              <span className="qti-ext-feedback-section-label">지문 해설</span>
            </div>
            <div className="qti-ext-feedback-section-content">
              {parseFeedbackContentToReact(passageFeedbacks, parserOptions, "fb-passage")}
            </div>
          </div>
        )}
        {orderedFeedbacks.map((feedback) => {
          const Icon = SECTION_ICONS[feedback.type as FeedbackType] ?? FileText;
          const label =
            feedback.typeLabel ||
            SECTION_DEFAULT_LABELS[feedback.type as FeedbackType] ||
            feedback.type;
          return (
            <div
              className="qti-ext-feedback-sections"
              key={`${feedback.type}-${feedback.title ?? ""}-${(feedback.content ?? "").slice(0, 48)}`}
            >
              <div className="qti-ext-feedback-section">
                <div className="qti-ext-feedback-section-head">
                  <span className="qti-ext-feedback-section-icon" aria-hidden>
                    <Icon className="qti-ext-feedback-section-icon-svg" />
                  </span>
                  <span className="qti-ext-feedback-section-label">{label}</span>
                </div>
                {(feedback.content ?? "").trim() !== "" && (
                  <div className="qti-ext-feedback-section-content">
                    {parseFeedbackContentToReact(
                      feedback.content,
                      parserOptions,
                      `inline-${feedback.type}`
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  })();

  if (!hasCorrectEntries && !hasFeedbacks && !hasPassageFeedbacks) {
    return null;
  }

  return (
    <div
      role="region"
      aria-labelledby="feedback-inline-title"
      aria-describedby="feedback-inline-description"
      className="qti-ext-feedback-inline"
      style={themeVariables as React.CSSProperties}
    >
      {correctAnswerSegments.length > 0 && (
        <div className="qti-ext-feedback-section pb-4">
          <div className="qti-ext-feedback-section-head">
            <span className="qti-ext-feedback-section-icon" aria-hidden>
              <CircleCheckBig className="qti-ext-feedback-section-icon-svg" />
            </span>
            <span className="qti-ext-feedback-section-label">정답</span>
            <div className="qti-ext-feedback-section-answer rtqi:flex-wrap">
              {correctAnswerSegments.map((segment, index, segments) => {
                const matchStrings =
                  segment.kind === "default"
                    ? getMatchCorrectResponseStrings(qtiXml, segment.key, segment.value)
                    : null;
                return (
                  <React.Fragment key={`${segment.kind}-${segment.key}`}>
                    <span
                      className={cn(
                        "qti-ext-feedback-section-answer-item",
                        matchStrings !== null && "rtqi:block rtqi:w-full rtqi:basis-full"
                      )}
                    >
                      {segment.kind === "fractionLatex" ? (
                        <span className="qti-ext-mathfield align-middle">
                          {renderLaTeX(segment.latex, `fb-correct-${segment.key}`, false)}
                        </span>
                      ) : matchStrings !== null ? (
                        <MatchAnswerView
                          items={resolvedMatchItems}
                          correctResponse={matchStrings}
                        />
                      ) : (
                        parseTextWithLaTeX(
                          formatCorrectAnswerValueForDisplay(
                            segment.key,
                            segment.value,
                            choiceDisplayMaps,
                            qtiXml
                          ),
                          `fb-correct-${segment.key}`
                        )
                      )}
                    </span>
                    {index < segments.length - 1 && <span aria-hidden="true">, </span>}
                  </React.Fragment>
                );
              })}
            </div>
          </div>
        </div>
      )}
      {showSeparator && (
        <Separator className="rtqi:my-3 rtqi:bg-[color-mix(in_srgb,var(--qti-feedback-description-color-explanation)_35%,transparent)]" />
      )}
      {renderedDescription !== null && renderedDescription !== undefined && (
        <div
          id="feedback-inline-description"
          className={cn(
            "qti-ext-feedback-inline-description",
            (hasFeedbacks || hasPassageFeedbacks) && "qti-ext-feedback-description",
            showSeparator && "pt-3"
          )}
        >
          {renderedDescription}
        </div>
      )}
    </div>
  );
};
