/**
 * MathField 내부 텍스트를 `parseTextWithLaTeX`가 인식하도록 구분자로 감쌉니다.
 * `parseHtmlElement` / `renderQtiNode`의 qti-ext-mathfield 분기와 동일 규칙입니다.
 */
export function wrapMathFieldTextForInlineLatex(text: string): string {
  const trimmed = text.trim();
  if (!trimmed) return "";
  const alreadyDelimited =
    (trimmed.startsWith("\\(") && trimmed.endsWith("\\)")) ||
    (trimmed.startsWith("\\[") && trimmed.endsWith("\\]")) ||
    (trimmed.startsWith("$$") && trimmed.endsWith("$$")) ||
    (trimmed.startsWith("$") && trimmed.endsWith("$") && trimmed.length > 1);
  return alreadyDelimited ? trimmed : `$${trimmed}$`;
}
