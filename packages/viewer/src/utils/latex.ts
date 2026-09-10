/**
 * LaTeX 정규화 유틸.
 * 표시용으로만 사용하며 저장값은 변경하지 않는다.
 */

interface EnvMatch {
  begin: string;
  body: string;
  end: string;
  envName: string;
  colSpec: string;
  startIndex: number;
  endIndex: number;
}

/** 이미 포함된 MathJax/TeX 외부 수식 구분자를 표시용 값에서 제거합니다. */
export const stripOuterMathDelimiters = (latex: string): string => {
  const trimmed = latex.trim();

  if (
    (trimmed.startsWith("\\(") && trimmed.endsWith("\\)")) ||
    (trimmed.startsWith("\\[") && trimmed.endsWith("\\]"))
  ) {
    return trimmed.slice(2, -2).trim();
  }

  if (trimmed.length >= 4 && trimmed.startsWith("$$") && trimmed.endsWith("$$")) {
    return trimmed.slice(2, -2).trim();
  }

  if (trimmed.length >= 2 && trimmed.startsWith("$") && trimmed.endsWith("$")) {
    return trimmed.slice(1, -1).trim();
  }

  return trimmed;
};

/** MathLive처럼 닫히지 않은 중괄호 그룹을 표시용으로만 닫습니다. */
export const closeUnbalancedLatexGroups = (latex: string): string => {
  let depth = 0;

  for (let index = 0; index < latex.length; index++) {
    const character = latex[index];
    if (character !== "{" && character !== "}") continue;

    let backslashCount = 0;
    for (let cursor = index - 1; cursor >= 0 && latex[cursor] === "\\"; cursor--) {
      backslashCount++;
    }
    if (backslashCount % 2 === 1) continue;

    if (character === "{") {
      depth++;
    } else if (depth > 0) {
      depth--;
    }
  }

  return depth > 0 ? `${latex}${"}".repeat(depth)}` : latex;
};

const ROW_BREAK_ENVIRONMENTS = new Set([
  "array",
  "matrix",
  "pmatrix",
  "bmatrix",
  "Bmatrix",
  "vmatrix",
  "Vmatrix",
  "smallmatrix",
  "cases",
  "aligned",
  "alignedat",
  "gathered",
  "split",
  "subarray",
]);

/**
 * 저장/전달 과정에서 이중 이스케이프된 LaTeX 명령어를 정규화합니다.
 * 행렬 계열 환경 안에서는 `\\`가 행 구분자이므로 원문 그대로 보존합니다.
 */
export const normalizeLatexBackslashes = (latex: string): string => {
  const environmentStack: string[] = [];
  let result = "";
  let index = 0;

  while (index < latex.length) {
    if (latex[index] !== "\\") {
      result += latex[index];
      index++;
      continue;
    }

    const environmentMatch = latex.slice(index).match(/^\\(begin|end)\{([^{}]+)\}/);
    if (environmentMatch) {
      const [command, type, environmentName] = environmentMatch;
      result += command;
      index += command.length;

      if (type === "begin") {
        environmentStack.push(environmentName);
      } else {
        const matchingIndex = environmentStack.lastIndexOf(environmentName);
        if (matchingIndex >= 0) environmentStack.splice(matchingIndex, 1);
      }
      continue;
    }

    const isInsideRowEnvironment = environmentStack.some((environmentName) =>
      ROW_BREAK_ENVIRONMENTS.has(environmentName)
    );
    if (isInsideRowEnvironment && latex[index + 1] === "\\") {
      result += "\\\\";
      index += 2;
      continue;
    }

    let backslashEnd = index + 1;
    while (latex[backslashEnd] === "\\") backslashEnd++;

    const backslashCount = backslashEnd - index;
    if (backslashCount >= 2 && /[a-zA-Z]/.test(latex[backslashEnd] ?? "")) {
      result += "\\";
    } else {
      result += latex.slice(index, backslashEnd);
    }
    index = backslashEnd;
  }

  return result;
};

/**
 * 기하 도형의 선분/직선 표기에 고정 높이 기준을 추가합니다.
 */
interface NormalizeGeometryAccentOptions {
  addMathJaxClass?: boolean;
}

export const normalizeGeometryAccents = (
  latex: string,
  { addMathJaxClass = false }: NormalizeGeometryAccentOptions = {}
): string =>
  latex.replace(
    /\\(overline|overleftarrow|overrightarrow|overleftrightarrow)\s*\{\s*(\\mathrm\s*\{([^{}]*)\})\s*\}/g,
    (match: string, command: string, body: string, label: string) => {
      if (!/^[A-Za-z]+$/.test(label.trim())) return match;
      const heightReference =
        command === "overline" ? "\\vphantom{\\rule{0pt}{0.8em}}" : "\\vphantom{A}";
      const normalized = `\\${command}{${heightReference}${body}}`;

      if (!addMathJaxClass) return normalized;
      const className =
        command === "overline"
          ? "qti-geometry-overline"
          : `qti-geometry-arrow qti-geometry-${command}`;
      return `\\class{${className}}{${normalized}}`;
    }
  );

/**
 * MathLive 0.107.x가 인자 없는 `\longrightarrow` 뒤의 다음 토큰을
 * 화살표 위 라벨로 소비하는 문제를 표시용 빈 라벨로 우회합니다.
 */
export const normalizeLongArrowForMathLive = (latex: string): string =>
  latex.replace(/\\longrightarrow(?![A-Za-z])(?!(?:\s*)[\[{])/g, "\\longrightarrow{}");

/** HTML을 거쳐 들어온 공백 엔티티가 TeX의 정렬 기호(&)로 오인되지 않게 합니다. */
export const normalizeLatexWhitespaceEntities = (latex: string): string =>
  latex.replace(/&(?:#x0*(?:20|a0)|#0*(?:32|160)|nbsp);/gi, " ");

const TEXT_SIZE_COMMANDS = new Set([
  "tiny",
  "scriptsize",
  "footnotesize",
  "small",
  "normalsize",
  "large",
  "Large",
  "LARGE",
  "huge",
  "Huge",
]);

const TEXT_STYLE_CLASSES: Record<string, string> = {
  textbf: "qti-math-text-bold",
  textmd: "qti-math-text-medium",
  textsf: "qti-math-text-sans",
  textrm: "qti-math-text-serif",
  texttt: "qti-math-text-mono",
  textit: "qti-math-text-italic",
  textsl: "qti-math-text-oblique",
  textup: "qti-math-text-upright",
  emph: "qti-math-text-italic",
};

const findClosingLatexBrace = (latex: string, openingIndex: number): number => {
  let depth = 0;

  for (let index = openingIndex; index < latex.length; index++) {
    if (latex[index] !== "{" && latex[index] !== "}") continue;

    let backslashCount = 0;
    for (let cursor = index - 1; cursor >= 0 && latex[cursor] === "\\"; cursor--) {
      backslashCount++;
    }
    if (backslashCount % 2 === 1) continue;

    if (latex[index] === "{") depth++;
    else if (--depth === 0) return index;
  }

  return -1;
};

interface ParsedNestedTextStyle {
  body: string;
  classes: string[];
  sizeCommand?: string;
}

const parseNestedTextStyle = (content: string): ParsedNestedTextStyle | null => {
  let current = content.trim();
  let sizeCommand: string | undefined;
  const classes: string[] = [];
  let foundStyleCommand = false;

  while (current.startsWith("\\")) {
    const commandMatch = current.match(/^\\([A-Za-z]+)\s*/);
    if (!commandMatch) break;

    const command = commandMatch[1];
    if (TEXT_SIZE_COMMANDS.has(command)) {
      sizeCommand = command;
      foundStyleCommand = true;
      current = current.slice(commandMatch[0].length).trim();
      continue;
    }

    const className = TEXT_STYLE_CLASSES[command];
    if (!className) break;

    const openingIndex = commandMatch[0].length;
    if (current[openingIndex] !== "{") break;
    const closingIndex = findClosingLatexBrace(current, openingIndex);
    if (closingIndex < 0 || current.slice(closingIndex + 1).trim()) break;

    classes.push(className);
    foundStyleCommand = true;
    current = current.slice(openingIndex + 1, closingIndex).trim();
  }

  if (!foundStyleCommand) return null;
  return { body: current, classes: [...new Set(classes)], sizeCommand };
};

export const normalizeNestedTextStylesForMathJax = (latex: string): string => {
  let result = "";
  let cursor = 0;

  while (cursor < latex.length) {
    const commandIndex = latex.indexOf("\\text{", cursor);
    if (commandIndex < 0) {
      result += latex.slice(cursor);
      break;
    }

    result += latex.slice(cursor, commandIndex);
    const openingIndex = commandIndex + "\\text".length;
    const closingIndex = findClosingLatexBrace(latex, openingIndex);
    if (closingIndex < 0) {
      result += latex.slice(commandIndex);
      break;
    }

    const content = latex.slice(openingIndex + 1, closingIndex);
    const parsed = parseNestedTextStyle(content);
    if (!parsed) {
      result += latex.slice(commandIndex, closingIndex + 1);
      cursor = closingIndex + 1;
      continue;
    }

    const text = `\\text{${parsed.body}}`;
    const styledText = parsed.classes.length
      ? `\\class{${parsed.classes.join(" ")}}{${text}}`
      : text;
    result += parsed.sizeCommand ? `{\\${parsed.sizeCommand} ${styledText}}` : styledText;
    cursor = closingIndex + 1;
  }

  return result;
};

const findEnvironments = (latex: string): EnvMatch[] => {
  const results: EnvMatch[] = [];
  const beginRe = /\\begin\{([^}]*)\}/g;
  let m: RegExpExecArray | null;

  while ((m = beginRe.exec(latex)) !== null) {
    const envName = m[1];
    const beginTagEnd = m.index + m[0].length;
    let pos = beginTagEnd;

    while (pos < latex.length && latex[pos] === "{") {
      let depth = 1;
      pos++;
      while (pos < latex.length && depth > 0) {
        if (latex[pos] === "{") depth++;
        else if (latex[pos] === "}") depth--;
        pos++;
      }
    }

    const beginPart = latex.slice(m.index, pos);
    const colSpec = latex.slice(beginTagEnd, pos);
    const endTag = `\\end{${envName}}`;
    const endIdx = latex.indexOf(endTag, pos);
    if (endIdx === -1) continue;

    results.push({
      begin: beginPart,
      body: latex.slice(pos, endIdx),
      end: endTag,
      envName,
      colSpec,
      startIndex: m.index,
      endIndex: endIdx + endTag.length,
    });
  }

  return results;
};

const splitAtHline = (body: string): [string, string] => {
  const parts = body.split(/\\\\\s*\\hline/);
  if (parts.length < 2) {
    const fallback = body.split(/\\hline/);
    return [fallback[0].trim(), fallback.slice(1).join("").trim()];
  }
  const before = parts[0].trim();
  const after = parts
    .slice(1)
    .join("")
    .replace(/\\hline/g, "")
    .trim();
  return [before, after];
};

export const normalizeHline = (latex: string): string => {
  const envs = findEnvironments(latex);

  let result = latex;
  for (let i = envs.length - 1; i >= 0; i--) {
    const env = envs[i];
    if (!env.body.includes("\\hline")) continue;

    const [before, after] = splitAtHline(env.body);

    const replaced = after
      ? `\\begin{${env.envName}}${env.colSpec}${before} \\\\ \\overline{${after}}\\end{${env.envName}}`
      : `\\underline{\\begin{${env.envName}}${env.colSpec}${before}\\end{${env.envName}}}`;

    result = result.slice(0, env.startIndex) + replaced + result.slice(env.endIndex);
  }

  result = result.replace(/\\hline/g, "\\rule{10em}{0.5pt}");
  return result;
};

/**
 * MathLive가 관대하게 표시하는 array의 초과 열을 MathJax에서도 표시할 수 있게 보정합니다.
 */
export const normalizeArrayColumnsForMathJax = (latex: string): string =>
  latex.replace(
    /\\begin\{array\}\{([rlc]+)\}([\s\S]*?)\\end\{array\}/g,
    (match: string, columnSpec: string, body: string) => {
      const requiredColumns = body.split(/\\\\(?:\[[^\]]*\])?/).reduce((max, row) => {
        const ampersands = row.match(/(^|[^\\])&/g)?.length ?? 0;
        return Math.max(max, ampersands + 1);
      }, 0);

      if (requiredColumns <= columnSpec.length) return match;

      const expandedSpec = columnSpec.padEnd(requiredColumns, columnSpec.at(-1) ?? "l");
      return match.replace(`\\begin{array}{${columnSpec}}`, `\\begin{array}{${expandedSpec}}`);
    }
  );
