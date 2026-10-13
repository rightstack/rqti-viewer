/** text-entry 응시 입력 상한. XML maxlength가 더 작으면 그 값을 쓴다. */
export const TEXT_ENTRY_MAX_LENGTH = 100;

/**
 * XML `maxlength`가 1 이상 100 미만이면 그 값, 없거나 100 이상이면 100.
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

export const isFractionPartId = (id: string): boolean => /^FRACTION_.+_[WND]$/.test(id);

export const getTextEntryCharCount = (value: string): number =>
  Math.max(1, Array.from(value).length);
