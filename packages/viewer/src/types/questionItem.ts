import type { ItemsType } from "../constants/itemType";
import type { ResponseValue } from "./question";

/**
 * 문항 상세 API의 editorJson 노드 (Plate 계열).
 * 뷰어는 `content` HTML을 렌더하므로 editorJson은 타입만 보존한다.
 */
export interface QuestionEditorNode {
  id?: string;
  type?: string;
  text?: string;
  children?: QuestionEditorNode[];
  [key: string]: unknown;
}

/**
 * 문항 상세 API의 feedbacks[] 항목.
 * @see GET /api/v3/viewer/preview/{qtiIdentifier}
 */
export interface QuestionFeedback {
  id: number;
  assessmentId: number;
  feedbackType: string;
  feedbackTypeLabel: string;
  title: string;
  editorJson: QuestionEditorNode[];
  content: string;
  conditionPresetId: string | null;
  conditionPresetName: string | null;
  customCondition: string | null;
  effectiveCondition: string;
  displayOrder: number;
  createdAt: string;
  updatedAt: string;
}

/**
 * 문항 상세 API 응답 본문.
 * `toQuestionProps`로 Question에 전달할 props로 변환한다.
 */
export interface QuestionItem {
  id: number;
  qtiIdentifier: string;
  title: string;
  type: ItemsType;
  qtiXml: string;
  correctAnswer: Record<string, ResponseValue> | null;
  settings: unknown | null;
  feedbacks: QuestionFeedback[];
}
