/**
 * 이미지 빈칸 PCI 파싱 + 좌표·폰트 계산.
 *
 * 저작(`editor/utils/imageBlank.ts`, `ImageBlankOverlay`)의 계산을 복사한 것이다.
 * RQTI는 단독 라이브러리가 될 수 있어 `@/modules/editor`를 참조하지 않는다.
 * 계수(1.5 / 2.5 / 2.8 / 4)와 `screenFont = regionBaseFont * scale` 은 저작과 같아야 하며,
 * 저작 계수가 바뀌면 이 파일도 같이 고친다.
 */

export const IMAGE_INPUT_BLANK_TYPE = "image-input-blank";

/** 저작 `ImageBlankConfigType.fontSize` 기본값 */
const DEFAULT_IMAGE_BLANK_FONT_SIZE = 24;

/** 저작 정답 입력과 같은 상한 */
export const IMAGE_BLANK_INPUT_MAX_LENGTH = 50;

type ImageBlankInputType = "text" | "fraction" | "mixedFraction";

interface ImageBlankRegionBase {
  /** `data-region-id`. 정답 ID가 아니다. */
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  /** 있으면 이 영역의 폰트 상한. 없으면 루트 fontSize */
  fontSize?: number;
}

export type ImageBlankRegion =
  | (ImageBlankRegionBase & { inputType: "text"; responseIdentifier: string })
  | (ImageBlankRegionBase & { inputType: "fraction"; numeratorId: string; denominatorId: string })
  | (ImageBlankRegionBase & {
      inputType: "mixedFraction";
      wholeId: string;
      numeratorId: string;
      denominatorId: string;
    });

export interface ImageBlankConfig {
  src: string;
  alt: string;
  /** 저작 기준계. 이미지 naturalWidth로 덮어쓰지 않는다. */
  baseWidth: number;
  baseHeight: number;
  /** 표시 폭(px). 없으면 baseWidth */
  displayWidth?: number;
  fontSize: number;
  regions: ImageBlankRegion[];
}

const IMAGE_BLANK_FONT_FIT_EM = {
  text: { width: 1.5, height: 1.5 },
  fraction: { width: 2.5, height: 2.8 },
  mixedFraction: { width: 4, height: 2.8 },
} as const;

/**
 * 영역 크기에 맞춘 이미지 원본 좌표계 기준 폰트 크기.
 * `fontSize`는 상한이므로 큰 영역에서 자동 확대하지 않는다.
 */
export function getImageBlankRegionFontSize(
  region: ImageBlankRegion,
  defaultFontSize: number
): number {
  const preferredFontSize = Math.max(1, region.fontSize ?? defaultFontSize);
  const fit = IMAGE_BLANK_FONT_FIT_EM[region.inputType];
  const widthFittedFontSize = Math.max(1, region.width) / fit.width;
  const heightFittedFontSize = Math.max(1, region.height) / fit.height;
  return Math.max(1, Math.min(preferredFontSize, widthFittedFontSize, heightFittedFontSize));
}

/** 제출·선언에 쓰는 안쪽 응답 ID. 저작 표시 순서(정수 → 분자 → 분모)와 같다. */
export function getImageBlankRegionResponseIds(region: ImageBlankRegion): string[] {
  if (region.inputType === "text") {
    return region.responseIdentifier ? [region.responseIdentifier] : [];
  }
  const ids =
    region.inputType === "mixedFraction"
      ? [region.wholeId, region.numeratorId, region.denominatorId]
      : [region.numeratorId, region.denominatorId];
  return ids.filter((id) => id !== "");
}

/** 저작과 같은 퍼센트 배치. 화면 px로 굳히지 않는다. */
export function imageBlankPercent(value: number, base: number): string {
  return `${(value / base) * 100}%`;
}

/** 이미지 빈칸 markup 루트. 수식 빈칸 class(`qti-ext-input-blank`)는 보지 않는다. */
function findImageBlankMarkup(element: Element): Element | null {
  return (
    element.querySelector(".qti-ext-image-input-blank") ??
    element.querySelector("qti-interaction-markup > div")
  );
}

function readTrimmed(element: Element, name: string): string {
  return (element.getAttribute(name) ?? "").trim();
}

function readNumber(element: Element, name: string): number | undefined {
  const raw = readTrimmed(element, name);
  if (raw === "") return undefined;
  const value = Number(raw);
  return Number.isFinite(value) ? value : undefined;
}

function readInputType(element: Element): ImageBlankInputType {
  const raw = readTrimmed(element, "data-input-type");
  // 저작 저장 데이터도 inputType 누락은 text로 해석한다.
  return raw === "fraction" || raw === "mixedFraction" ? raw : "text";
}

/** 파트 응답 ID: `data-part` 자식이 명시하면 그 값, 없으면 저작과 같은 `${fractionId}_N` 규칙. */
function readFractionPartId(
  region: Element,
  fractionId: string,
  part: "whole" | "numerator" | "denominator",
  suffix: "W" | "N" | "D"
): string {
  const explicit = region.querySelector(`[data-part="${part}"]`);
  const fromMarkup = explicit ? readTrimmed(explicit, "data-response-identifier") : "";
  if (fromMarkup !== "") return fromMarkup;
  return fractionId === "" ? "" : `${fractionId}_${suffix}`;
}

function parseImageBlankRegion(element: Element, fallbackId: string): ImageBlankRegion | null {
  const x = readNumber(element, "data-x");
  const y = readNumber(element, "data-y");
  const width = readNumber(element, "data-width");
  const height = readNumber(element, "data-height");
  if (x === undefined || y === undefined) return null;
  if (width === undefined || height === undefined || width <= 0 || height <= 0) return null;

  const id = readTrimmed(element, "data-region-id") || fallbackId;
  const fontSize = readNumber(element, "data-font-size");
  const base: ImageBlankRegionBase = {
    id,
    x,
    y,
    width,
    height,
    ...(fontSize === undefined ? {} : { fontSize }),
  };
  const inputType = readInputType(element);

  if (inputType === "text") {
    const responseIdentifier = readTrimmed(element, "data-response-identifier");
    // 응답 ID가 없으면 제출할 수 없으므로 칸을 그리지 않는다.
    if (responseIdentifier === "") return null;
    return { ...base, inputType, responseIdentifier };
  }

  const fractionId = readTrimmed(element, "data-fraction-id");
  const numeratorId = readFractionPartId(element, fractionId, "numerator", "N");
  const denominatorId = readFractionPartId(element, fractionId, "denominator", "D");
  if (numeratorId === "" || denominatorId === "") return null;

  if (inputType === "mixedFraction") {
    const wholeId = readFractionPartId(element, fractionId, "whole", "W");
    if (wholeId === "") return null;
    return { ...base, inputType, wholeId, numeratorId, denominatorId };
  }
  return { ...base, inputType, numeratorId, denominatorId };
}

/** PCI 요소 → 렌더 설정. 기준계가 없으면 그릴 수 없으므로 null. */
export function parseImageBlankConfig(element: Element): ImageBlankConfig | null {
  const markup = findImageBlankMarkup(element);
  if (!markup) return null;

  const baseWidth = readNumber(markup, "data-width");
  const baseHeight = readNumber(markup, "data-height");
  if (!baseWidth || !baseHeight || baseWidth <= 0 || baseHeight <= 0) return null;

  const src = readTrimmed(markup, "data-src");
  if (src === "") return null;

  const displayWidth = readNumber(markup, "data-display-width");
  const fontSize = readNumber(markup, "data-font-size");
  const regions: ImageBlankRegion[] = [];
  markup.querySelectorAll("[data-x]").forEach((regionElement, index) => {
    const region = parseImageBlankRegion(regionElement, `image-blank-region-${index}`);
    if (region) regions.push(region);
  });

  return {
    src,
    alt: readTrimmed(markup, "data-alt"),
    baseWidth,
    baseHeight,
    ...(displayWidth !== undefined && displayWidth > 0 ? { displayWidth } : {}),
    fontSize: fontSize !== undefined && fontSize > 0 ? fontSize : DEFAULT_IMAGE_BLANK_FONT_SIZE,
    regions,
  };
}

export function isImageInputBlankPci(element: Element): boolean {
  return element.getAttribute("custom-interaction-type-identifier") === IMAGE_INPUT_BLANK_TYPE;
}

/**
 * PCI 안쪽 칸의 응답 ID. 제출·조회는 루트 `IMAGE_RESPONSE_N`이 아니라 이 ID를 키로 쓴다.
 * 루트는 BE가 QTI record로 묶을 때만 쓰는 내부 표현이다.
 */
export function collectImageBlankCellIds(element: Element): string[] {
  const config = parseImageBlankConfig(element);
  return config ? config.regions.flatMap(getImageBlankRegionResponseIds) : [];
}

/** CLOZE `canSubmit` 기대 개수용. 제출 키가 칸 단위이므로 이미지가 아니라 칸을 센다. */
export function countImageBlankCellsInItemXml(xml: string): number {
  if (!xml.trim()) return 0;
  const doc = new DOMParser().parseFromString(xml, "text/xml");
  if (doc.querySelector("parsererror")) return 0;

  let count = 0;
  doc.querySelectorAll("qti-portable-custom-interaction").forEach((pci) => {
    if (isImageInputBlankPci(pci)) count += collectImageBlankCellIds(pci).length;
  });
  return count;
}
