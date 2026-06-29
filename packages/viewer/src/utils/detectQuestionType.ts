import { ITEM_TYPE as QUESTION_TYPE } from "../constants/itemType";

const TFQ_IDENTIFIERS = ["CHOICE_O", "CHOICE_X"] as const;

/**
 * qti-choice-interaction에서 TFQ(True/False Question)를 감지하는 함수
 * - simple-choice 2개, identifier가 CHOICE_O, CHOICE_X (텍스트/이미지 무관)
 */
export const isTrueFalseQuestion = (element: Element): boolean => {
  const choices = element.querySelectorAll("qti-simple-choice");
  if (choices.length !== 2) return false;

  const identifiers = Array.from(choices).map((c) => (c.getAttribute("identifier") ?? "").trim());
  const idSet = new Set(identifiers);
  return idSet.has(TFQ_IDENTIFIERS[0]) && idSet.has(TFQ_IDENTIFIERS[1]);
};

/**
 * qti-choice-interaction에서 questionType을 추론하는 함수
 *
 * @param element qti-choice-interaction 요소
 * @param explicitQuestionType 외부에서 명시적으로 전달된 questionType (우선순위 높음)
 * @returns 추론된 questionType
 */
export const inferChoiceQuestionType = (
  element: Element,
  explicitQuestionType?: keyof typeof QUESTION_TYPE
): keyof typeof QUESTION_TYPE => {
  // 외부에서 명시적으로 전달된 타입이 있으면 우선 사용
  if (explicitQuestionType) {
    return explicitQuestionType;
  }

  const maxChoices = Number(element.getAttribute("max-choices")) || 1;
  const isMultiple = maxChoices > 1;

  // 다중 선택이면 MCQ
  if (isMultiple) {
    return QUESTION_TYPE.MCQ as keyof typeof QUESTION_TYPE;
  }

  // 단일 선택이면 TFQ인지 확인
  if (isTrueFalseQuestion(element)) {
    return QUESTION_TYPE.TFQ as keyof typeof QUESTION_TYPE;
  }

  // 기본값은 SCQ
  return QUESTION_TYPE.SCQ as keyof typeof QUESTION_TYPE;
};
