export interface MathFieldSelection {
  ranges: Array<[number, number]>;
  direction?: "forward" | "backward" | "none";
}

export interface EditableMathField {
  value: string;
  position: number;
  selection: MathFieldSelection;
  insert: (latex: string, options?: Record<string, unknown>) => void;
  executeCommand: (command: string | [string, ...unknown[]]) => void;
  getValue: (start: number, end: number, format?: string) => string;
}

const DOT_ATOM_RE = /^\\dot\{(?:[^{}]|\\placeholder\{\}|\{\})*\}$/;

const SLOT_COMMANDS = [
  "\\overrightarrow",
  "\\overleftarrow",
  "\\overleftrightarrow",
  "\\overline",
  "\\overset",
  "\\dot",
] as const;

const GUARDED_TOKENS = [
  ...SLOT_COMMANDS,
  "\\begin{cases}",
  "\\equiv",
  "\\sim",
  "\\sslash",
  "\\perp",
  "\\triangle",
  "\\square",
  "\\angle",
  "\\prime",
  "\\circ",
] as const;

function matchingBrace(latex: string, openIndex: number): number {
  if (latex[openIndex] !== "{") return -1;
  let depth = 0;
  for (let i = openIndex; i < latex.length; i++) {
    if (latex[i] === "\\") {
      i += 1;
      continue;
    }
    if (latex[i] === "{") depth += 1;
    else if (latex[i] === "}") {
      depth -= 1;
      if (depth === 0) return i;
    }
  }
  return -1;
}

function matchingCasesEnd(latex: string, beginIndex: number): number {
  const begin = "\\begin{cases}";
  const end = "\\end{cases}";
  let depth = 0;
  for (let i = beginIndex; i < latex.length; i++) {
    if (latex.startsWith(begin, i)) {
      depth += 1;
      i += begin.length - 1;
      continue;
    }
    if (latex.startsWith(end, i)) {
      depth -= 1;
      if (depth === 0) return i;
      i += end.length - 1;
    }
  }
  return -1;
}

function hasGuardedToken(latex: string): boolean {
  return GUARDED_TOKENS.some((token) => {
    let from = 0;
    while (from < latex.length) {
      const at = latex.indexOf(token, from);
      if (at < 0) return false;
      const next = latex[at + token.length] ?? "";
      if (!/[a-zA-Z]/.test(next)) return true;
      from = at + token.length;
    }
    return false;
  });
}

/** 칸 있는 기호 안에 같은 종류의 키가 다시 들어간 경우. */
function isNestedStructure(latex: string): boolean {
  if (/\^\{(?:\\prime|\\circ)\}\^\{(?:\\prime|\\circ)\}/.test(latex)) return true;
  if (/\^\{(?:\\prime|\\circ)(?!\})/.test(latex)) return true;

  for (let i = 0; i < latex.length; i++) {
    if (latex.startsWith("\\begin{cases}", i)) {
      const end = matchingCasesEnd(latex, i);
      if (end < 0) continue;
      const body = latex.slice(i + "\\begin{cases}".length, end);
      if (body.includes("\\begin{cases}") || hasGuardedToken(body)) return true;
      i = end + "\\end{cases}".length - 1;
      continue;
    }
    if (latex.startsWith("\\overset", i) && !/[a-zA-Z]/.test(latex[i + "\\overset".length] ?? "")) {
      const firstOpen = latex.indexOf("{", i);
      const firstClose = matchingBrace(latex, firstOpen);
      const secondOpen = firstClose < 0 ? -1 : latex.indexOf("{", firstClose + 1);
      const secondClose = secondOpen < 0 ? -1 : matchingBrace(latex, secondOpen);
      if (secondClose > 0) {
        const base = latex.slice(secondOpen + 1, secondClose);
        if (/\\overset(?![a-zA-Z])/.test(base) || hasGuardedToken(base)) return true;
        i = secondClose;
      }
      continue;
    }
    const command = SLOT_COMMANDS.find(
      (token) =>
        token !== "\\overset" &&
        latex.startsWith(token, i) &&
        !/[a-zA-Z]/.test(latex[i + token.length] ?? "")
    );
    if (!command) continue;
    const open = latex.indexOf("{", i + command.length);
    const close = matchingBrace(latex, open);
    if (close < 0) continue;
    if (hasGuardedToken(latex.slice(open + 1, close))) return true;
    i = close;
  }
  return false;
}

function isGuardedInsert(latex: string): boolean {
  return (
    /^\\(?:dot|overline|overrightarrow|overleftarrow|overleftrightarrow|overset)\s*\{/.test(
      latex
    ) ||
    /^\\begin\{cases\}/.test(latex) ||
    /^\{#\?\}\^\{\\(?:prime|circ)\}$/.test(latex) ||
    /^\\(?:equiv|sim|sslash|perp|triangle|square|angle)(?![a-zA-Z])/.test(latex)
  );
}

function prefixEndsStructure(prefix: string): boolean {
  return (
    /\^\{(?:\\prime|\\circ)\}$/.test(prefix) ||
    /\\end\{cases\}$/.test(prefix) ||
    /\\(?:dot|overline|overrightarrow|overleftarrow|overleftrightarrow)\{(?:[^{}]|\\placeholder\{\}|\{\})*\}$/.test(
      prefix
    ) ||
    /\\overset\{[^{}]*\}\{(?:[^{}]|\\placeholder\{\})*\}$/.test(prefix)
  );
}

/** 칸 바로 뒤로 커서를 옮긴다. 프라임·각도는 위첨자 끝까지 간다. */
function exitStructure(field: EditableMathField): boolean {
  const start = field.position;
  field.executeCommand("moveAfterParent");
  if (field.position !== start) return true;

  let previous = field.position;
  for (let step = 0; step < 8; step++) {
    field.executeCommand("moveToNextChar");
    if (field.position === previous) return false;
    previous = field.position;
    if (prefixEndsStructure(field.getValue(0, field.position, "latex"))) return true;
  }
  return false;
}

function isOverfullDotBody(body: string): boolean {
  if (/\\dot(?![a-zA-Z])/.test(body)) return true;
  const normalized = body.replace(/\\placeholder\{\}/g, "P").replace(/\{\}/g, "P");
  const tokens = normalized.match(/\\[a-zA-Z]+|\\.|\{[^{}]*\}|[^\s]/g);
  return (tokens?.length ?? 0) > 1;
}

function hasOverfullDot(latex: string): boolean {
  for (let i = 0; i < latex.length; i++) {
    if (!latex.startsWith("\\dot{", i) && !latex.startsWith("\\dot {", i)) continue;
    const open = latex.indexOf("{", i);
    const close = matchingBrace(latex, open);
    if (close < 0) continue;
    if (isOverfullDotBody(latex.slice(open + 1, close))) return true;
  }
  return false;
}

export function insertIntoMathField(field: EditableMathField, latex: string): void {
  const guarded = isGuardedInsert(latex);

  for (let attempt = 0; attempt < 4; attempt++) {
    const beforeValue = field.value;
    const beforeSelection = field.selection;
    const nestedBefore = isNestedStructure(beforeValue);
    const overfullBefore = hasOverfullDot(beforeValue);
    field.insert(latex, { focus: true });
    const nestedNow = guarded && !nestedBefore && isNestedStructure(field.value);
    const overfullNow = !overfullBefore && hasOverfullDot(field.value);
    if (!nestedNow && !overfullNow) return;

    field.value = beforeValue;
    field.selection = beforeSelection;
    if (!exitStructure(field)) return;
  }
}

function moveHorizontally(
  field: EditableMathField,
  command: "moveToPreviousChar" | "moveToNextChar"
): void {
  const from = field.position;
  field.executeCommand(command);
  const to = field.position;
  const start = Math.min(from, to);
  const end = Math.max(from, to);
  const crossed = field.getValue(start, end, "latex");
  if (!DOT_ATOM_RE.test(crossed)) return;

  const emptyBody = crossed.includes("\\placeholder{}");
  if (command === "moveToNextChar") {
    field.position = start + 1;
    if (emptyBody) field.selection = { ranges: [[start + 1, start + 2]], direction: "none" };
    return;
  }
  field.position = end - 1;
  if (emptyBody) field.selection = { ranges: [[end - 2, end - 1]], direction: "none" };
}

/** 단일 토큰: 숫자 한 자리, 문자 하나, 또는 `\command` 하나. MathLive가 이 인자들의 중괄호를 뺀다. */
const SINGLE_TOKEN = "(\\\\[a-zA-Z]+|[0-9A-Za-z])";

/** 뷰어 insert가 `\cmd{#?}` 형태인 명령. MathLive가 단일 토큰 인자의 중괄호를 빼면 되돌린다. */
const SINGLE_ARG_COMMANDS = [
  "sqrt",
  "dot",
  "vec",
  "overline",
  "overrightarrow",
  "overleftarrow",
  "overleftrightarrow",
  "sin",
  "cos",
  "tan",
  "sec",
  "csc",
  "cot",
  "log",
  "ln",
] as const;

/** `\sqrt2` → `\sqrt{2}`, `\dot x` → `\dot{x}` 처럼 `\cmd` 바로 뒤의 단일 토큰 인자를 감싼다. */
function braceSingleArgCommand(latex: string): string {
  const names = SINGLE_ARG_COMMANDS.join("|");
  return latex.replace(
    new RegExp(`\\\\(${names})(?![a-zA-Z])\\s*${SINGLE_TOKEN}`, "g"),
    "\\$1{$2}"
  );
}

/** 접두 그룹을 가진 명령의 단일 토큰 본문 인자를 감싼다: n제곱근, overset, 밑 있는 log. */
function braceTrailingArg(latex: string): string {
  return latex
    .replace(new RegExp(`(\\\\sqrt\\[[^\\]]*\\])\\s*${SINGLE_TOKEN}`, "g"), "$1{$2}")
    .replace(new RegExp(`(\\\\overset\\{[^{}]*\\})\\s*${SINGLE_TOKEN}`, "g"), "$1{$2}")
    .replace(new RegExp(`(\\\\log_\\{[^{}]*\\})\\s*${SINGLE_TOKEN}`, "g"), "$1{$2}");
}

/** `\frac12` → `\frac{1}{2}`, `\frac a b`·`\frac{ab}c` 등 단일 토큰 인자를 감싼다. */
function braceFracArgs(latex: string): string {
  const cmd = "(dfrac|tfrac|dbinom|tbinom|binom|frac)";
  return latex
    .replace(new RegExp(`\\\\${cmd}\\s*${SINGLE_TOKEN}\\s*${SINGLE_TOKEN}`, "g"), "\\$1{$2}{$3}")
    .replace(new RegExp(`\\\\${cmd}(\\{[^{}]*\\})\\s*${SINGLE_TOKEN}`, "g"), "\\$1$2{$3}")
    .replace(new RegExp(`\\\\${cmd}\\s*${SINGLE_TOKEN}(\\{[^{}]*\\})`, "g"), "\\$1{$2}$3");
}

/** MathLive가 `^\prime `처럼 중괄호 없이 내보내는 위첨자를 키 형태로 되돌린다. */
function bracePrimeAndCirc(latex: string): string {
  return latex.replace(/\^\\prime\s*/g, "^{\\prime}").replace(/\^\\circ\s*/g, "^{\\circ}");
}

/**
 * `2^3` → `{2}^{3}`, `2_3` → `{2}_{3}`, `x^n` → `{x}^{n}`.
 * 이미 `{2}^{3}`이면 밑 앞의 `{` 때문에 다시 감싸지 않는다.
 */
function braceScript(latex: string, op: "^" | "_"): string {
  const marker = op === "^" ? "\\^" : "_";
  const withArgBraces = latex.replace(
    new RegExp(`${marker}(?!\\{)${SINGLE_TOKEN}(?![0-9A-Za-z])`, "g"),
    `${op}{$1}`
  );
  return withArgBraces.replace(
    new RegExp(`(^|[^\\\\{])(\\d+(?:\\.\\d+)?|[A-Za-z]|\\\\[a-zA-Z]+)${marker}\\{`, "g"),
    `$1{$2}${op}{`
  );
}

/** 빈 `#?`는 `{}`로 남겨 키의 중괄호 구조만 남긴다. */
function replacePlaceholders(latex: string): string {
  return latex
    .replace(/\{\\placeholder(?:\[[^\]]*\])?\{\}\}/g, "{}")
    .replace(/\\placeholder(?:\[[^\]]*\])?\{\}/g, "{}")
    .replace(/#\?/g, "{}");
}

function tightenCases(latex: string): string {
  return latex.replace(
    /\\begin\{cases\}([\s\S]*?)\\end\{cases\}/g,
    (_match, body: string) => `\\begin{cases}${body.replace(/\s*\\\\\s*/g, "\\\\")}\\end{cases}`
  );
}

/** 닫을 때 MathLive가 줄인 중괄호와 빈 칸을 뷰어 키 insert 형태로 되돌린다. */
export function normalizeCommittedMathLatex(latex: string): string {
  let braced = bracePrimeAndCirc(latex);
  braced = braceSingleArgCommand(braced);
  braced = braceTrailingArg(braced);
  braced = braceFracArgs(braced);
  braced = braceScript(braceScript(braced, "^"), "_");
  return tightenCases(replacePlaceholders(braced));
}

export function runMathFieldCommand(
  field: EditableMathField,
  command: string | [string, ...unknown[]]
): void {
  if (command === "moveToPreviousChar" || command === "moveToNextChar") {
    moveHorizontally(field, command);
    return;
  }
  field.executeCommand(command);
}
