/**
 * qti-list-style-type-* → 순번 라벨 변환.
 *
 * 저작도구(labelUtils.getChoiceLabel)에서 사용하는 라벨 스타일만 지원한다.
 *  - number(decimal)             → "1."
 *  - number_circle(circled)      → "①"
 *  - english(lower-alpha)        → "a." (26 초과 시 "aa.")
 *  - english_upper(upper-alpha)  → "A." (26 초과 시 "AA.")
 *  - korean_consonant(hangul-consonant)             → "ㄱ."
 *  - korean_consonant_paren(hangul-consonant-paren) → "ㄱ)"
 *  - korean_syllable(hangul-syllable)               → "가."
 *  - none → ""
 *
 * @see assets/styles/qti-ext.css @counter-style (circled_number, hangul-*)
 */

/** 숫자 원문자 (@counter-style circled_number) */
const NUMBER_CIRCLE = ["①", "②", "③", "④", "⑤", "⑥", "⑦", "⑧", "⑨", "⑩"] as const;

/** 한글 자음 (@counter-style hangul-consonant) */
const KOREAN_CONSONANTS = [
  "ㄱ", "ㄴ", "ㄷ", "ㄹ", "ㅁ", "ㅂ", "ㅅ", "ㅇ", "ㅈ", "ㅊ", "ㅋ", "ㅌ", "ㅍ", "ㅎ",
] as const;

/** 한글 음절 (@counter-style hangul-syllable-dot) */
const KOREAN_SYLLABLES = [
  "가", "나", "다", "라", "마", "바", "사", "아", "자", "차", "카", "타", "파", "하",
] as const;

/** 1-based 순번을 알파벳 시퀀스로 (1→a, 26→z, 27→aa …). */
function toSequenceAlpha(oneBased: number, baseCharCode: number): string {
  let s = "";
  let n = oneBased;
  while (n > 0) {
    n -= 1;
    s = String.fromCharCode(baseCharCode + (n % 26)) + s;
    n = Math.floor(n / 26);
  }
  return s;
}

/**
 * 1-based 순번을 list-style-type에 맞는 라벨로 변환.
 * - "none" → 빈 문자열
 * - 미지정/미지원 타입 → decimal("1.")로 폴백
 * - 영문은 26개를 넘으면 aa, bb 식으로 이어진다
 */
export function getListStyleLabel(listStyleType: string | null | undefined, oneBased: number): string {
  if (oneBased < 1) return "";
  const i = oneBased;
  const idx = i - 1;

  switch (listStyleType) {
    case "none":
      return "";
    case "circled":
      return NUMBER_CIRCLE[idx] ?? String(i);
    case "lower-alpha":
      return `${toSequenceAlpha(i, 97)}.`;
    case "upper-alpha":
      return `${toSequenceAlpha(i, 65)}.`;
    case "hangul-consonant":
      return `${KOREAN_CONSONANTS[idx] ?? String(i)}.`;
    case "hangul-consonant-paren":
      return `${KOREAN_CONSONANTS[idx] ?? String(i)})`;
    case "hangul-syllable":
      return `${KOREAN_SYLLABLES[idx] ?? String(i)}.`;
    case "decimal":
    default:
      return `${i}.`;
  }
}
