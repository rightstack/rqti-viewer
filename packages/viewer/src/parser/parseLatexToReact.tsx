/** LaTeX를 MathJax로 렌더링해 React 요소로 변환합니다. */
import React from "react";
import { MathJaxWithTextFont } from "../providers/MathJaxProviderWrapper";
import {
  closeUnbalancedLatexGroups,
  normalizeArrayColumnsForMathJax,
  stripOuterMathDelimiters,
} from "../utils/latex";

/**
 * 저장/전달 과정에서 백슬래시가 이중 이스케이프된 명령어만 정규화
 * (예: \\frac → \frac). LaTeX 줄바꿈 \\ 는 그대로 둠.
 */
const normalizeLatexBackslashes = (latex: string): string =>
  latex.replace(/\\\\+([a-zA-Z])/g, (_, letter) => `\\${letter}`);

export const renderLaTeX = (
  latex: string,
  key: string,
  displayMode: boolean
): React.ReactElement => {
  const normalized = normalizeArrayColumnsForMathJax(
    closeUnbalancedLatexGroups(
      stripOuterMathDelimiters(
        normalizeLatexBackslashes(latex).replace(/\\require\{[^}]*\}\s*/g, "")
      )
    )
  );
  if (!normalized) {
    return React.createElement("span", { key });
  }

  const math = displayMode ? `\\[${normalized}\\]` : `\\(\\displaystyle ${normalized}\\)`;

  if (!displayMode) {
    return (
      <MathJaxWithTextFont key={key} inline dynamic className="qti-ext-mathfield">
        {math}
      </MathJaxWithTextFont>
    );
  }

  return (
    <div key={key} className="qti-ext-math-display">
      <MathJaxWithTextFont dynamic className="qti-ext-mathfield">
        {math}
      </MathJaxWithTextFont>
    </div>
  );
};

type MathMatch = {
  start: number;
  end: number;
  raw: string;
  displayMode: boolean;
};

const stripDelimiters = (raw: string, displayMode: boolean): string => {
  if (displayMode) {
    if (raw.startsWith("$$")) return raw.slice(2, -2);
    if (raw.startsWith("\\[")) return raw.slice(2, -2);
  } else {
    if (raw.startsWith("$")) return raw.slice(1, -1);
    if (raw.startsWith("\\(")) return raw.slice(2, -2);
  }
  return raw;
};

const pushIfNotOverlapping = (
  matches: MathMatch[],
  start: number,
  end: number,
  raw: string,
  displayMode: boolean
) => {
  const overlaps = matches.some((m) => start < m.end && end > m.start);
  if (!overlaps) {
    matches.push({ start, end, raw, displayMode });
  }
};

/** 연속 공백(2+)을 non-breaking space로 변환하여 HTML 렌더링 시 축소 방지 */
const preserveWhitespace = (s: string): string =>
  s.replace(/ {2,}/g, (m) => `${"\u00A0".repeat(m.length - 1)} `);

/**
 * 텍스트에서 LaTeX 수식을 찾아서 파싱 (SAX 방식)
 * 인라인: $...$, \(...\)
 * 블록: $$...$$, \[...\]
 */
export const parseTextWithLaTeX = (
  text: string,
  keyPrefix = "latex"
): Array<React.ReactElement | string> => {
  const result: Array<React.ReactElement | string> = [];
  const matches: MathMatch[] = [];
  let lastIndex = 0;
  let partIndex = 0;

  const blockPattern = /\$\$[\s\S]*?\$\$|\\\[[\s\S]*?\\\]/g;
  const inlineDollarPattern = /(?<!\\)\$([\s\S]*?)(?<!\\)\$/g;
  const inlineParenPattern = /\\\(([\s\S]*?)\\\)/g;

  let match: RegExpExecArray | null;

  // block
  while ((match = blockPattern.exec(text))) {
    pushIfNotOverlapping(matches, match.index, match.index + match[0].length, match[0], true);
  }

  // inline $
  while ((match = inlineDollarPattern.exec(text))) {
    pushIfNotOverlapping(matches, match.index, match.index + match[0].length, match[0], false);
  }

  // inline \(...)
  while ((match = inlineParenPattern.exec(text))) {
    pushIfNotOverlapping(matches, match.index, match.index + match[0].length, match[0], false);
  }

  matches.sort((a, b) => a.start - b.start);

  matches.forEach(({ start, end, raw, displayMode }) => {
    if (start > lastIndex) {
      result.push(preserveWhitespace(text.slice(lastIndex, start)));
    }

    const latex = stripDelimiters(raw, displayMode);
    result.push(
      renderLaTeX(
        latex,
        `${keyPrefix}-${displayMode ? "block" : "inline"}-${partIndex++}`,
        displayMode
      )
    );

    lastIndex = end;
  });

  if (lastIndex < text.length) {
    result.push(preserveWhitespace(text.slice(lastIndex)));
  }

  return result.length ? result : [preserveWhitespace(text)];
};
