import { HIGH_SCHOOL_MATH_KEYS } from "./highSchoolSymbols";
import { MIDDLE_SCHOOL_MATH_KEYS } from "./middleSchoolSymbols";
import { type MathKey, type MathTab } from "./mathSymbols";
import type { MathLevel } from "./mathLevels";

/** 키 세트의 명령어 → 탭 매핑을 만든다. 같은 명령어는 먼저 나온 것 우선. */
function buildCommandToTab(
  keys: readonly MathKey[],
): Record<string, MathTab> {
  const map: Record<string, MathTab> = {};
  for (const item of keys) {
    if (map[item.command] === undefined) map[item.command] = item.tab;
  }
  // 동의 명령어: 기획 표는 \dfrac, 저장값은 \frac 일 수 있음 (수 표현은 기본 탭)
  map.frac = "basic";
  map.begin = "basic";
  return map;
}

/** 레벨별 명령어→탭 매핑(각 레벨의 키 세트로 구성). */
const COMMAND_TO_TAB_BY_LEVEL: Record<
  MathLevel,
  Record<string, MathTab>
> = {
  middle: buildCommandToTab(MIDDLE_SCHOOL_MATH_KEYS),
  high: buildCommandToTab(HIGH_SCHOOL_MATH_KEYS),
};

/**
 * 정답 LaTeX의 첫 명령어.
 * `\dfrac`, `\overline`, `\begin{cases}` → dfrac / overline / cases
 * `^`, `_`, `=`, `<` 등 기호와 알파벳 한 글자도 포함한다.
 */
export function extractFirstLatexCommand(latex: string): string | null {
  const trimmed = latex
    .trim()
    .replace(/^\$+|\\\[|\\\(/g, "")
    .trim();
  if (!trimmed) return null;

  const begin = trimmed.match(/^\\begin\{([a-zA-Z*]+)\}/);
  if (begin) return begin[1];

  const command = trimmed.match(/^\\([a-zA-Z]+)/);
  if (command) return command[1];

  const escaped = trimmed.match(/^\\([^a-zA-Z\s])/);
  if (escaped) return escaped[1];

  const letter = trimmed.match(/^([a-z])/);
  if (letter) return letter[1];

  const symbol = trimmed.match(/^([=<>^_])/);
  if (symbol) return symbol[1];

  return null;
}

/**
 * 정답 입력창을 열 때 첫 명령어로 탭을 연다. (학생용 UX)
 * 해당 레벨(중등/고등)의 키 세트에서 만든 매핑으로 탭을 고르며, 없으면 기본 탭.
 */
export function resolveMathTab(
  latex: string | null | undefined,
  level: MathLevel = "middle",
): MathTab {
  if (!latex?.trim()) return "basic";
  const command = extractFirstLatexCommand(latex);
  if (!command) return "basic";
  return COMMAND_TO_TAB_BY_LEVEL[level][command] ?? "basic";
}

export function firstCorrectAnswerLatex(
  correctAnswer: string | Record<string, unknown> | null | undefined,
): string | undefined {
  if (typeof correctAnswer === "string") return correctAnswer;
  if (!correctAnswer || typeof correctAnswer !== "object") return undefined;
  for (const value of Object.values(correctAnswer)) {
    if (typeof value === "string" && value.trim()) return value;
    if (Array.isArray(value) && typeof value[0] === "string") return value[0];
  }
  return undefined;
}
