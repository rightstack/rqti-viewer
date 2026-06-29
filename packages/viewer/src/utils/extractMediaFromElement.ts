import type { MediaContentType } from "../types";

// Stable hash for deterministic IDs
const hashString = (str: string): string => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36);
};

// 미디어 콘텐츠 추출 헬퍼 함수
export const extractMediaFromElement = (element: Element): MediaContentType[] => {
  const media: MediaContentType[] = [];
  let mediaCounter = 0;

  // 이미지 추출
  const images = element.querySelectorAll("img");
  images.forEach((img) => {
    const url = img.getAttribute("src");
    const alt = img.getAttribute("alt");
    const width = img.getAttribute("width");
    const height = img.getAttribute("height");
    const cls = img.getAttribute("class") || undefined;
    if (url) {
      const stableId = `img-${hashString(url)}-${mediaCounter++}`;
      media.push({
        id: stableId,
        type: "image",
        url,
        alt: alt || undefined,
        width: width ? parseInt(width, 10) : undefined,
        height: height ? parseInt(height, 10) : undefined,
        className: cls,
      });
    }
  });

  // 비디오 추출
  const videos = element.querySelectorAll("video, video source");
  videos.forEach((video) => {
    const url = video.getAttribute("src");
    if (url) {
      const stableId = `vid-${hashString(url)}-${mediaCounter++}`;
      media.push({
        id: stableId,
        type: "video",
        url,
      });
    }
  });

  // 오디오 추출
  const audios = element.querySelectorAll("audio, audio source");
  audios.forEach((audio) => {
    const url = audio.getAttribute("src");
    if (url) {
      const stableId = `aud-${hashString(url)}-${mediaCounter++}`;
      media.push({
        id: stableId,
        type: "audio",
        url,
      });
    }
  });

  // QTI object 태그도 처리
  const objects = element.querySelectorAll("object, qti-object");
  objects.forEach((obj) => {
    const url = obj.getAttribute("data") || obj.getAttribute("src");
    const mimeType = obj.getAttribute("type");
    if (!url || !mimeType) return;

    if (mimeType.startsWith("image/")) {
      const width = obj.getAttribute("width");
      const height = obj.getAttribute("height");
      const stableId = `obj-img-${hashString(url)}-${mediaCounter++}`;
      media.push({
        id: stableId,
        type: "image",
        url,
        width: width ? parseInt(width, 10) : undefined,
        height: height ? parseInt(height, 10) : undefined,
      });
    } else if (mimeType.startsWith("video/")) {
      const stableId = `obj-vid-${hashString(url)}-${mediaCounter++}`;
      media.push({
        id: stableId,
        type: "video",
        url,
      });
    } else if (mimeType.startsWith("audio/")) {
      const stableId = `obj-aud-${hashString(url)}-${mediaCounter++}`;
      media.push({
        id: stableId,
        type: "audio",
        url,
      });
    }
  });

  return media;
};
