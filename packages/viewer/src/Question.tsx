import React, { useCallback, useEffect, useMemo, useState } from "react";
import "./assets/styles/index.css";
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

export type { QuestionMode } from "./types";

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
  /** 테마 객체 또는 프리셋 id */
  theme?: Theme | string;
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
   * 기본값 true. (정답·피드백 정보가 없으면 자동으로 렌더되지 않음)
   */
  showInlineFeedback?: boolean;
  className?: string;
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
  mode = "practice",
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
  showInlineFeedback = true,
  className,
}: QuestionProps) {
  const [responses, setResponses] = useState<ResponseValueMap>(responsesProp ?? {});
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
      ? (THEME_MAP[themeProp as keyof typeof THEME_MAP] ?? THEME_MAP["default"])
      : (themeProp ?? THEME_MAP["default"]);

  const themeVariables = getThemeCSSVariables(theme);

  useEffect(() => {
    loadThemeFont(theme.typography?.fontFamily);
  }, [theme.typography?.fontFamily]);

  useEffect(() => {
    setInternalIsSubmit(isSubmit);
  }, [isSubmit]);

  const handleResponseChange = (identifier: string, value: ResponseValue) => {
    const newResponses = { ...responses, [identifier]: value } as ResponseValueMap;
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
    !!submitResponse || (!!correctAnswers && Object.keys(correctAnswers).length > 0);
  const isCompletionOnly = type === ITEM_TYPE.ESSAY || type === ITEM_TYPE.UPLOAD || !hasGrading;
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
  }, [effectiveSubmitResponse, mode, onFeedbackOpen, feedbackType, showFeedback]);

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
        (data.match(/<qti-text-entry-interaction\b/g) ?? []).length || undefined;
    } else if (type === ITEM_TYPE.DDQ) {
      expectedResponseCount =
        (data.match(/<qti-inline-choice-interaction\b/g) ?? []).length || undefined;
    } else if (type === ITEM_TYPE.GMQ) {
      expectedResponseCount = (data.match(/<qti-gap[\s>/]/g) ?? []).length || undefined;
    }

    return { type, maxChoices, expectedResponseCount };
  }, [data, type]);

  const canSubmit = canSubmitUtil(responses, canSubmitOptions);

  // preview(리뷰) 하단 FeedbackInline에 표시할 정답: prop 우선, 없으면 채점 응답의 correctAnswer
  const inlineCorrectAnswer = correctAnswers ?? effectiveSubmitResponse?.correctAnswer;

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
    !!qnConfig && !(qnConfig?.enabled === false || String(qnConfig?.enabled) === "false");
  const showQuestionNumber =
    enabled && questionIndex !== undefined && questionIndex !== null && questionIndex >= 1;
  const position = qnConfig?.position === "top" ? "top" : "inline";
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

  const isCorrectBadge = mode === "preview" ? !!correct : !!effectiveSubmitResponse?.correct;
  const correctIconUrl = theme?.feedbackConfig?.common?.correctIconUrl;
  const incorrectIconUrl = theme?.feedbackConfig?.common?.incorrectIconUrl;

  const parsedContent = data ? parseQTIToReact(data, parserOptions) : null;

  const renderFeedbackBadge = () => (
    <span className="qti-ext-feedback-badge" aria-hidden>
      {isCorrectBadge ? (
        correctIconUrl ? (
          <img src={correctIconUrl} alt="" className="qti-ext-feedback-badge-img" />
        ) : (
          <CorrectIcon />
        )
      ) : incorrectIconUrl ? (
        <img src={incorrectIconUrl} alt="" className="qti-ext-feedback-badge-img" />
      ) : (
        <IncorrectIcon />
      )}
    </span>
  );

  const contentBlock = (() => {
    if (
      showQuestionNumber &&
      position === "inline" &&
      parsedContent &&
      React.isValidElement(parsedContent)
    ) {
      const numberNode = (
        <QuestionNumber
          label={questionNumberLabel}
          position="inline"
          feedbackBadge={showFeedbackBadge ? renderFeedbackBadge() : undefined}
        />
      );
      return <>{injectInlineQuestionNumber(parsedContent, numberNode)}</>;
    }
    return <>{parsedContent}</>;
  })();

  // preview(리뷰) 모드에서 인라인 피드백은 문항 하단에 쌓이도록 세로 배치
  const stackInlineFeedback = mode === "preview" && showInlineFeedback;

  return (
    <div
      className={cn("qti-ext-wrapper", stackInlineFeedback && "flex-col", className)}
      style={themeVariables as React.CSSProperties}
    >
      <div className={cn("qti-ext-container", stackInlineFeedback && "mx-auto w-full")}>
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
          <div className="mt-auto pb-8">
            <SubmitButton canSubmit={canSubmit} onSubmit={handleSubmit} label={submitButtonLabel} />
          </div>
        )}
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
}

export default Question;
