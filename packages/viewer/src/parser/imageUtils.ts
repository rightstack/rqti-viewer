import type React from "react";

/** width/height 속성을 인라인 스타일로 변환 */
export function buildImageStyle(width?: string, height?: string): React.CSSProperties {
  const style: React.CSSProperties = {};

  if (width) {
    const num = Number(width);
    style.width = Number.isNaN(num) ? width : `${num}px`;
    style.maxWidth = "100%";
  }
  if (height) {
    const num = Number(height);
    style.height = Number.isNaN(num) ? height : `${num}px`;
  }

  return style;
}

/** QTI 높이는 px 호환 변환 없이 em 배수로 읽는다. */
export function getQtiInlineImageHeight(
  className: string,
  value: string | null
): number | undefined {
  if (!className.split(/\s+/).includes("qti-ext-inline-image")) return undefined;
  const height = Number(value);
  return [1, 1.25, 1.5, 1.75, 2.25, 3].includes(height) ? height : 1.5;
}

export function buildInlineImageStyle(heightEm: number): React.CSSProperties {
  return { height: `${heightEm}em` };
}
