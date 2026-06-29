/** QTI 문항 유형 식별자 */
export const ITEM_TYPE = {
  SCQ: "scq",
  MCQ: "mcq",
  TFQ: "tfq",
  GCQ: "gcq",
  ESSAY: "essay",
  SRQ: "srq",
  CLOZE: "cloze",
  DDQ: "ddq",
  HTQ: "htq",
  GMQ: "gmq",
  MATCH: "match",
  MATRIX: "matrix",
  ORDER: "order",
  DRAWING: "drawing",
  SLIDER: "slider",
  UPLOAD: "upload",
} as const;

export type ItemsType = (typeof ITEM_TYPE)[keyof typeof ITEM_TYPE];
