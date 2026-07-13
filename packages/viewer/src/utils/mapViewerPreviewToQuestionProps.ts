import type { QuestionProps } from "../Question";
import type { FeedbackItem } from "../types/question";
import type { ViewerPreviewFeedback, ViewerPreviewItem } from "../types/preview";

/**
 * Preview API → Question props.
 * mode는 preview로 고정한다.
 */
export type ViewerPreviewQuestionProps = Pick<
  QuestionProps,
  | "data"
  | "type"
  | "mode"
  | "itemKey"
  | "correctAnswers"
  | "feedbacks"
  | "showInlineFeedback"
> & {
  mode: "preview";
};

function mapPreviewFeedbacks(feedbacks: ViewerPreviewFeedback[]): FeedbackItem[] {
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
 * Viewer Preview API 응답을 Question props로 변환한다.
 * - mode: 항상 `"preview"`
 * - showInlineFeedback: true (정답·피드백 인라인 표시)
 */
export function mapViewerPreviewToQuestionProps(
  item: ViewerPreviewItem,
): ViewerPreviewQuestionProps {
  return {
    data: item.qtiXml,
    type: item.type,
    mode: "preview",
    itemKey: item.qtiIdentifier,
    correctAnswers: item.correctAnswer ?? undefined,
    feedbacks: mapPreviewFeedbacks(item.feedbacks ?? []),
    showInlineFeedback: true,
  };
}
