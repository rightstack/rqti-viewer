import type { ItemsType } from "../constants/itemType";
import type { ResponseValue } from "./question";

/**
 * QMS Viewer Preview API의 editorJson 노드 (Plate 계열).
 * 뷰어는 `content` HTML을 렌더하므로 editorJson은 타입만 보존한다.
 */
export interface ViewerPreviewEditorNode {
  id?: string;
  type?: string;
  text?: string;
  children?: ViewerPreviewEditorNode[];
  [key: string]: unknown;
}

/**
 * QMS Viewer Preview API의 feedbacks[] 항목.
 * @see GET /api/v3/viewer/preview/{qtiIdentifier}
 */
export interface ViewerPreviewFeedback {
  id: number;
  assessmentId: number;
  feedbackType: string;
  feedbackTypeLabel: string;
  title: string;
  editorJson: ViewerPreviewEditorNode[];
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
 * QMS Viewer Preview API 응답 본문.
 * 현재 뷰어 연동은 `mode="preview"`(리뷰)로 고정해 사용한다.
 */
export interface ViewerPreviewItem {
  id: number;
  qtiIdentifier: string;
  title: string;
  type: ItemsType;
  qtiXml: string;
  correctAnswer: Record<string, ResponseValue> | null;
  settings: unknown | null;
  feedbacks: ViewerPreviewFeedback[];
}
