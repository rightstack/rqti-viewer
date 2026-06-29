/**
 * ==========================================
 * Font Loader Utility
 * ==========================================
 *
 * 테마에서 지정한 폰트를 동적으로 로드합니다.
 */

export interface FontConfig {
  family: string; // 폰트 패밀리명 (예: "Pretendard")
  url?: string; // 폰트 CSS URL (예: Google Fonts URL)
  weights?: string[]; // 로드할 weight들 (예: ["400", "600", "700"])
}

export const FONT_PRESETS: Record<string, FontConfig> = {
  "noto-sans-kr": {
    family: "Noto Sans KR",
    url: "https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;500;600;700&display=swap",
  },
  "noto-serif-kr": {
    family: "Noto Serif KR",
    url: "https://fonts.googleapis.com/css2?family=Noto+Serif+KR:wght@400;500;600;700&display=swap",
  },
  "ibm-plex-sans-kr": {
    family: "IBM Plex Sans KR",
    url: "https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+KR:wght@400;500;600&display=swap",
  },

  "nanum-gothic": {
    family: "Nanum Gothic",
    url: "https://fonts.googleapis.com/css2?family=Nanum+Gothic:wght@400;700&display=swap",
  },
  "nanum-myeongjo": {
    family: "Nanum Myeongjo",
    url: "https://fonts.googleapis.com/css2?family=Nanum+Myeongjo:wght@400;700&display=swap",
  },
  "nanum-square-round": {
    family: "NanumSquareRound",
    url: "https://cdn.jsdelivr.net/gh/innks/NanumSquareRound@master/nanumsquareround.min.css",
  },
  jua: {
    family: "Jua",
    url: "https://fonts.googleapis.com/css2?family=Jua&display=swap",
  },
  "do-hyeon": {
    family: "Do Hyeon",
    url: "https://fonts.googleapis.com/css2?family=Do+Hyeon&display=swap",
  },
  "gamja-flower": {
    family: "Gamja Flower",
    url: "https://fonts.googleapis.com/css2?family=Gamja+Flower&display=swap",
  },
  "poor-story": {
    family: "Poor Story",
    url: "https://fonts.googleapis.com/css2?family=Poor+Story&display=swap",
  },
};

const loadedFonts = new Set<string>();

/**
 * 폰트를 동적으로 로드
 */
export function loadFont(config: FontConfig): void {
  const { family, url } = config;

  // 이미 로드된 폰트는 스킵
  if (loadedFonts.has(family)) {
    return;
  }

  // URL이 없으면 시스템 폰트로 간주
  if (!url) {
    loadedFonts.add(family);
    return;
  }

  const linkId = `font-${family.replace(/\s+/g, "-").toLowerCase()}`;

  if (document.getElementById(linkId)) {
    loadedFonts.add(family);
    return;
  }

  const link = document.createElement("link");
  link.id = linkId;
  link.rel = "stylesheet";
  link.href = url;
  link.crossOrigin = "anonymous";

  document.head.appendChild(link);
  loadedFonts.add(family);
}

let currentThemeFontUrl: string | undefined;

/**
 * 프리셋 이름으로 폰트 로드
 */
export function loadFontByPreset(presetKey: string): void {
  const config = FONT_PRESETS[presetKey];
  if (config) {
    loadFont(config);
  }
}

/**
 * 테마의 typography.fontFamily(URL)를 기반으로 폰트 로드
 */
export function loadThemeFont(fontFamily?: string): void {
  if (!fontFamily) {
    // 폰트가 없으면 이전 폰트 제거
    if (currentThemeFontUrl) {
      const prevLinkId = `font-url-${btoa(currentThemeFontUrl).substring(0, 20)}`;
      const prevLink = document.getElementById(prevLinkId);
      if (prevLink) {
        prevLink.remove();
      }
      currentThemeFontUrl = undefined;
    }
    return;
  }

  if (currentThemeFontUrl && currentThemeFontUrl !== fontFamily) {
    const prevLinkId = `font-url-${btoa(currentThemeFontUrl).substring(0, 20)}`;
    const prevLink = document.getElementById(prevLinkId);
    if (prevLink) {
      prevLink.remove();
    }
  }

  if (currentThemeFontUrl === fontFamily) {
    const linkId = `font-url-${btoa(fontFamily).substring(0, 20)}`;
    if (document.getElementById(linkId)) {
      return;
    }
  }

  // <link> 태그로 폰트 로드
  const linkId = `font-url-${btoa(fontFamily).substring(0, 20)}`;
  const link = document.createElement("link");
  link.id = linkId;
  link.rel = "stylesheet";
  link.href = fontFamily;
  link.crossOrigin = "anonymous";

  document.head.appendChild(link);
  currentThemeFontUrl = fontFamily;
}
