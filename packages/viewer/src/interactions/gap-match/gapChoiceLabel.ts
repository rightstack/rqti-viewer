/** GMQ 선택지 레이블 class. `none`과 알 수 없는 값은 미표시 */
const GAP_CHOICE_LABEL_CLASS_PREFIX = "qti-ext-gap-label-";

const NUMBER_CIRCLE = ["①", "②", "③", "④", "⑤", "⑥", "⑦", "⑧", "⑨", "⑩"] as const;

const KOREAN_CONSONANTS = [
  "ㄱ",
  "ㄴ",
  "ㄷ",
  "ㄹ",
  "ㅁ",
  "ㅂ",
  "ㅅ",
  "ㅇ",
  "ㅈ",
  "ㅊ",
  "ㅋ",
  "ㅌ",
  "ㅍ",
  "ㅎ",
] as const;

const KOREAN_SYLLABLES = [
  "가",
  "나",
  "다",
  "라",
  "마",
  "바",
  "사",
  "아",
  "자",
  "차",
  "카",
  "타",
  "파",
  "하",
] as const;

export const GAP_CHOICE_LABEL_TYPES = [
  "number",
  "number_circle",
  "english",
  "english_upper",
  "korean_consonant",
  "korean_consonant_paren",
  "korean_syllable",
] as const;

export type GapChoiceLabelType = (typeof GAP_CHOICE_LABEL_TYPES)[number];

const GAP_CHOICE_LABEL_TYPE_SET = new Set<string>(GAP_CHOICE_LABEL_TYPES);

/**
 * interaction class의 `qti-ext-gap-label-*`를 읽는다.
 * 없거나 `none`이거나 알 수 없는 값이면 null.
 */
export function extractGapChoiceLabelType(className: string): GapChoiceLabelType | null {
  if (!className.trim()) return null;

  for (const token of className.trim().split(/\s+/)) {
    if (!token.startsWith(GAP_CHOICE_LABEL_CLASS_PREFIX)) continue;
    const type = token.slice(GAP_CHOICE_LABEL_CLASS_PREFIX.length);
    if (GAP_CHOICE_LABEL_TYPE_SET.has(type)) return type as GapChoiceLabelType;
    return null;
  }

  return null;
}

/** 0-based 선택지 순번 라벨. 빈 칸 표식과 달리 마침표가 붙는 스타일이 있다. */
export function gapChoiceLabel(style: GapChoiceLabelType, index: number): string {
  switch (style) {
    case "number":
      return `${index + 1}.`;
    case "number_circle":
      return NUMBER_CIRCLE[index] || String(index + 1);
    case "korean_consonant":
      return `${KOREAN_CONSONANTS[index] || String(index + 1)}.`;
    case "korean_consonant_paren":
      return `${KOREAN_CONSONANTS[index] || String(index + 1)})`;
    case "korean_syllable":
      return `${KOREAN_SYLLABLES[index] || String(index + 1)}.`;
    case "english":
      return `${String.fromCharCode(97 + index)}.`;
    case "english_upper":
      return `${String.fromCharCode(65 + index)}.`;
  }
}
