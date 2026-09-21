import type { CSSProperties } from "react";
import { isMathResponseId } from "../../utils";
import { stripOuterMathDelimiters } from "../../utils/latex";
import {
  INPUTBLANK_RE,
  PLACEHOLDER_RE,
  hasFormulaContext,
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

/** `__label` 우선. 수식 문맥의 직계 텍스트는 식 미리보기이므로 라벨이 아니다. */
export function readDisplayBlankLabels(element: Element): DisplayBlankLabel[] {
  const fromClass = Array.from(element.querySelectorAll(`.${DISPLAY_LABEL_CLASS}`)).map((node) => {
    const id = node.getAttribute("data-response-identifier")?.trim();
    return {
      id: id || undefined,
      text: (node.textContent ?? "").trim(),
    };
  });
  if (fromClass.length > 0) return fromClass;

  const latex = element.getAttribute("data-latex")?.trim() ?? "";
  if (hasFormulaContext(latex)) return [];

  const ownText = Array.from(element.childNodes)
    .filter((node) => node.nodeType === Node.TEXT_NODE)
    .map((node) => (node.textContent ?? "").trim())
    .filter(Boolean)
    .join(" ");
  return ownText ? [{ text: ownText }] : [];
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

function isAnswerRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

/**
 * QMS/응시 응답: 문자열, `string[]`, `{ values }`, `{ value }`, `{ answers: [{ value }] }`.
 * 객체는 예전에 빈 칸으로 버려졌다.
 */
export function coerceResponseText(raw: unknown): string {
  if (raw === undefined || raw === null) return "";
  if (typeof raw === "string" || typeof raw === "number") return String(raw);
  if (Array.isArray(raw)) return coerceResponseText(raw[0]);
  if (!isAnswerRecord(raw)) return "";
  if ("values" in raw) return coerceResponseText(raw.values);
  if ("value" in raw) return coerceResponseText(raw.value);
  if (Array.isArray(raw.answers)) return coerceResponseText(raw.answers[0]);
  return "";
}

export function getResponseRawString(map: Record<string, unknown> | undefined, id: string): string {
  if (!map) return "";
  return coerceResponseText(map[id]);
}

/** 본문은 responses. 정답영역만 correctAnswers. PCI 부모 배열·record·answers 객체를 RESPONSE_N으로 편평. */
export function buildMathBlankAnswerSource(
  answerKeyPreview: boolean,
  correctAnswers: Record<string, unknown> | undefined,
  responses: Record<string, unknown> | undefined,
  responseId: string | undefined,
  latex: string
): Record<string, unknown> | undefined {
  const useAnswerKey =
    answerKeyPreview && !!correctAnswers && Object.keys(correctAnswers).length > 0;
  const raw = useAnswerKey ? correctAnswers : responses;
  if (!raw) return undefined;

  const flat: Record<string, unknown> = { ...raw };
  const blankIds = extractResponseIds(latex);
  const needsParent = blankIds.some((id) => coerceResponseText(flat[id]) === "");
  if (!needsParent) return flat;

  const parentValue = responseId ? raw[responseId] : undefined;
  if (Array.isArray(parentValue)) {
    for (let i = 0; i < Math.min(parentValue.length, blankIds.length); i++) {
      if (coerceResponseText(flat[blankIds[i]]) === "") flat[blankIds[i]] = parentValue[i];
    }
  } else if (isAnswerRecord(parentValue)) {
    for (const id of blankIds) {
      if (coerceResponseText(flat[id]) === "" && id in parentValue) {
        flat[id] = parentValue[id];
      }
    }
    if (Array.isArray(parentValue.values)) {
      for (let i = 0; i < Math.min(parentValue.values.length, blankIds.length); i++) {
        if (coerceResponseText(flat[blankIds[i]]) === "") {
          flat[blankIds[i]] = parentValue.values[i];
        }
      }
    }
  }
  return flat;
}

export function getResponseString(map: Record<string, unknown> | undefined, id: string): string {
  return stripOuterMathDelimiters(getResponseRawString(map, id));
}

function toVcqSubmitValue(raw: unknown): string {
  if (raw === undefined || raw === null) return "";
  const text = Array.isArray(raw)
    ? String(raw[0] ?? "")
    : typeof raw === "string"
      ? raw
      : String(raw);
  return text.trim() === "" ? "" : text;
}

/** VCQ 제출: XML 응답 칸은 모두 키를 넣고, 비어 있으면 "". */
export function buildVcqSubmitResponse(
  xml: string | undefined,
  responses: Record<string, unknown> | undefined
): Record<string, string> {
  const submitted: Record<string, string> = {};
  for (const id of extractMathBlankIdsFromItemXml(xml ?? "")) {
    submitted[id] = toVcqSubmitValue(responses?.[id]);
  }
  return submitted;
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
  answerKey?: boolean;
  allowEmptySelected?: boolean;
}): string {
  if (options.answerKey) return "qti-ext-text-entry-input-correct";

  if (options.isSubmit && options.correctAnswer !== undefined) {
    const ok = options.value === options.correctAnswer;
    return ok ? "qti-ext-text-entry-input-correct" : "qti-ext-text-entry-input-incorrect";
  }

  const emptyIsSelected = options.allowEmptySelected === true && options.value === "";
  return options.value !== "" || emptyIsSelected ? "qti-ext-text-entry-input-focus" : "";
}
