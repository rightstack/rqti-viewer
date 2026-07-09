/**
 * LaTeX를 MathLive(math-field)로 렌더링해 React 요소로 변환합니다.
 * 에디터(MathElement)와 동일 엔진으로 미리보기·납품 표시를 맞춥니다.
 */
import React, { type ElementType } from "react";
import "mathlive";
import { normalizeHline } from "../utils/latex";

const MathField = "math-field" as unknown as ElementType;

/** 한국 수학 교과서 스타일 매크로 (MathElement.tsx와 동기화) */
const MATH_MACROS = {
  sim: { def: '\\char"223D', args: 0 }, // ∽ 둥근 닮음 기호
  neg: { def: '\\char"FF5E', args: 0 }, // ～ 전각 틸드 (교과서 스타일)
};

/**
 * 저장/전달 과정에서 백슬래시가 이중 이스케이프된 명령어만 정규화
 * (예: \\frac → \frac). LaTeX 줄바꿈 \\ 는 그대로 둠.
 */
const normalizeLatexBackslashes = (latex: string): string =>
  latex.replace(/\\\\+([a-zA-Z])/g, (_, letter) => `\\${letter}`);

/** MathLive enclose SVG viewBox width=0 버그 보정. 수정 시 true 반환 */
const fixEncloseViewBox = (root: ShadowRoot): boolean => {
  let fixed = false;
  for (const svg of root.querySelectorAll<SVGSVGElement>(".ML__notation svg")) {
    const vb = svg.getAttribute("viewBox");
    if (!vb) continue;
    const parts = vb.split(" ");
    if (parseFloat(parts[2]) !== 0) continue;
    const rect = svg.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) continue;
    const h = parseFloat(parts[3]);
    parts[2] = ((rect.width / rect.height) * h).toFixed(2);
    svg.setAttribute("viewBox", parts.join(" "));
    fixed = true;
  }
  return fixed;
};

export const renderLaTeX = (
  latex: string,
  key: string,
  displayMode: boolean
): React.ReactElement => {
  const normalized = normalizeHline(
    normalizeLatexBackslashes(latex.trim()).replace(/\\require\{[^}]*\}\s*/g, "")
  );
  if (!normalized) {
    return React.createElement("span", { key });
  }

  const mathFieldProps = {
    readOnly: true,
    "default-mode": displayMode ? "math" : "inline-math",
    "virtual-keyboard-mode": "manual",
    "math-virtual-keyboard-policy": "off",
    ref: (el: HTMLElement | null) => {
      if (!el) return;
      const mf = el as HTMLElement & {
        macros: Record<string, unknown>;
        value: string;
        shadowRoot: ShadowRoot | null;
      };
      mf.macros = { ...mf.macros, ...MATH_MACROS };
      mf.value = normalized;

      // MathLive bug: \cancel 등 enclose SVG viewBox width=0 보정
      const root = mf.shadowRoot;
      if (root) {
        const observer = new MutationObserver(() => {
          if (fixEncloseViewBox(root)) observer.disconnect();
        });
        observer.observe(root, { childList: true, subtree: true });
        setTimeout(() => observer.disconnect(), 3000);
      }
    },
  };

  if (!displayMode) {
    return React.createElement(MathField, { key, ...mathFieldProps });
  }

  return React.createElement(
    "div",
    { key, className: "qti-ext-math-display" },
    React.createElement(MathField, mathFieldProps)
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
