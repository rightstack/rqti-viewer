import { stripOuterMathDelimiters } from "../../utils/latex";

/** text-entry 응시 입력 상한. XML maxlength가 더 작으면 그 값을 쓴다. */
export const TEXT_ENTRY_MAX_LENGTH = 15;

function normalizeTextEntryAnswer(raw: unknown): string {
  if (raw === undefined || raw === null) return "";
  return stripOuterMathDelimiters(String(raw)).trim();
}

/** 칸 하나의 입력과 정답. `$...$` 와 수식 본문은 같은 값으로 본다. 배열이면 하나라도 맞으면 정답. */
export function textEntryValueMatches(value: string, correct: unknown): boolean {
  const expected = Array.isArray(correct) ? correct : [correct];
  const actual = normalizeTextEntryAnswer(value);
  return expected.some((candidate) => normalizeTextEntryAnswer(candidate) === actual);
}

/**
 * XML `maxlength`가 1 이상 15 미만이면 그 값, 없거나 15 이상이면 15.
 * 0 이하는 없는 값으로 본다.
 */
export function resolveTextEntryMaxLength(xmlMaxLength: number | undefined): number {
  if (
    xmlMaxLength !== undefined &&
    Number.isFinite(xmlMaxLength) &&
    xmlMaxLength >= 1 &&
    xmlMaxLength < TEXT_ENTRY_MAX_LENGTH
  ) {
    return xmlMaxLength;
  }
  return TEXT_ENTRY_MAX_LENGTH;
}

/**
 * 칸 하나에 인정 문자열이 여럿이면 첫 번째만 쓴다.
 * 줄바꿈은 입력칸과 같이 뺀다.
 */
export function firstTextEntryAnswer(raw: unknown): string {
  const candidate: unknown = Array.isArray(raw) ? (raw as unknown[])[0] : raw;
  if (
    typeof candidate !== "string" &&
    typeof candidate !== "number" &&
    typeof candidate !== "boolean"
  ) {
    return "";
  }
  return String(candidate).replace(/[\r\n]/g, "");
}

export const isFractionPartId = (id: string): boolean => /^FRACTION_.+_[WND]$/.test(id);

export const getTextEntryCharCount = (value: string): number =>
  Math.max(1, Array.from(value).length);
