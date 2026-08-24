import type { ReactNode } from "react";

/**
 * mqti-frontend `ItemPassageQuestionSplitPreview` 가로 분할과 동일.
 * 지문도 문항과 같이 `.qti-ext-wrapper` 안에 두어 패딩·줄바꿈·배경이 맞는다.
 */
export function PassageLayout({
  passage,
  children,
}: {
  passage: ReactNode;
  children: ReactNode;
}) {
  return (
    <div
      className="qti-ext-passage-wrapper"
      data-orientation-type="horizontal"
      data-item-detail-split=""
    >
      <div className="qti-ext-passage-panel">
        <div className="qti-ext-wrapper">
          <div className="qti-ext-passage">{passage}</div>
        </div>
      </div>
      <div className="qti-ext-passage-divider" aria-hidden />
      <div className="qti-ext-passage-panel">{children}</div>
    </div>
  );
}
