/**
 * 문자열이 LaTeX 수식인지 판별.
 * `\triangle`, `\frac` 같은 백슬래시 명령 또는 이스케이프되지 않은 `$`가 있으면 수식.
 */
export const isMathLatexAnswer = (s: string): boolean =>
  /\\[a-zA-Z]/.test(s) || /(?<!\\)\$/.test(s);

/** MATH_RESPONSE_N 형태의 ID는 값을 항상 MathJax로 렌더해야 한다 */
export function isMathResponseId(id: string): boolean {
  return /^MATH_/i.test(id);
}
