// QTI interaction 태그 목록
export const QTI_INTERACTION_TAGS = [
  "qti-text-entry-interaction",
  "qti-choice-interaction",
  "qti-match-interaction",
  "qti-inline-choice-interaction",
  "qti-order-interaction",
  "qti-extended-text-interaction",
  "qti-upload-interaction",
  "qti-gap-match-interaction",
] as const;

export const isInteraction = (tagName: string): boolean =>
  QTI_INTERACTION_TAGS.includes(tagName.toLowerCase() as (typeof QTI_INTERACTION_TAGS)[number]);
