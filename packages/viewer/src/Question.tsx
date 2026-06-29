import React, { useCallback, useEffect, useMemo, useState } from "react";
import "./assets/styles/index.css";
import { QuestionNumber } from "./components/QuestionNumber";
import { ITEM_TYPE, type ItemsType } from "./constants/itemType";
import { cn } from "./lib/utils";
import { parseQTIToReact } from "./parser";
import { CorrectIcon, IncorrectIcon, SubmitButton } from "./shared";
import { THEME_MAP } from "./themes";
import type {
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
import { type CanSubmitOptions, canSubmitUtil } from "./utils/questionUtils";
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
  /** 문항 번호 (1-based) */
  questionIndex?: number;
  /** preview 채점 표시용 정오답 여부 */
  correct?: boolean;
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
  questionIndex,
  correct,
  className,
}: QuestionProps) {
  const [responses, setResponses] = useState<ResponseValueMap>(responsesProp ?? {});
  const [internalIsSubmit, setInternalIsSubmit] = useState(isSubmit);

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
  }, [onSubmit, responses]);

  // 채점 결과 도착 시 피드백 시그널 발생 (practice 모드)
  useEffect(() => {
    if (!submitResponse || mode !== "practice") return;
    setInternalIsSubmit(true);
    if (type === ITEM_TYPE.ESSAY) {
      onFeedbackOpen?.("SOLUTION");
    } else {
      onFeedbackOpen?.(submitResponse.correct ? "CORRECT" : "INCORRECT");
    }
  }, [submitResponse, mode, onFeedbackOpen, type]);

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

  const parserOptions: QTIParserOptions = {
    token,
    baseUrl,
    questionType: type,
    placeholder,
    theme,
    mode,
    correct,
    submitResponse,
    responses: responsesProp,
    correctAnswers: correctAnswers ?? submitResponse?.correctAnswer,
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
    type !== ITEM_TYPE.ESSAY &&
    (mode === "preview"
      ? internalIsSubmit && correct !== undefined
      : !!submitResponse);

  const isCorrectBadge = mode === "preview" ? !!correct : !!submitResponse?.correct;
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

  return (
    <div className={cn("qti-ext-wrapper", className)} style={themeVariables as React.CSSProperties}>
      <div className="qti-ext-container">
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
    </div>
  );
}

export default Question;
