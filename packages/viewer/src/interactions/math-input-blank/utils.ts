import type { CSSProperties } from "react";
import { isMathResponseId } from "../../utils";
import {
  INPUTBLANK_RE,
  PLACEHOLDER_RE,
  markerSlotWidthEm,
  parseWidthToken,
} from "./mathBlankLatex";

export { isMathResponseId };

export const MATH_INPUT_BLANK_TYPE = "math-input-blank";

const INPUT_WIDTH_RE = /(?:^|\s)qti-input-width-(\d+)(?:\s|$)/;
const BLANK_RE = new RegExp(`^${PLACEHOLDER_RE.source}`);
const BLANK_INPUTBLANK_RE = new RegExp(`^${INPUTBLANK_RE.source}`);
const DISPLAY_BLANK_CLASSES = ["qti-ext-math-input-blank", "qti-ext-input-blank"] as const;

export type MathBlankSegment =
  | { kind: "latex"; latex: string }
  | { kind: "blank"; id: string; widthCh?: number };

export function findMarkupDiv(element: Element): Element | null {
  return (
    element.querySelector(".qti-ext-math-input-blank") ??
    element.querySelector("qti-interaction-markup > .qti-ext-input-blank") ??
    element.querySelector("qti-interaction-markup > div") ??
    element.querySelector("qti-interaction-markup div")
  );
}

export function isStandaloneMathBlankMarkup(className: string): boolean {
  return className
    .split(/\s+/)
    .some((name) => DISPLAY_BLANK_CLASSES.includes(name as (typeof DISPLAY_BLANK_CLASSES)[number]));
}

export function isMathInputBlankDisplay(className: string): boolean {
  const names = className.split(/\s+/);
  return (
    names.includes("qti-ext-math-input-blank--display") ||
    names.includes("qti-ext-input-blank--display")
  );
}

export type DisplayBlankLabel = {
  id?: string;
  text: string;
};

const DISPLAY_LABEL_CLASS = "qti-ext-input-blank__label";

/** XML의 `__label`만. 없으면 빈칸은 비어 있다. 정답·느슨한 텍스트는 라벨이 아니다. */
export function readDisplayBlankLabels(element: Element): DisplayBlankLabel[] {
  return Array.from(element.querySelectorAll(`.${DISPLAY_LABEL_CLASS}`)).map((node) => {
    const id = node.getAttribute("data-response-identifier")?.trim();
    return {
      id: id || undefined,
      text: (node.textContent ?? "").trim(),
    };
  });
}

export function extractResponseIds(latex: string): string[] {
  const ids: string[] = [];
  const seen = new Set<string>();
  for (const pattern of [INPUTBLANK_RE, PLACEHOLDER_RE]) {
    pattern.lastIndex = 0;
    for (const match of latex.matchAll(pattern)) {
      const id = match[1];
      if (!id || seen.has(id)) continue;
      seen.add(id);
      ids.push(id);
    }
  }
  return ids;
}

export function collectBlankIds(segments: MathBlankSegment[]): string[] {
  const ids: string[] = [];
  const seen = new Set<string>();
  for (const item of segments) {
    if (item.kind !== "blank" || seen.has(item.id)) continue;
    seen.add(item.id);
    ids.push(item.id);
  }
  return ids;
}

/** 응답용 PCI의 data-latex에서만 ID를 모은다. 표시용 markup은 세지 않는다. */
export function extractMathBlankIdsFromItemXml(xml: string): string[] {
  const ids: string[] = [];
  const seen = new Set<string>();
  const pciRe =
    /<qti-portable-custom-interaction\b([^>]*)>([\s\S]*?)<\/qti-portable-custom-interaction>/gi;
  for (const match of xml.matchAll(pciRe)) {
    const attrs = match[1] ?? "";
    const body = match[2] ?? "";
    if (!attrs.includes(MATH_INPUT_BLANK_TYPE) && !body.includes(MATH_INPUT_BLANK_TYPE)) {
      continue;
    }
    const latex = body.match(/data-latex="([^"]*)"/)?.[1] ?? "";
    for (const id of extractResponseIds(latex)) {
      if (seen.has(id)) continue;
      seen.add(id);
      ids.push(id);
    }
  }
  return ids;
}

/** data-latex를 수식 조각 + input 빈칸으로만 나눈다. 분수·지수 자리는 수식 렌더러가 맡는다. */
export function parseMathBlankSegments(latex: string): MathBlankSegment[] {
  const segments: MathBlankSegment[] = [];
  let i = 0;
  let latexBuf = "";

  const flushLatex = () => {
    if (latexBuf === "") return;
    segments.push({ kind: "latex", latex: latexBuf });
    latexBuf = "";
  };

  while (i < latex.length) {
    const rest = latex.slice(i);
    const blank = rest.match(BLANK_RE) ?? rest.match(BLANK_INPUTBLANK_RE);
    if (blank?.[1]) {
      flushLatex();
      segments.push({
        kind: "blank",
        id: blank[1],
        widthCh: parseWidthToken(blank[2]),
      });
      i += blank[0].length;
      continue;
    }
    latexBuf += latex[i];
    i += 1;
  }
  flushLatex();
  return segments;
}

/** 단독 빈칸 최소 폭. 식 통째 슬롯과 같이 size 1 → 2em, 이후 +1em. */
export function getMathBlankWidthStyle(widthCh: number | undefined): CSSProperties | undefined {
  return { minWidth: markerSlotWidthEm(widthCh) };
}

/** markup div class 우선, 없으면 PCI class */
export function extractInputWidthCh(markupClass: string, pciClass: string): number | undefined {
  return parseWidthToken(
    markupClass.match(INPUT_WIDTH_RE)?.[1] ?? pciClass.match(INPUT_WIDTH_RE)?.[1]
  );
}

/** 문자열에 LaTeX 명령어(`\frac` 등)가 포함되어 있는지 검사 */
export function hasLatexCommand(text: string): boolean {
  return /\\[a-zA-Z]/.test(text);
}

export function getResponseString(map: Record<string, unknown> | undefined, id: string): string {
  if (!map) return "";
  const raw = map[id];
  if (raw === undefined || raw === null) return "";
  if (Array.isArray(raw)) return String(raw[0] ?? "").trim();
  if (typeof raw === "string") return raw.trim();
  return String(raw).trim();
}

export type BlankVariant = "text-entry" | "blank-box";

export function getBlankVariantClass(variant: BlankVariant): string {
  return variant === "text-entry"
    ? "qti-ext-text-entry-input pointer-events-none"
    : "qti-ext-input-blank--display";
}

export function getInputBlankStateClass(options: {
  value: string;
  isSubmit?: boolean;
  correctAnswer?: string;
  forceSelected?: boolean;
}): string {
  if (options.forceSelected) return "qti-ext-text-entry-input-focus";

  const classes: string[] = [];
  if (options.value !== "") classes.push("qti-ext-text-entry-input-focus");

  if (options.isSubmit && options.correctAnswer !== undefined) {
    const ok = options.value.trim() === options.correctAnswer.trim();
    classes.push(ok ? "qti-ext-text-entry-input-correct" : "qti-ext-text-entry-input-incorrect");
  }

  return classes.join(" ");
}
