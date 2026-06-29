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
