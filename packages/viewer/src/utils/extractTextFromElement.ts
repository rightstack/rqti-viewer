const MEDIA_SELECTORS = ["img", "video", "audio", "object", "qti-object", "source"] as const;

/** 클론 트리에서 미디어 노드를 제거 (본문 직렬화·텍스트 추출 공통) */
export function removeMediaFromElementClone(clone: Element): void {
  MEDIA_SELECTORS.forEach((selector) => {
    clone.querySelectorAll(selector).forEach((el) => el.remove());
  });
}

// 텍스트 콘텐츠 추출 (미디어 태그 제외)
export const extractTextFromElement = (element: Element): string => {
  const clone = element.cloneNode(true) as Element;
  removeMediaFromElementClone(clone);
  return clone.textContent || "";
};
