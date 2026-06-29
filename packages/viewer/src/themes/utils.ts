import type { CSSProperties } from "react";

/**
 * qti-input-width-N 형식의 width를 className과 style로 변환
 * @param inputWidth qti-input-width-N 형식의 문자열 (예: "qti-input-width-8")
 * @param totalInputs 전체 입력 필드 개수
 * @returns className과 style 객체
 */
export const parseInputWidth = (
  inputWidth: string | Record<string, string> | undefined,
  totalInputs: number
): { className: string; style: CSSProperties } => {
  if (totalInputs === 1) return { className: "", style: {} };
  if (!inputWidth || typeof inputWidth !== "string") return { className: "min-w-32", style: {} };

  const qtiWidthMatch = inputWidth.match(/^qti-input-width-(\d+)$/);
  if (qtiWidthMatch && qtiWidthMatch[1]) {
    const charCount = parseInt(qtiWidthMatch[1], 10);
    // 1글자 ≈ 0.65rem (약 10.4px), 최소 여유 2.5rem (40px)
    // 최소 4rem (64px) 보장
    const calculatedWidth = charCount * 0.65 + 2.5;
    const width = `${Math.max(calculatedWidth, 4)}rem`;
    return { className: "", style: { width } };
  }

  // Tailwind 클래스 (w-로 시작)
  if (inputWidth.startsWith("w-")) {
    return { className: inputWidth, style: {} };
  }

  // CSS 값 (px, rem, em 등)
  return { className: "", style: { width: inputWidth } };
};

/** 접미 숫자 토큰은 정수만 온다고 가정한다. */
const INDENT_TOKEN = String.raw`\d+`;

const RE_QTI_TEXT_INDENT_BLOCK = new RegExp(
  String.raw`qti-text-indent-(?!first-)(${INDENT_TOKEN})`,
  "g"
);
const RE_QTI_TEXT_INDENT_FIRST = new RegExp(
  String.raw`qti-text-indent-first-(${INDENT_TOKEN})`,
  "g"
);
const RE_QTI_TEXT_OUTDENT_FIRST = new RegExp(
  String.raw`qti-text-outdent-first-(${INDENT_TOKEN})`,
  "g"
);

function sumIndentEmFromClass(classAttr: string, re: RegExp): number {
  let acc = 0;
  for (const m of classAttr.matchAll(re)) {
    const token = m[1];
    if (token) acc += parseInt(token, 10);
  }
  return acc;
}

function emMargin(n: number): string | undefined {
  if (n === 0) return undefined;
  return `${n}em`;
}

/**
 * 문단(`<p>`)용: `qti-text-indent-*`, `qti-text-indent-first-*`, `qti-text-outdent-first-*`를
 * 인라인 style로 변환한다. className은 비운다.
 *
 * - `qti-text-indent-N`: 블록 `margin-left`만 (여러 개면 em 합산).
 * - `qti-text-indent-first-N`: `margin-left: Nem` + `text-indent: -Nem` (내어쓰기/행잉 패턴).
 * - `qti-text-outdent-first-N`: `text-indent: Nem`만 (margin-left에는 넣지 않음).
 * - 둘 다 있으면 `text-indent`는 (outdent-first 합 − indent-first 합)em 한 값으로 병합.
 *
 * @param classAttr 원본 class 문자열
 */
export const parseTextIndent = (
  classAttr: string | undefined
): { className: string; style: CSSProperties } => {
  if (!classAttr) return { className: "", style: {} };

  const blockIndent = sumIndentEmFromClass(classAttr, RE_QTI_TEXT_INDENT_BLOCK);
  const indentFirst = sumIndentEmFromClass(classAttr, RE_QTI_TEXT_INDENT_FIRST);
  const OutdentFirst = sumIndentEmFromClass(classAttr, RE_QTI_TEXT_OUTDENT_FIRST);

  const marginEm = blockIndent + indentFirst;
  const textIndentNetEm = OutdentFirst - indentFirst;

  const style: CSSProperties = {};
  const marginLeft = emMargin(marginEm);
  if (marginLeft) style.marginLeft = marginLeft;

  if (textIndentNetEm !== 0) {
    style.textIndent = `${textIndentNetEm}em`;
  }

  if (Object.keys(style).length === 0) {
    return { className: "", style: {} };
  }

  return { className: "", style };
};

/**
 * orientation과 stacking 값에 따른 컨테이너 스타일 반환
 * @param orientation - 선택지 배치 방향 (vertical/horizontal)
 * @param stacking - 열 개수 (1-5)
 * @returns CSSProperties 객체
 */
export const getOrientationStyle = (
  orientation?: "vertical" | "horizontal",
  stacking?: 1 | 2 | 3 | 4 | 5
): CSSProperties => {
  const isVertical = orientation === "vertical";
  const isHorizontal = orientation === "horizontal";

  // vertical일 때는 무조건 1열로 고정
  const effectiveStacking = isVertical ? 1 : stacking;

  if (effectiveStacking) {
    return {
      display: "grid",
      gridTemplateColumns: `repeat(${effectiveStacking}, minmax(0, 1fr))`,
    };
  }

  if (isHorizontal) {
    return { display: "flex", flex: "1", flexDirection: "row", flexWrap: "wrap" };
  }

  return { display: "flex", flex: "1", flexDirection: "column" };
};
