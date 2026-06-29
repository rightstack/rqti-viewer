import type React from "react";

const TEXT_ENTRY_MIN_WIDTH = 8;
const TEXT_ENTRY_MAX_WIDTH = 15;
const TEXT_ENTRY_FALLBACK_WIDTH = 10;

export const getTextEntryWidth = (expectedLength?: number): number => {
  if (typeof expectedLength !== "number" || Number.isNaN(expectedLength) || expectedLength <= 0) {
    return TEXT_ENTRY_FALLBACK_WIDTH;
  }

  return Math.min(TEXT_ENTRY_MAX_WIDTH, Math.max(TEXT_ENTRY_MIN_WIDTH, expectedLength));
};

export const getTextEntryWidthStyle = (
  expectedLength?: number
): React.CSSProperties & Record<"--qti-text-entry-width", string> => ({
  "--qti-text-entry-width": `${getTextEntryWidth(expectedLength)}ch`,
});

export const TEXT_ENTRY_WIDTH_BOUNDS = {
  min: TEXT_ENTRY_MIN_WIDTH,
  max: TEXT_ENTRY_MAX_WIDTH,
  fallback: TEXT_ENTRY_FALLBACK_WIDTH,
};
