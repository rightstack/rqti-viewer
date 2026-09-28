/**
 * ==========================================
 * Font Loader Utility
 * ==========================================
 *
 * 테마에서 지정한 폰트를 동적으로 로드합니다.
 */

export interface FontConfig {
  family: string; // CSS font-family. URL 프리셋은 패밀리명, URL 없는 프리셋은 스택
  label?: string; // 화면 표시 이름. 없으면 family를 사용
  url?: string; // 스타일시트 URL, 또는 Adobe Fonts 동적 키트 스크립트 URL
  weights?: string[]; // 로드할 weight들 (예: ["400", "600", "700"])
}

export const FONT_PRESETS: Record<string, FontConfig> = {
  pretendard: {
    label: "Pretendard",
    family: "Pretendard Web",
    url: "https://use.typekit.net/fyj5vqd.js",
  },
  dotum: {
    label: "돋움",
    family: '"돋움", Dotum, sans-serif',
  },
  gothic: {
    label: "고딕",
    family: '"맑은 고딕", "Malgun Gothic", sans-serif',
  },
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

  const kitId = typekitKitIdFromUrl(url);
  if (kitId) {
    loadTypekitKit(kitId);
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

function isHttpUrl(value: string): boolean {
  return value.startsWith("http://") || value.startsWith("https://");
}

const TYPEKIT_KIT_URL = /^https:\/\/use\.typekit\.net\/([a-z0-9]+)\.js$/i;

export function typekitKitIdFromUrl(value: string): string | undefined {
  return value.match(TYPEKIT_KIT_URL)?.[1];
}

const TYPEKIT_SOURCE_FAMILY = "pretendard";
const TYPEKIT_THEME_FAMILY = "Pretendard Web";

type TypekitWindow = Window & {
  Typekit?: {
    load: (config: {
      kitId: string;
      scriptTimeout?: number;
      async?: boolean;
      active?: () => void;
    }) => void;
  };
};

function cssFamilyName(value: string): string {
  return value.replace(/['"]/g, "").trim().toLowerCase();
}

function retargetTypekitPretendard(): void {
  for (const sheet of document.styleSheets) {
    let rules: CSSRuleList;
    try {
      rules = sheet.cssRules;
    } catch {
      continue;
    }

    for (const rule of rules) {
      if (rule.type !== CSSRule.FONT_FACE_RULE) continue;
      const fontRule = rule as CSSFontFaceRule;
      const family = cssFamilyName(fontRule.style.getPropertyValue("font-family"));
      if (family !== TYPEKIT_SOURCE_FAMILY) continue;

      const src = fontRule.style.getPropertyValue("src");
      if (/Pretendard-/.test(src) || !/typekit\.net/i.test(src)) continue;

      fontRule.style.setProperty("font-family", `"${TYPEKIT_THEME_FAMILY}"`);
    }
  }
}

let typekitRetargetObserver: MutationObserver | undefined;

function watchTypekitFontFaces(): void {
  if (typekitRetargetObserver) return;
  typekitRetargetObserver = new MutationObserver(() => {
    retargetTypekitPretendard();
  });
  typekitRetargetObserver.observe(document.head, { childList: true, subtree: true });
  document.fonts.addEventListener("loadingdone", retargetTypekitPretendard);
}

function activateTypekit(kitId: string): void {
  const typekitWindow = window as TypekitWindow;
  try {
    typekitWindow.Typekit?.load({
      kitId,
      scriptTimeout: 3000,
      async: true,
      active: () => {
        retargetTypekitPretendard();
      },
    });
  } catch {
    // 키트 도메인이 허용되지 않거나 스크립트가 실패한 경우 글꼴만 빠진다.
  }
  watchTypekitFontFaces();
  retargetTypekitPretendard();
}

function patchTypekitFontFace(): void {
  const Original = window.FontFace;
  if (!Original || (Original as { __rqtiPatched?: boolean }).__rqtiPatched) return;

  const Patched = function (
    this: FontFace,
    family: string,
    source: string | BufferSource,
    descriptors?: FontFaceDescriptors,
  ) {
    const nextFamily =
      cssFamilyName(family) === TYPEKIT_SOURCE_FAMILY ? TYPEKIT_THEME_FAMILY : family;
    return new Original(nextFamily, source, descriptors);
  } as unknown as typeof FontFace & { __rqtiPatched?: boolean };

  Patched.prototype = Original.prototype;
  Object.setPrototypeOf(Patched, Original);
  Patched.__rqtiPatched = true;
  window.FontFace = Patched;
}

function loadTypekitKit(kitId: string): void {
  // 키트는 FontFace가 있으면 CSS 규칙 대신 그 생성자로 등록한다.
  // 스크립트가 window.FontFace를 잡기 전에 패밀리명을 Pretendard Web으로 바꾼다.
  patchTypekitFontFace();

  const scriptId = `font-typekit-${kitId}`;
  const existing = document.getElementById(scriptId);
  if (existing) {
    activateTypekit(kitId);
    return;
  }

  const script = document.createElement("script");
  script.id = scriptId;
  script.async = true;
  script.src = `https://use.typekit.net/${kitId}.js`;
  script.onload = () => {
    activateTypekit(kitId);
  };
  document.head.appendChild(script);
  watchTypekitFontFaces();
}

function themeFontLinkId(url: string): string {
  return `font-url-${btoa(url).substring(0, 20)}`;
}

function removeCurrentThemeFontLink(): void {
  if (!currentThemeFontUrl) return;
  document.getElementById(themeFontLinkId(currentThemeFontUrl))?.remove();
  currentThemeFontUrl = undefined;
}

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
 * 테마의 typography.fontFamily를 기반으로 폰트 로드.
 * Adobe Fonts 동적 키트(.js)는 스크립트를 넣고, 그 외 http(s) URL만 스타일시트를 만든다.
 */
export function loadThemeFont(fontFamily?: string): void {
  const kitId = fontFamily ? typekitKitIdFromUrl(fontFamily) : undefined;
  if (kitId) {
    removeCurrentThemeFontLink();
    loadTypekitKit(kitId);
    currentThemeFontUrl = fontFamily;
    return;
  }

  if (!fontFamily || !isHttpUrl(fontFamily)) {
    removeCurrentThemeFontLink();
    return;
  }

  if (currentThemeFontUrl && currentThemeFontUrl !== fontFamily) {
    document.getElementById(themeFontLinkId(currentThemeFontUrl))?.remove();
  }

  if (currentThemeFontUrl === fontFamily) {
    if (document.getElementById(themeFontLinkId(fontFamily))) {
      return;
    }
  }

  const linkId = themeFontLinkId(fontFamily);
  const link = document.createElement("link");
  link.id = linkId;
  link.rel = "stylesheet";
  link.href = fontFamily;
  link.crossOrigin = "anonymous";

  document.head.appendChild(link);
  currentThemeFontUrl = fontFamily;
}
