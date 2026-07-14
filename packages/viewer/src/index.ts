/**
 * @rightstack/rqti-viewer - QTI 문제(Viewer) 렌더링 라이브러리
 *
 * 스타일은 별도로 import 해야 한다:
 *   import "@rightstack/rqti-viewer/styles.css";
 */

// 메인 Viewer
export { default as Question } from "./Question";
export type { QuestionProps, QuestionMode } from "./Question";

// 문항 유형
export { ITEM_TYPE, type ItemsType } from "./constants/itemType";
export {
  SAMPLE_ITEMS,
  SAMPLE_IDS,
  type SampleItem,
} from "./constants/sampleItems";

// 테마 (기본 테마 + 커스텀 테마 작성용 — THEME_GUIDE.md 참고)
export { DEFAULT_THEME, DEFAULT_THEME_ID } from "./themes";
export { getThemeCSSVariables } from "./utils/themeToCSS";

// 피드백 (컨트롤드 컴포넌트 — open 상태는 소비자가 관리)
export { FeedbackSheet, FeedbackModal, FeedbackInline } from "./shared";
export type {
  ButtonConfigType,
  FeedbackStyleVariant,
  FeedbackInlineProps,
} from "./shared";
export { getFeedbackTitle } from "./utils/questionUtils";

// 핵심 타입
export type {
  Theme,
  FeedbackType,
  ResponseValue,
  ResponseValueMap,
  FeedbackSubmitResponse,
  FeedbackItem,
  QuestionItem,
  QuestionFeedback,
  QuestionEditorNode,
} from "./types";

export {
  toQuestionProps,
  type QuestionItemProps,
} from "./utils/toQuestionProps";
