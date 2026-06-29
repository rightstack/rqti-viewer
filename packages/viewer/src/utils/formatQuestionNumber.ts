/**
 * 문항 번호 포맷 (접두사 + 자리수 맞춤 숫자 + 접미사)
 */
export function formatQuestionNumber(
  index: number,
  digits: number | string = 1,
  prefix = "",
  suffix = ""
): string {
  const d = typeof digits === "string" ? parseInt(digits, 10) : digits;
  const n = Number.isFinite(d) && d >= 1 ? d : 1;
  const number = String(index).padStart(n, "0");
  return `${prefix}${number}${suffix}`;
}
