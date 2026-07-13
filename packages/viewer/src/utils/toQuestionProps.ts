import type { QuestionProps } from "../Question";
import type { FeedbackItem } from "../types/question";
import type { QuestionFeedback, QuestionItem } from "../types/questionItem";

/**
 * `toQuestionProps` 반환값 — Question에 바로 spread 가능.
 * mode는 `"preview"`로 고정.
 * showInlineFeedback은 Question 기본값(false)을 따름 — 필요 시 호출측에서 덮어쓴다.
 */
export type QuestionItemProps = Pick<
  QuestionProps,
  | "data"
  | "type"
  | "mode"
  | "itemKey"
  | "correctAnswers"
  | "feedbacks"
> & {
  mode: "preview";
};

function mapFeedbacks(feedbacks: QuestionFeedback[]): FeedbackItem[] {
  return [...feedbacks]
    .sort((a, b) => a.displayOrder - b.displayOrder)
    .map((f) => ({
      type: f.feedbackType,
      typeLabel: f.feedbackTypeLabel,
      title: f.title,
      content: f.content,
    }));
}

/**
 * 상세 API 응답(`QuestionItem`) → `<Question {...props} />`용 props.
 *
 * @example
 * ```tsx
 * const item = await res.json() as QuestionItem;
 * <Question theme="daldal" {...toQuestionProps(item)} />
 * // 인라인 피드백이 필요하면:
 * <Question theme="daldal" {...toQuestionProps(item)} showInlineFeedback />
 * ```
 */
export function toQuestionProps(item: QuestionItem): QuestionItemProps {
  return {
    data: item.qtiXml,
    type: item.type,
    mode: "preview",
    itemKey: item.qtiIdentifier,
    correctAnswers: item.correctAnswer ?? undefined,
    feedbacks: mapFeedbacks(item.feedbacks ?? []),
  };
}
