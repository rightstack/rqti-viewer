import type { MathLevel } from "./mathLevels";
import type { MathTab } from "./mathSymbols";

const STORAGE_PREFIX = "rqti:math-keyboard";

export const RECENT_TAB = "recent" as const;

export const MAX_RECENT_KEY_IDS = 20;

export type MathKeyboardTab = MathTab | typeof RECENT_TAB;

export interface MathKeyboardPosition {
  x: number;
  y: number;
}

export interface MathKeyboardHistory {
  recentKeyIds?: string[];
}

export function mathKeyboardHistoryKey(level: MathLevel, historyScope?: string): string {
  return historyScope ? `${STORAGE_PREFIX}:${level}:${historyScope}` : `${STORAGE_PREFIX}:${level}`;
}

function getLocalStorage(): Storage | null {
  try {
    if (typeof localStorage === "undefined") return null;
    return localStorage;
  } catch {
    return null;
  }
}

function sanitizeHistory(raw: unknown): MathKeyboardHistory {
  if (!raw || typeof raw !== "object") return {};
  const value = raw as Record<string, unknown>;
  const history: MathKeyboardHistory = {};
  if (Array.isArray(value.recentKeyIds)) {
    history.recentKeyIds = value.recentKeyIds
      .filter((id): id is string => typeof id === "string" && id.length > 0)
      .slice(0, MAX_RECENT_KEY_IDS);
  }
  return history;
}

export function readMathKeyboardHistory(
  level: MathLevel,
  historyScope?: string
): MathKeyboardHistory {
  const storage = getLocalStorage();
  if (!storage) return {};
  try {
    const raw = storage.getItem(mathKeyboardHistoryKey(level, historyScope));
    if (!raw) return {};
    return sanitizeHistory(JSON.parse(raw));
  } catch {
    return {};
  }
}

export function writeMathKeyboardHistory(
  level: MathLevel,
  history: MathKeyboardHistory,
  historyScope?: string
): void {
  const storage = getLocalStorage();
  if (!storage) return;
  try {
    storage.setItem(
      mathKeyboardHistoryKey(level, historyScope),
      JSON.stringify(sanitizeHistory(history))
    );
  } catch {
    // quota / private mode
  }
}

export function pushRecentKeyId(
  ids: readonly string[],
  id: string,
  max = MAX_RECENT_KEY_IDS
): string[] {
  if (!id) return [...ids].slice(0, max);
  return [id, ...ids.filter((item) => item !== id)].slice(0, max);
}
