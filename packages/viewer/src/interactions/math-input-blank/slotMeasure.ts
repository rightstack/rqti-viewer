export function readBoxExtras(style: CSSStyleDeclaration) {
  const padX = parseFloat(style.paddingLeft || "0") + parseFloat(style.paddingRight || "0");
  const padY = parseFloat(style.paddingTop || "0") + parseFloat(style.paddingBottom || "0");
  const borderX =
    parseFloat(style.borderLeftWidth || "0") + parseFloat(style.borderRightWidth || "0");
  const borderY =
    parseFloat(style.borderTopWidth || "0") + parseFloat(style.borderBottomWidth || "0");
  return { padX, padY, borderX, borderY };
}

/** 조판 전 LaTeX 원문/스트레치 폭은 무시하고, 렌더된 수식 또는 일반 텍스트만 잰다. */
export function measureDisplayContent(label: HTMLElement | null): { w: number; h: number } {
  if (!label) return { w: 0, h: 0 };
  const hasMathHost = !!label.querySelector(".qti-ext-mathfield, mjx-container");
  const typeset = label.querySelector<HTMLElement>("mjx-math");
  if (hasMathHost && !typeset) return { w: 0, h: 0 };
  const rect = (typeset ?? label).getBoundingClientRect();
  return { w: rect.width, h: rect.height };
}
