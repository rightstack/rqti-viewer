/** 전달 계약: `\inputblank{RESPONSE_N}` 또는 `\inputblank{RESPONSE_N}{W}` */
export const INPUTBLANK_RE = /\\inputblank\{([A-Za-z][A-Za-z0-9_]*)\}(?:\{(\d+)\})?/g;
/** `{{RESPONSE_N}}` 또는 `{{RESPONSE_N}{W}}` — 기존 뷰어 token */
export const PLACEHOLDER_RE = /\{\{([A-Za-z][A-Za-z0-9_]*)\}(?:\{(\d+)\})?\}/g;
const STANDALONE_BLANK_RE = new RegExp(`^(?:${INPUTBLANK_RE.source}|${PLACEHOLDER_RE.source})+$`);

export const MATH_BLANK_SLOT_CLASS = "qti-ext-mjx-blank-slot";

export function mathBlankSlotId(instanceId: string, responseId: string): string {
  return `qti-math-blank-${instanceId}-${responseId}`;
}

/** `\cssId` / HTML id에 넣을 수 있는 토큰만 남긴다. */
export function sanitizeMathBlankInstanceToken(value: string): string {
  return value.replace(/[^A-Za-z0-9_-]/g, "");
}

/**
 * 조판 슬롯 instanceId.
 * 본문과 정답 미리보기(`answerKeyPreview`)가 같이 있으면 parse `index`만으로는
 * `#qti-math-blank-{index}-{RESPONSE}` 가 겹친다. `\cancel{\inputblank{…}}` 처럼
 * 식 경로를 탈 때 MathJax `\cssId` 충돌을 막는다.
 */
export function buildMathBlankInstanceId(options: {
  index: number;
  itemKey?: string;
  answerKeyPreview?: boolean;
  uid?: string;
  responseId?: string;
}): string {
  const parts = [
    options.answerKeyPreview ? "ak" : "q",
    sanitizeMathBlankInstanceToken(options.itemKey ?? "") || "item",
    sanitizeMathBlankInstanceToken(options.uid ?? ""),
    String(options.index),
    sanitizeMathBlankInstanceToken(options.responseId ?? ""),
  ].filter((part) => part !== "");
  return parts.join("-");
}

export function parseWidthToken(raw: string | undefined): number | undefined {
  if (!raw) return undefined;
  const ch = Number.parseInt(raw, 10);
  return Number.isFinite(ch) && ch > 0 ? ch : undefined;
}

/** CSS `--qti-math-blank-size`. size 1 최소 폭. */
const CSS_MIN_SLOT_EM = 2;
/** size가 1 오를 때마다 더하는 폭. */
const SLOT_SIZE_STEP_EM = 1;
export const MATH_BLANK_DISPLAY_SCALE: number = 0.85;

function actualMinSlotEm(widthCh: number | undefined): number {
  const ch = widthCh !== undefined && widthCh > 0 ? widthCh : 1;
  return CSS_MIN_SLOT_EM + Math.max(0, ch - 1) * SLOT_SIZE_STEP_EM;
}

export function markerSlotWidthEm(widthCh: number | undefined): string {
  return `${actualMinSlotEm(widthCh).toFixed(1)}em`;
}

export function markerSlotWidthPx(widthCh: number | undefined, fontSizePx: number): number {
  const emPx = Number.isFinite(fontSizePx) && fontSizePx > 0 ? fontSizePx : 16;
  return actualMinSlotEm(widthCh) * emPx;
}

/** 조판된 읽기 전용 값의 실측 칸 크기. LaTeX 원문 길이가 아니라 화면 폭이다. */
export type SlotContentEm = {
  widthEm: number;
  heightEm: number;
};

function slotCommand(
  instanceId: string,
  id: string,
  widthCh: number | undefined,
  scale = 1,
  measured?: SlotContentEm
): string {
  const widthEm = (measured?.widthEm ?? actualMinSlotEm(widthCh) * scale).toFixed(2);
  const heightEm = (measured?.heightEm ?? CSS_MIN_SLOT_EM * scale).toFixed(2);
  return `\\cssId{${mathBlankSlotId(instanceId, id)}}{\\class{${MATH_BLANK_SLOT_CLASS}}{\\Rule{${widthEm}em}{${heightEm}em}{0em}}}`;
}

/** 수식 구조 없이 빈칸 토큰만 있으면 기존 상자 UI를 쓴다. */
export function isStandaloneBlankLatex(latex: string): boolean {
  return STANDALONE_BLANK_RE.test(latex.trim());
}

/** 빈칸을 뺀 뒤 수식 조각이 남으면 식 통째 경로. */
export function hasFormulaContext(latex: string): boolean {
  INPUTBLANK_RE.lastIndex = 0;
  PLACEHOLDER_RE.lastIndex = 0;
  const leftover = latex.replace(INPUTBLANK_RE, "").replace(PLACEHOLDER_RE, "").trim();
  return leftover !== "";
}

export type TypesetSlotLatex = {
  latex: string;
  ids: string[];
};

/** 빈칸 토큰을 조판 자리(`\\cssId`)로 바꾸고, 등장 순 ID를 반환한다. */
export function toTypesetSlotLatex(
  latex: string,
  instanceId: string,
  scale = 1,
  ignoreDeclaredWidth = false,
  slotContentEm?: Record<string, SlotContentEm>
): TypesetSlotLatex {
  const ids: string[] = [];
  const seen = new Set<string>();
  const remember = (id: string) => {
    if (seen.has(id)) return;
    seen.add(id);
    ids.push(id);
  };
  const replaceSlot = (_match: string, id: string, width: string | undefined) => {
    remember(id);
    const declared = ignoreDeclaredWidth ? undefined : parseWidthToken(width);
    // `{{ID}{N}}`의 첫 `{`는 `\overline{…}` 인자 괄호이기도 하다. 그룹을 유지해야 윗줄이 남는다.
    return `{${slotCommand(instanceId, id, declared, scale, slotContentEm?.[id])}}`;
  };

  INPUTBLANK_RE.lastIndex = 0;
  PLACEHOLDER_RE.lastIndex = 0;
  let out = latex.replace(INPUTBLANK_RE, replaceSlot);
  PLACEHOLDER_RE.lastIndex = 0;
  out = out.replace(PLACEHOLDER_RE, replaceSlot);
  return { latex: out, ids };
}
