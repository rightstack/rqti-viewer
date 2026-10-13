export function readBoxExtras(style: CSSStyleDeclaration) {
  const padX = parseFloat(style.paddingLeft || "0") + parseFloat(style.paddingRight || "0");
  const padY = parseFloat(style.paddingTop || "0") + parseFloat(style.paddingBottom || "0");
  const borderX =
    parseFloat(style.borderLeftWidth || "0") + parseFloat(style.borderRightWidth || "0");
  const borderY =
    parseFloat(style.borderTopWidth || "0") + parseFloat(style.borderBottomWidth || "0");
  return { padX, padY, borderX, borderY };
}

/** 칸에 묶인 scrollWidth가 아니라 사이저 텍스트 고유 폭. 짧아지면 줄어든다. */
export function measureSizerContentWidth(sizer: HTMLElement | null): number {
  if (!sizer) return 0;
  const range = document.createRange();
  range.selectNodeContents(sizer);
  const width = range.getBoundingClientRect().width;
  range.detach();
  return width;
}

let measureCanvas: HTMLCanvasElement | null = null;

function textMeasureContext(): CanvasRenderingContext2D | null {
  measureCanvas ??= document.createElement("canvas");
  return measureCanvas.getContext("2d");
}

function canvasFont(style: CSSStyleDeclaration): string {
  const shorthand = style.font.trim();
  if (shorthand) return shorthand;
  const italic = style.fontStyle && style.fontStyle !== "normal" ? `${style.fontStyle} ` : "";
  const weight = style.fontWeight && style.fontWeight !== "normal" ? `${style.fontWeight} ` : "";
  return `${italic}${weight}${style.fontSize || "16px"} ${style.fontFamily || "serif"}`;
}

export function measureTextContentWidth(styleSource: HTMLElement | null, text: string): number {
  if (!styleSource || text === "") return 0;
  const ctx = textMeasureContext();
  if (!ctx) return 0;
  ctx.font = canvasFont(getComputedStyle(styleSource));
  return ctx.measureText(text).width;
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
