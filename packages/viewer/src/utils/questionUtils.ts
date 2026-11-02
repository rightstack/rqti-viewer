import { ITEM_TYPE, type ItemsType } from "../constants/itemType";
import type { FeedbackType, ResponseValue, ResponseValueMap, Theme } from "../types";

/**
 * 응답 값을 비교 가능한 정규화 문자열로 변환.
 * - 문자열: 앞뒤 공백 제거
 * - 배열(MCQ/순서 무관 다중선택 등): 각 요소 정규화 후 정렬하여 순서 무관 비교
 * - 객체(point 등): JSON 직렬화
 */
function normalizeAnswer(value: ResponseValue | undefined | null): string {
  if (value === undefined || value === null) return "";
  if (Array.isArray(value)) {
    return value
      .map((v) => (Array.isArray(v) ? v.map(String).join(":") : String(v).trim()))
      .sort()
      .join("|");
  }
  if (typeof value === "object") return JSON.stringify(value);
  return String(value).trim();
}

/**
 * 정답 확인 함수
 * @param responses 사용자 응답
 * @param correctAnswers 정답
 * @returns 정답 여부
 */
export function checkAnswerUtil(
  responses: ResponseValueMap,
  correctAnswers?: Record<string, ResponseValue>
): boolean {
  if (!correctAnswers) {
    return false;
  }
  const identifiers = Object.keys(correctAnswers);
  if (identifiers.length === 0) {
    return false;
  }
  return identifiers.every(
    (identifier) =>
      normalizeAnswer(responses?.[identifier]) === normalizeAnswer(correctAnswers[identifier])
  );
}

export interface CanSubmitOptions {
  type?: ItemsType;
  expectedResponseCount?: number;
}

function isNonEmpty(value: unknown): boolean {
  if (value === undefined || value === null) return false;
  if (typeof value === "string") return value.trim() !== "";
  if (Array.isArray(value)) return value.length > 0;
  return true;
}

/** GMQ는 응답 식별자 하나에 [gapId, choiceId]만 모은다. 비어 있는 빈칸은 배열에 없다. */
function countFilledGapPairs(responses: ResponseValueMap): number {
  let count = 0;
  for (const value of Object.values(responses)) {
    if (!Array.isArray(value)) continue;
    for (const pair of value) {
      if (
        Array.isArray(pair) &&
        pair.length === 2 &&
        typeof pair[0] === "string" &&
        pair[0].trim() !== "" &&
        typeof pair[1] === "string" &&
        pair[1].trim() !== ""
      ) {
        count += 1;
      }
    }
  }
  return count;
}

export function canSubmitUtil(responses: ResponseValueMap, options?: CanSubmitOptions): boolean {
  const { type, expectedResponseCount } = options ?? {};

  // 다중 선택형은 정답 개수와 관계없이 하나 이상 선택하면 제출할 수 있다.
  if (type === ITEM_TYPE.MCQ) {
    return Object.values(responses).some((value) => Array.isArray(value) && value.length > 0);
  }

  if (type === ITEM_TYPE.ORDER || type === ITEM_TYPE.VCQ) return true;

  // 채워진 directedPair 수가 qti-gap 개수와 같을 때만 제출. gap-text 개수는 보지 않는다.
  if (type === ITEM_TYPE.GMQ) {
    return countFilledGapPairs(responses) === (expectedResponseCount ?? 0);
  }

  if (type === ITEM_TYPE.DDQ || type === ITEM_TYPE.CLOZE) {
    const values = Object.values(responses);
    if (expectedResponseCount !== undefined && values.length < expectedResponseCount) return false;
    return values.every(isNonEmpty);
  }

  return Object.values(responses).some(isNonEmpty);
}

/**
 * 피드백 타이틀 가져오기
 * @param isEssayType 서술형 문항 여부
 * @param feedbackType 피드백 타입
 * @param theme 테마
 * @returns 피드백 타이틀
 */
export function getFeedbackTitle(
  isEssayType = false,
  feedbackType: FeedbackType,
  theme: Theme
): string {
  if (isEssayType) {
    return "제출 완료";
  }
  switch (feedbackType) {
    case "CORRECT":
      return theme.feedbackConfig?.state?.correct?.title?.text || "정답입니다!";
    case "INCORRECT":
      return theme.feedbackConfig?.state?.incorrect?.title?.text || "다시 생각해보세요.";
    case "SOLUTION":
      return theme.feedbackConfig?.state?.explanation?.title?.text || "해설";
    case "HINT":
      return theme.feedbackConfig?.state?.incorrect?.title?.text || "다시 생각해보세요.";
    default:
      return "정답입니다!";
  }
}
