import type { ReactNode } from "react";
import type { ITEM_TYPE } from "../constants/itemType";
import type { Theme } from "./theme";

/**
 * 피드백 표시용 최소 응답 타입.
 * - test: test.types.SubmitItemResponse (response, correctAnswer 포함)
 * - itemDetail: itemsession API는 correct만 반환 → 제출한 responses를 합쳐 전달
 */
export interface FeedbackSubmitResponse {
  correct: boolean;
  response?: ResponseValueMap;
  correctAnswer?: ResponseValueMap;
}

/**
 * 복습(preview) 모드에서 문항 하단에 표시되는 피드백 섹션 한 항목.
 * - type: 피드백 유형 (해설/해석/힌트 등, FeedbackType과 호환)
 * - typeLabel: 표시 라벨 (없으면 type 기본 라벨 사용)
 * - content: 본문 HTML 조각
 */
export interface FeedbackItem {
  type: string;
  typeLabel?: string;
  title?: string;
  content: string;
}

export interface MediaContentType {
  id: string;
  type: "image" | "video" | "audio";
  url: string;
  alt?: string;
  width?: number;
  height?: number;
  className?: string;
}

export interface ChoiceType {
  identifier: string;
  text?: ReactNode;
  media?: MediaContentType[];
  correct?: boolean;
  label?: string; // qti-simple-choice의 label 속성 (예: "ㄱ", "ㄴ", "1", "2")
}

export interface ChoiceButtonType {
  identifier: string;
  content: ReactNode;
  isCorrect?: boolean;
}

/** 입력형(SRQ/CLOZE, qti-text-entry) 제출 값. 칸 타입(isMath)은 입력 방식과 무관하다. */
export interface TextEntryResponse {
  value: string;
  isMath: boolean;
}

export function isTextEntryResponse(value: unknown): value is TextEntryResponse {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return false;
  }
  const record = value as Record<string, unknown>;
  return typeof record.value === "string" && typeof record.isMath === "boolean";
}

/** 선택형 등 identifier 목록으로 읽는다. string / string[] 만. */
export function getResponseIdentifiers(
  value: ResponseValue | undefined | null
): string[] {
  if (value === undefined || value === null) return [];
  if (typeof value === "string") return [value];
  if (Array.isArray(value) && value.every((v): v is string => typeof v === "string")) {
    return value;
  }
  return [];
}

/** 입력형 응답에서 표시·채점용 문자열만 꺼낸다. 옛 문자열/`string[]`도 읽는다. */
export function getTextEntryValue(value: unknown, fallback = ""): string {
  if (isTextEntryResponse(value)) return value.value;
  if (typeof value === "string") return value;
  if (Array.isArray(value)) {
    const first = value[0];
    if (isTextEntryResponse(first)) return first.value;
    if (first === undefined || first === null) return fallback;
    return String(first);
  }
  return fallback;
}

// 타입 정의
export type ResponseValue =
  | string // single identifier/string
  | string[] // multiple/ordered identifiers
  | Array<[string, string]> // pairs/directedPairs
  | number // integer/float
  | boolean // boolean
  | { x: number; y: number } // point
  | TextEntryResponse;

export interface ResponseByInteraction {
  choice: string | string[]; // single or multiple
  "inline-choice": string; // single only
  "text-entry": TextEntryResponse;
  "extended-text": string; // single string
  hotspot: string | string[]; // single or multiple
  order: string[]; // ordered
  match: Array<[string, string]>; // directedPair/pair
  "gap-match": Array<[string, string]>; // directedPair
}

export interface ResponseValueMap {
  [responseIdentifier: string]: ResponseValue;
}

/** Question/파서 동작 모드. preview: 정적 미리보기(인터랙션 비활성) */
export type QuestionMode = "practice" | "preview" | "paper";

/**
 * 레이아웃 사이징 모드.
 * - responsive: 컨테이너 폭에 맞춰 콘텐츠가 재배치(reflow)되는 기존 반응형(기본값)
 * - fixed: 저작 기준 고정 폭(designWidth)으로 렌더 후 transform: scale()로 비례 축소.
 *   부모가 기준 폭보다 넓어도 원본 이상으로 확대하지 않는다.
 *   폭이 변해도 내부 상대 좌표가 고정되어 화이트보드 필기 등 오버레이 정합이 유지된다.
 */
export type QuestionSizing = "responsive" | "fixed";

export interface QTIParserOptions {
  token?: string;
  itemKey?: string;
  correct?: boolean;
  onResponseChange?: (identifier: string, value: ResponseValue) => void;
  theme?: Theme;
  responses?: ResponseValueMap;
  isSubmit?: boolean;
  /** SIMULTANEOUS일 때는 정오답/피드백 표시 안 함 */
  correctAnswers?: Record<string, ResponseValue>;
  submissionMode?: "INDIVIDUAL" | "SIMULTANEOUS";
  /** practice | preview. preview일 때 인터랙션 비활성/정적 렌더 */
  mode?: QuestionMode;
  /** 미디어 상대 경로 해석용 베이스 URL */
  baseUrl?: string;
  submitAnswers?: string | Set<string>; // SCQ/TFQ는 string, MCQ는 Set<string>
  submitResponse?: FeedbackSubmitResponse;
  questionType?: (typeof ITEM_TYPE)[keyof typeof ITEM_TYPE]; // 질문 유형
  /**
   * 입력형(SRQ/CLOZE) 칸이 수식인지. 문항 API `isMath`. 없으면 false.
   * 정답/입력 문자열로 추론하지 않는다.
   */
  isMath?: boolean;
  /** 정답 키 미리보기(피드백). 정오답 스타일을 숨긴다 */
  answerKeyPreview?: boolean;
  totalTextEntries?: number; // CLOZE용: 전체 텍스트 입력 필드 개수
  inputWidths?: Record<string, string>; // response identifier -> width
  // MTQ용
  matchedPairs?: MatchingPairType[]; // 매칭된 쌍들
  selectedLeft?: string | null; // 선택된 왼쪽 옵션
  selectedRight?: string | null; // 선택된 오른쪽 옵션
  onMatchSelect?: (optionId: string) => void; // 옵션 선택 핸들러
  correctPairs?: MatchingPairType[]; // 정답 쌍들
  submitMatchedPairs?: MatchingPairType[]; // 제출된 매칭 쌍들
  // ICQ용
  dropdownEntries?: Array<{
    identifier: string;
    options: DropdownOptionType[];
    correctResponse?: string;
    inputWidth?: string;
  }>;
  // ORQ용
  selectedOrder?: string[]; // 선택된 순서
  correctOrder?: string[]; // 정답 순서
  onOrderChange?: (order: string[]) => void; // 순서 변경 핸들러
  onDragStart?: (choiceId: string) => void; // 드래그 시작 핸들러
  onDragEnd?: () => void; // 드래그 종료 핸들러
  // Essay용
  maxLength?: number; // 최대 길이
  placeholder?: string; // placeholder
  // GMQ용 (gap-match-interaction)
  gapSelections?: Record<string, string>; // gapId -> choiceId 매핑
  focusedGapIndex?: number; // 현재 포커스된 gap 인덱스
  usedChoices?: Set<string>; // 사용된 choiceId들
  onGapOptionClick?: (choiceId: string) => void; // 옵션 클릭 핸들러
  onGapClick?: (gapId: string, index: number) => void; // gap 클릭 핸들러
  /**
   * 커스텀 노드 렌더 훅.
   * - `undefined` 반환: 기본 처리(공용 파서에 위임)
   * - 그 외(React 노드 또는 `null`) 반환: 처리됨. `null`은 아무것도 렌더하지 않음.
   * gap-match가 `qti-gap` / `qti-gap-text` / `qti-ext-gap-text-panel`을 처리하는 데 사용.
   */
  renderCustomNode?: (element: Element, index: number) => ReactNode | undefined;
}

export interface MatchingPairType {
  leftId: string;
  rightId: string;
}

export interface DropdownOptionType {
  identifier: string;
  text?: string;
  media?: MediaContentType[];
  /** renderQtiNode 등으로 파싱한 라벨; 있으면 text/media 대신 이것만 표시 */
  content?: ReactNode;
}

export interface MatchingOptionType {
  identifier: string;
  text?: string;
  media?: MediaContentType[];
}

export interface OrderChoiceType {
  identifier: string;
  text?: string | string[];
  media?: MediaContentType[];
  label?: string;
}

export interface GapType {
  identifier: string;
}

export interface GapChoiceType {
  identifier: string;
  text?: string;
  media?: MediaContentType[];
}
