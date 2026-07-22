import React, { useCallback, useEffect, useMemo, useState } from "react";
import "./assets/styles/index.css";
import { FixedScaleContainer } from "./components/FixedScaleContainer";
import { QuestionNumber } from "./components/QuestionNumber";
import { ITEM_TYPE, type ItemsType } from "./constants/itemType";
import { cn } from "./lib/utils";
import { parseFeedbackContentToReact, parseQTIToReact } from "./parser";
import {
  CorrectIcon,
  FeedbackInline,
  FeedbackModal,
  FeedbackSheet,
  IncorrectIcon,
  SubmitButton,
} from "./shared";
import { THEME_MAP } from "./themes";
import type {
  FeedbackItem,
  FeedbackSubmitResponse,
  FeedbackType,
  QTIParserOptions,
  QuestionMode,
  QuestionSizing,
  ResponseValue,
  ResponseValueMap,
  Theme,
} from "./types";
import { loadThemeFont } from "./utils/fontLoader";
import { formatQuestionNumber } from "./utils/formatQuestionNumber";
import { injectInlineQuestionNumber } from "./utils/injectInlineQuestionNumber";
import {
  type CanSubmitOptions,
  canSubmitUtil,
  checkAnswerUtil,
  getFeedbackTitle,
} from "./utils/questionUtils";
import { getThemeCSSVariables } from "./utils/themeToCSS";

export type { QuestionMode, QuestionSizing } from "./types";

export interface QuestionProps {
  /** QTI XML 문자열 */
  data?: string;
  /** 문항 유형 */
  type?: ItemsType;
  /** 미디어 인증 토큰 (?t= 쿼리로 추가됨) */
  token?: string;
  /** 미디어 상대 경로 해석용 베이스 URL */
  baseUrl?: string;
  placeholder?: string;
  /** 기본 테마 `"default"` 또는 커스텀 테마 객체(JSON) */
  theme?: Theme | "default";
  itemKey?: string;
  /** 응답 변경 콜백 */
  onResponse?: (responses: ResponseValueMap) => void;
  /** 제출 콜백 */
  onSubmit?: (responses: ResponseValueMap) => void;
  isSubmit?: boolean;
  showSubmitButton?: boolean;
  submitButtonLabel?: string;
  /** practice: 인터랙티브, preview: 정적 렌더 */
  mode?: QuestionMode;
  correctAnswers?: Record<string, ResponseValue>;
  /** 제어형 응답 (preview에서 사용) */
  responses?: ResponseValueMap;
  /** 채점 결과 (도착 시 피드백 시그널 발생) */
  submitResponse?: FeedbackSubmitResponse;
  /** 피드백 열림 시그널 (실제 렌더링은 소비자 책임) */
  onFeedbackOpen?: (type?: FeedbackType) => void;
  /**
   * practice 모드에서 제출 시 내장 피드백 시트를 자동으로 표시한다.
   * `submitResponse`가 외부에서 주입되지 않으면 `correctAnswers`로 자체 채점한다.
   */
  showFeedback?: boolean;
  /** 내장 피드백 시트 확인 버튼 라벨 */
  feedbackButtonLabel?: string;
  /** 풀이(해설) 내용. 정답 피드백에서 "풀이보기" 버튼으로 모달 표시 */
  solution?: React.ReactNode;
  /** 풀이보기 버튼 라벨 */
  solutionButtonLabel?: string;
  /** 문항 번호 (1-based) */
  questionIndex?: number;
  /** preview 채점 표시용 정오답 여부 */
  correct?: boolean;
  /**
   * preview(리뷰) 모드에서 문항 하단에 표시할 피드백 섹션(해설/해석/힌트 등).
   * 정답(correctAnswers)·지문 해설(passageFeedbacks)과 함께 FeedbackInline으로 렌더된다.
   */
  feedbacks?: FeedbackItem[];
  /** preview(리뷰) 모드에서 표시할 지문 해설 HTML */
  passageFeedbacks?: string | null;
  /**
   * preview(리뷰) 모드에서 문항 하단에 정답·피드백 블록(FeedbackInline)을 표시한다.
   * 기본값 false. (정답·피드백 정보가 없으면 자동으로 렌더되지 않음)
   */
  showInlineFeedback?: boolean;
  className?: string;
  /**
   * 레이아웃 사이징 모드. 기본 `"responsive"`.
   * - `"responsive"`: 컨테이너 폭에 맞춰 콘텐츠가 재배치되는 기존 반응형
   * - `"fixed"`: `designWidth` 고정 폭으로 렌더 후 scale 처리. 폭이 변해도
   *   내부 상대 좌표가 고정되어 화이트보드 필기 등 오버레이 정합이 유지된다.
   */
  sizing?: QuestionSizing;
  /** `sizing="fixed"`일 때 저작 기준 고정 폭(px). 기본 720. */
  designWidth?: number;
  /** `sizing="fixed"`일 때 확대 상한. 예: 1 = 원본 이상 확대 금지. */
  maxScale?: number;
  /**
   * `sizing="fixed"`일 때 designWidth 좌표계 위에 겹칠 오버레이(예: 화이트보드).
   * 콘텐츠와 동일한 스케일 안에 놓여 좌표가 함께 변환된다.
   */
  annotationOverlay?: React.ReactNode;
}

function Question({
  data,
  type,
  token,
  baseUrl,
  placeholder,
  theme: themeProp,
  itemKey: itemKeyProp,
  onResponse,
  onSubmit,
  isSubmit = false,
  showSubmitButton = true,
  submitButtonLabel = "제출",
  mode = "preview",
  correctAnswers,
  responses: responsesProp,
  submitResponse,
  onFeedbackOpen,
  showFeedback = false,
  feedbackButtonLabel = "확인",
  solution,
  solutionButtonLabel = "풀이보기",
  questionIndex,
  correct,
  feedbacks,
  passageFeedbacks,
  showInlineFeedback = false,
  className,
  sizing = "responsive",
  designWidth = 720,
  maxScale,
  annotationOverlay,
}: QuestionProps) {
  const [responses, setResponses] = useState<ResponseValueMap>(
    responsesProp ?? {},
  );
  const [internalIsSubmit, setInternalIsSubmit] = useState(isSubmit);
  // showFeedback 사용 시 자체 채점 결과 (submitResponse 미주입 시)
  const [internalSubmitResponse, setInternalSubmitResponse] = useState<
    FeedbackSubmitResponse | undefined
  >(undefined);
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [solutionOpen, setSolutionOpen] = useState(false);

  // 외부 주입(submitResponse) 우선, 없으면 자체 채점 결과 사용
  const effectiveSubmitResponse = submitResponse ?? internalSubmitResponse;

  const theme =
    typeof themeProp === "string"
      ? THEME_MAP[themeProp as keyof typeof THEME_MAP] ?? THEME_MAP["default"]
      : themeProp ?? THEME_MAP["default"];

  const themeVariables = getThemeCSSVariables(theme);

  useEffect(() => {
    loadThemeFont(theme.typography?.fontFamily);
  }, [theme.typography?.fontFamily]);

  useEffect(() => {
    setInternalIsSubmit(isSubmit);
  }, [isSubmit]);

  useEffect(() => {
    if (responsesProp !== undefined) setResponses(responsesProp);
  }, [responsesProp]);

  const handleResponseChange = (identifier: string, value: ResponseValue) => {
    const newResponses = {
      ...responses,
      [identifier]: value,
    } as ResponseValueMap;
    setResponses(newResponses);
    onResponse?.(newResponses);
  };

  const handleSubmit = useCallback(() => {
    onSubmit?.(responses);
    // 외부에서 채점 결과를 주입하지 않는 경우 자체 채점
    if (showFeedback && !submitResponse) {
      const isCorrect = checkAnswerUtil(responses, correctAnswers);
      setInternalSubmitResponse({ correct: isCorrect, response: responses });
    }
  }, [onSubmit, responses, showFeedback, submitResponse, correctAnswers]);

  // 정오답을 가릴 수 없는 유형(서술형/업로드 등 또는 정답 정보 부재)은 "제출 완료"만 표시
  const hasGrading =
    !!submitResponse ||
    (!!correctAnswers && Object.keys(correctAnswers).length > 0);
  const isCompletionOnly =
    type === ITEM_TYPE.ESSAY || type === ITEM_TYPE.UPLOAD || !hasGrading;
  const feedbackType: FeedbackType = isCompletionOnly
    ? "SOLUTION"
    : effectiveSubmitResponse?.correct
    ? "CORRECT"
    : "INCORRECT";

  // 채점 결과 도착 시 피드백 시그널 발생 + 내장 시트 오픈 (practice 모드)
  useEffect(() => {
    if (!effectiveSubmitResponse || mode !== "practice") return;
    setInternalIsSubmit(true);
    onFeedbackOpen?.(feedbackType);
    if (showFeedback) setFeedbackOpen(true);
  }, [
    effectiveSubmitResponse,
    mode,
    onFeedbackOpen,
    feedbackType,
    showFeedback,
  ]);

  const canSubmitOptions = useMemo<CanSubmitOptions>(() => {
    if (!data || !type) return {};

    let maxChoices: number | undefined;
    let expectedResponseCount: number | undefined;

    if (type === ITEM_TYPE.MCQ) {
      const m = data.match(/max-choices="(\d+)"/);
      maxChoices = m ? parseInt(m[1], 10) : undefined;
    }

    if (type === ITEM_TYPE.CLOZE) {
      expectedResponseCount =
        (data.match(/<qti-text-entry-interaction\b/g) ?? []).length ||
        undefined;
    } else if (type === ITEM_TYPE.DDQ) {
      expectedResponseCount =
        (data.match(/<qti-inline-choice-interaction\b/g) ?? []).length ||
        undefined;
    } else if (type === ITEM_TYPE.GMQ) {
      expectedResponseCount =
        (data.match(/<qti-gap[\s>/]/g) ?? []).length || undefined;
    }

    return { type, maxChoices, expectedResponseCount };
  }, [data, type]);

  const canSubmit = canSubmitUtil(responses, canSubmitOptions);

  // preview(리뷰) 하단 FeedbackInline에 표시할 정답: prop 우선, 없으면 채점 응답의 correctAnswer
  const inlineCorrectAnswer =
    correctAnswers ?? effectiveSubmitResponse?.correctAnswer;

  const parserOptions: QTIParserOptions = {
    token,
    baseUrl,
    questionType: type,
    placeholder,
    theme,
    mode,
    correct,
    submitResponse: effectiveSubmitResponse,
    responses: responsesProp,
    correctAnswers: correctAnswers ?? effectiveSubmitResponse?.correctAnswer,
    isSubmit: internalIsSubmit,
    itemKey: itemKeyProp,
    onResponseChange: mode === "preview" ? undefined : handleResponseChange,
  };

  // 문항 번호: questionNumberConfig가 있을 때만 표시
  const qnConfig = theme?.questionNumberConfig;
  const enabled =
    !!qnConfig &&
    !(qnConfig?.enabled === false || String(qnConfig?.enabled) === "false");
  const showQuestionNumber =
    enabled &&
    questionIndex !== undefined &&
    questionIndex !== null &&
    questionIndex >= 1;
  const position = qnConfig?.position === "top" ? "top" : "rtqi:inline";
  const digits = Number(qnConfig?.digits) || 1;
  const prefix = qnConfig?.prefix ?? "";
  const suffix = qnConfig?.suffix ?? "";
  const questionNumberLabel = showQuestionNumber
    ? formatQuestionNumber(questionIndex, digits, prefix, suffix)
    : "";

  const showFeedbackBadge =
    showQuestionNumber &&
    !isCompletionOnly &&
    (mode === "preview"
      ? internalIsSubmit && correct !== undefined
      : !!effectiveSubmitResponse);

  const isCorrectBadge =
    mode === "preview" ? !!correct : !!effectiveSubmitResponse?.correct;
  const correctIconUrl = theme?.feedbackConfig?.common?.correctIconUrl;
  const incorrectIconUrl = theme?.feedbackConfig?.common?.incorrectIconUrl;

  const parsedContent = data ? parseQTIToReact(data, parserOptions) : null;

  const renderFeedbackBadge = () => (
    <span className="qti-ext-feedback-badge" aria-hidden>
      {isCorrectBadge ? (
        correctIconUrl ? (
          <img
            src={correctIconUrl}
            alt=""
            className="qti-ext-feedback-badge-img"
          />
        ) : (
          <CorrectIcon />
        )
      ) : incorrectIconUrl ? (
        <img
          src={incorrectIconUrl}
          alt=""
          className="qti-ext-feedback-badge-img"
        />
      ) : (
        <IncorrectIcon />
      )}
    </span>
  );

  const contentBlock = (() => {
    if (
      showQuestionNumber &&
      position === "rtqi:inline" &&
      parsedContent &&
      React.isValidElement(parsedContent)
    ) {
      const numberNode = (
        <QuestionNumber
          label={questionNumberLabel}
          position="rtqi:inline"
          feedbackBadge={showFeedbackBadge ? renderFeedbackBadge() : undefined}
        />
      );
      return <>{injectInlineQuestionNumber(parsedContent, numberNode)}</>;
    }
    return <>{parsedContent}</>;
  })();

  // preview(리뷰) 모드에서 인라인 피드백은 문항 하단에 쌓이도록 세로 배치
  const stackInlineFeedback = mode === "preview" && showInlineFeedback;

  const isFixed = sizing === "fixed";
  const rootStyle: React.CSSProperties = isFixed
    ? { ...(themeVariables as React.CSSProperties), ["--qti-design-width" as string]: `${designWidth}px` }
    : (themeVariables as React.CSSProperties);

  const viewer = (
    <div
      className={cn("rtqi-viewer", className)}
      data-sizing={sizing}
      style={rootStyle}
    >
      <div
        className={cn(
          "qti-ext-wrapper",
          stackInlineFeedback && "rtqi:flex-col",
        )}
      >
        <div
          className={cn(
            "qti-ext-container",
            stackInlineFeedback && "rtqi:mx-auto rtqi:w-full",
          )}
        >
          {showQuestionNumber &&
            position === "top" &&
            (showFeedbackBadge ? (
              <div className="qti-ext-question-number-region">
                {renderFeedbackBadge()}
                <QuestionNumber label={questionNumberLabel} position="top" />
              </div>
            ) : (
              <QuestionNumber label={questionNumberLabel} position="top" />
            ))}

          {contentBlock}

          {mode !== "preview" && showSubmitButton && (
            <div className="rtqi:mt-auto rtqi:pb-8">
              <SubmitButton
                canSubmit={canSubmit}
                onSubmit={handleSubmit}
                label={submitButtonLabel}
              />
            </div>
          )}
        </div>
      </div>

      {mode === "preview" && showInlineFeedback && (
        <FeedbackInline
          correctAnswer={inlineCorrectAnswer}
          feedbacks={feedbacks}
          passageFeedbacks={passageFeedbacks}
          qtiXml={data}
          token={token}
          themeVariables={themeVariables}
        />
      )}

      {mode === "practice" && showFeedback && effectiveSubmitResponse && (
        <FeedbackSheet
          isSample={false}
          open={feedbackOpen}
          onOpenChange={(open) => {
            setFeedbackOpen(open);
            if (!open) onFeedbackOpen?.(undefined);
          }}
          type={feedbackType}
          title={getFeedbackTitle(isCompletionOnly, feedbackType, theme)}
          description={
            theme.feedbackConfig?.state?.[
              feedbackType === "CORRECT"
                ? "correct"
                : feedbackType === "SOLUTION"
                ? "explanation"
                : "incorrect"
            ]?.description?.text
          }
          buttons={[
            {
              name: feedbackButtonLabel,
              handleAction: () => {
                setFeedbackOpen(false);
                onFeedbackOpen?.(undefined);
              },
            },
            // 정답일 때만 풀이보기 버튼 추가 (모달로 해설 표시)
            ...(feedbackType === "CORRECT" && solution
              ? [
                  {
                    name: solutionButtonLabel,
                    handleAction: () => {
                      setFeedbackOpen(false);
                      onFeedbackOpen?.(undefined);
                      setSolutionOpen(true);
                    },
                  },
                ]
              : []),
          ]}
          themeVariables={themeVariables}
        />
      )}

      {mode === "practice" && showFeedback && solution && (
        <FeedbackModal
          isSample={false}
          open={solutionOpen}
          onOpenChange={setSolutionOpen}
          title={getFeedbackTitle(false, "SOLUTION", theme)}
          description={
            typeof solution === "string"
              ? parseFeedbackContentToReact(solution, parserOptions)
              : solution
          }
          buttons={[
            {
              name: feedbackButtonLabel,
              handleAction: () => setSolutionOpen(false),
            },
          ]}
          themeVariables={themeVariables}
        />
      )}
    </div>
  );

  if (isFixed) {
    return (
      <FixedScaleContainer
        designWidth={designWidth}
        maxScale={maxScale}
        overlay={annotationOverlay}
        className="rtqi-viewer-scale"
      >
        {viewer}
      </FixedScaleContainer>
    );
  }

  return viewer;
}

export default Question;
