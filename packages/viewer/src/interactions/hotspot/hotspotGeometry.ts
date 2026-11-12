export interface HotspotImage {
  src: string;
  alt: string;
  /** 영역 좌표의 기준 크기. `coords`는 이 픽셀이다. */
  width: number;
  height: number;
  /** 리사이즈된 표시 크기. 있으면 기준 크기보다 우선한다. */
  displayWidth?: number;
  displayHeight?: number;
}

export type HotspotShape =
  | { kind: "rect"; x: number; y: number; width: number; height: number }
  | { kind: "circle"; cx: number; cy: number; r: number }
  | { kind: "ellipse"; cx: number; cy: number; rx: number; ry: number; rotation: number }
  | { kind: "poly"; points: string };

/** 학생이 찍는 표시 도형. 클릭 영역 `shape`와 별개다. triangle은 삼각형, poly는 다각형이다. */
export const HOTSPOT_MARKER_KINDS = ["circle", "rect", "triangle", "poly", "check"] as const;
export type HotspotMarkerKind = (typeof HOTSPOT_MARKER_KINDS)[number];

export function isHotspotMarkerKind(value: string): value is HotspotMarkerKind {
  return (HOTSPOT_MARKER_KINDS as readonly string[]).includes(value);
}

/** 선택했을 때 영역 안에 그리는 툴. 클릭 판정에는 쓰지 않는다. check는 열린 세 점 선이다. */
export type HotspotMarkerShape =
  | { kind: "circle"; cx: number; cy: number; r: number }
  | { kind: "rect"; x: number; y: number; width: number; height: number }
  | { kind: "triangle"; points: string }
  | { kind: "poly"; points: string }
  | { kind: "check"; points: string };

export interface HotspotChoice {
  identifier: string;
  label: string;
  shape: HotspotShape;
  /** XML `data-marker-shape`. 좌표가 깨져 마커를 못 그려도 툴바 종류에는 포함한다. */
  markerKind?: HotspotMarkerKind;
  marker?: HotspotMarkerShape;
  /** `data-answer-region`. 동시 입력 모드에서만 채운다. */
  answerRegion?: boolean;
  /** `data-answer-group`. 같은 값끼리 한 쌍이고, 그 쌍은 같은 도형이어야 정답이다. */
  answerGroup?: string;
}

/** 학생 도형의 기준값. `[영역ID, 도형]` 쌍이다. */
export const HOTSPOT_SHAPES_RESPONSE_ID = "RESPONSE_SHAPES";

/** 리뷰용 마커 스냅샷. 채점 식별자와 분리한다. */
export const HOTSPOT_GEOMETRY_RESPONSE_ID = "RESPONSE_GEOMETRY";

export interface HotspotModel {
  responseIdentifier: string;
  /** 0이면 개수 제한 없음. 1이면 단일 선택. */
  maxChoices: number;
  /** 클릭 지점에 찍는 툴 크기. 이미지 기준 픽셀. */
  answerMarkerSize: number;
  /** `data-marker-shapes`. 학생 툴바에 보일 도형이다. 없으면 choice 도형을 모은다. */
  markerShapes?: HotspotMarkerKind[];
  /** `data-groups="true"`. 같은 그룹은 같은 도형일 때 정답이고, 그룹 밖은 지정 도형과 맞아야 한다. */
  grouped: boolean;
  /**
   * `data-overlap-selection`.
   * 없으면 맨 위 영역 하나만 선택한다.
   * `invalid`면 모드나 영역 역할을 믿을 수 없어 입력을 받지 않는다.
   */
  overlapSelection?: "all-answer-regions" | "invalid";
  image: HotspotImage;
  choices: HotspotChoice[];
}

const MEDIA_TAGS = new Set(["img", "object", "qti-object"]);

function parseCoordList(raw: string | null): number[] | null {
  if (!raw?.trim()) return null;
  const parts = raw
    .trim()
    .split(/[\s,]+/)
    .filter(Boolean);
  const nums = parts.map((part) => Number(part));
  if (nums.length === 0 || nums.some((value) => !Number.isFinite(value))) return null;
  return nums;
}

function readPositive(element: Element, name: string): number | null {
  const value = Number(element.getAttribute(name));
  return Number.isFinite(value) && value > 0 ? value : null;
}

/** 타원만 읽는다. 없거나 숫자가 아니면 0°, 유한수는 [0, 360). */
export function readEllipseRotation(element: Element): number {
  const raw = element.getAttribute("data-rotation");
  if (raw === null || raw.trim() === "") return 0;
  const value = Number(raw.trim());
  if (!Number.isFinite(value)) return 0;
  return ((value % 360) + 360) % 360;
}

function readMaxChoices(element: Element): number {
  const raw = element.getAttribute("max-choices");
  if (raw === null || raw.trim() === "") return 0;
  const value = Number(raw);
  if (!Number.isFinite(value) || value <= 0) return 0;
  return Math.floor(value);
}

function readDisplaySize(media: Element, interaction: Element, name: string): number | undefined {
  return readPositive(media, name) ?? readPositive(interaction, name) ?? undefined;
}

/**
 * 화면에 그릴 크기. 리사이즈 값이 있으면 그것을 쓰고, 한 축만 있으면 기준 비율로 나머지를 맞춘다.
 * 영역 좌표의 기준 크기는 바꾸지 않는다.
 */
export function hotspotRenderedSize(image: HotspotImage): { width: number; height: number } {
  const { width, height, displayWidth, displayHeight } = image;
  if (displayWidth && displayHeight) return { width: displayWidth, height: displayHeight };
  if (displayWidth) return { width: displayWidth, height: (displayWidth * height) / width };
  if (displayHeight) return { width: (displayHeight * width) / height, height: displayHeight };
  return { width, height };
}

function readImage(element: Element): HotspotImage | null {
  const media = Array.from(element.children).find((child) =>
    MEDIA_TAGS.has(child.tagName.toLowerCase())
  );
  if (!media) return null;

  const tag = media.tagName.toLowerCase();
  const src =
    tag === "img"
      ? media.getAttribute("src") || media.getAttribute("data-src")
      : media.getAttribute("data") || media.getAttribute("src") || media.getAttribute("data-src");
  const width = readPositive(media, "width");
  const height = readPositive(media, "height");
  if (!src || !width || !height) return null;

  const displayWidth = readDisplaySize(media, element, "data-display-width");
  const displayHeight = readDisplaySize(media, element, "data-display-height");

  return {
    src,
    alt: media.getAttribute("alt") ?? "",
    width,
    height,
    ...(displayWidth ? { displayWidth } : {}),
    ...(displayHeight ? { displayHeight } : {}),
  };
}

function readShape(element: Element): HotspotShape | null {
  const shape = element.getAttribute("shape")?.trim().toLowerCase();
  const coords = parseCoordList(element.getAttribute("coords"));
  if (!shape || !coords) return null;

  if (shape === "rect" && coords.length === 4) {
    const [left, top, right, bottom] = coords;
    const width = right - left;
    const height = bottom - top;
    if (width <= 0 || height <= 0) return null;
    return { kind: "rect", x: left, y: top, width, height };
  }

  if (shape === "circle" && coords.length === 3) {
    const [cx, cy, r] = coords;
    if (r <= 0) return null;
    return { kind: "circle", cx, cy, r };
  }

  if (shape === "ellipse" && coords.length === 4) {
    const [cx, cy, rx, ry] = coords;
    if (rx <= 0 || ry <= 0) return null;
    return { kind: "ellipse", cx, cy, rx, ry, rotation: readEllipseRotation(element) };
  }

  if (shape === "poly" && coords.length >= 6 && coords.length % 2 === 0) {
    const points = Array.from({ length: coords.length / 2 }, (_, index) => {
      const x = coords[index * 2];
      const y = coords[index * 2 + 1];
      return `${x},${y}`;
    }).join(" ");
    return { kind: "poly", points };
  }

  return null;
}

function pairCoords(coords: number[]): string {
  return Array.from({ length: coords.length / 2 }, (_, index) => {
    const x = coords[index * 2];
    const y = coords[index * 2 + 1];
    return `${x},${y}`;
  }).join(" ");
}

function readMarkerShape(
  shapeName: string | null | undefined,
  coords: number[] | null
): HotspotMarkerShape | null {
  const shape = shapeName?.trim().toLowerCase();
  if (!shape || !coords) return null;

  if (shape === "circle" && coords.length === 3) {
    const [cx, cy, r] = coords;
    if (r <= 0) return null;
    return { kind: "circle", cx, cy, r };
  }

  if (shape === "rect" && coords.length === 4) {
    const [left, top, right, bottom] = coords;
    const width = right - left;
    const height = bottom - top;
    if (width <= 0 || height <= 0) return null;
    return { kind: "rect", x: left, y: top, width, height };
  }

  if (shape === "check" && coords.length === 6) {
    return { kind: "check", points: pairCoords(coords) };
  }

  if (shape === "triangle" && coords.length === 6) {
    return { kind: "triangle", points: pairCoords(coords) };
  }

  if (shape === "poly" && coords.length >= 6 && coords.length % 2 === 0) {
    return { kind: "poly", points: pairCoords(coords) };
  }

  return null;
}

function readMarkerKind(element: Element): HotspotMarkerKind | undefined {
  const shape = element.getAttribute("data-marker-shape")?.trim().toLowerCase();
  return shape && isHotspotMarkerKind(shape) ? shape : undefined;
}

function readMarker(element: Element): HotspotMarkerShape | undefined {
  return (
    readMarkerShape(
      element.getAttribute("data-marker-shape"),
      parseCoordList(element.getAttribute("data-marker-coords"))
    ) ?? undefined
  );
}

/** `identifier|markerShape|coords`. `|`는 앞에서 두 번만 나눈다. */
export function parseHotspotGeometryValue(
  raw: string
): { identifier: string; shape: HotspotMarkerShape } | null {
  const first = raw.indexOf("|");
  if (first <= 0) return null;
  const second = raw.indexOf("|", first + 1);
  if (second <= first + 1) return null;
  const identifier = raw.slice(0, first).trim();
  const shape = readMarkerShape(
    raw.slice(first + 1, second),
    parseCoordList(raw.slice(second + 1))
  );
  if (!identifier || !shape) return null;
  return { identifier, shape };
}

export function formatHotspotGeometry(identifier: string, marker: HotspotMarkerShape): string {
  const coords =
    marker.kind === "circle"
      ? `${marker.cx},${marker.cy},${marker.r}`
      : marker.kind === "rect"
        ? `${marker.x},${marker.y},${marker.x + marker.width},${marker.y + marker.height}`
        : marker.points.split(" ").join(",");
  return `${identifier}|${marker.kind}|${coords}`;
}

export function markerStampSize(marker: HotspotMarkerShape | undefined, fallback: number): number {
  if (marker?.kind === "circle") return marker.r;
  if (marker?.kind === "rect") return marker.width > 0 ? marker.width / 2 : fallback;
  if (marker?.kind === "triangle" || marker?.kind === "check") {
    const [x1, , x2] = marker.points.split(/[\s,]+/).map(Number);
    const span = marker.kind === "check" ? Math.abs(x2 - x1) / 2 : Math.abs(x2 - x1);
    if (Number.isFinite(span) && span > 0) return span;
  }
  if (marker?.kind === "poly") {
    const span = polyRadius(marker);
    if (span > 0) return span;
  }
  return fallback;
}

const FIT_EPSILON = 1e-3;

interface Point {
  x: number;
  y: number;
}

function markerAt(
  kind: Exclude<HotspotMarkerKind, "poly">,
  x: number,
  y: number,
  size: number
): HotspotMarkerShape {
  const radius = Math.max(1, size);
  if (kind === "triangle") {
    return {
      kind: "triangle",
      points: `${x},${y - radius} ${x + radius},${y + radius} ${x - radius},${y + radius}`,
    };
  }
  if (kind === "rect") {
    return {
      kind: "rect",
      x: x - radius,
      y: y - radius,
      width: radius * 2,
      height: radius * 2,
    };
  }
  if (kind === "check") {
    const third = Math.round(radius / 3);
    return {
      kind: "check",
      points: `${x - radius},${y} ${x - third},${y + radius} ${x + radius},${y - radius}`,
    };
  }
  return { kind: "circle", cx: x, cy: y, r: radius };
}

function roundPointList(points: string): string {
  return points
    .split(/\s+/)
    .map((pair) => {
      const [x, y] = pair.split(",").map(Number);
      return `${Math.round(x)},${Math.round(y)}`;
    })
    .join(" ");
}

function roundHotspotMarker(marker: HotspotMarkerShape): HotspotMarkerShape {
  if (marker.kind === "circle") {
    return { kind: "circle", cx: Math.round(marker.cx), cy: Math.round(marker.cy), r: marker.r };
  }
  if (marker.kind === "rect") {
    const left = Math.round(marker.x);
    const top = Math.round(marker.y);
    const width = Math.round(marker.x + marker.width) - left;
    const height = Math.round(marker.y + marker.height) - top;
    return {
      kind: "rect",
      x: left,
      y: top,
      width: Math.max(1, width),
      height: Math.max(1, height),
    };
  }
  return { kind: marker.kind, points: roundPointList(marker.points) };
}

/** 클릭한 이미지 좌표를 중심으로 표시 도형을 만든다. poly는 넘긴 좌표의 다각형을 그 중심으로 옮긴다. */
export function placeHotspotMarker(
  kind: HotspotMarkerKind,
  x: number,
  y: number,
  size: number,
  polyPoints?: string
): HotspotMarkerShape {
  if (kind === "poly") {
    return roundHotspotMarker(movePoly({ kind: "poly", points: polyPoints ?? "" }, x, y));
  }
  return roundHotspotMarker(markerAt(kind, x, y, size));
}

/** 표시의 중심. */
export function hotspotMarkerCenter(marker: HotspotMarkerShape): { x: number; y: number } {
  const placement = markerPlacement(marker);
  return { x: placement.x, y: placement.y };
}

function markerPlacement(marker: HotspotMarkerShape): {
  kind: HotspotMarkerKind;
  x: number;
  y: number;
  size: number;
} {
  if (marker.kind === "circle") {
    return { kind: marker.kind, x: marker.cx, y: marker.cy, size: marker.r };
  }
  if (marker.kind === "rect") {
    const size = marker.width / 2;
    return {
      kind: marker.kind,
      x: marker.x + marker.width / 2,
      y: marker.y + marker.height / 2,
      size: size > 0 ? size : 1,
    };
  }
  if (marker.kind === "check") {
    const [x0, y0, , , x2] = marker.points.split(/[\s,]+/).map(Number);
    const size = Math.abs(x2 - x0) / 2;
    return {
      kind: marker.kind,
      x: x0 + (x2 - x0) / 2,
      y: y0,
      size: size > 0 ? size : 1,
    };
  }
  if (marker.kind === "triangle") {
    const [x, y, right] = marker.points.split(/[\s,]+/).map(Number);
    const size = Math.abs(right - x);
    return { kind: marker.kind, x, y: y + size, size: size > 0 ? size : 1 };
  }
  const center = pointsCenter(readPointList(marker.points));
  const size = polyRadius(marker);
  return { kind: "poly", x: center.x, y: center.y, size: size > 0 ? size : 1 };
}

function inflateMarker(marker: HotspotMarkerShape, padding: number) {
  if (padding <= 0) return marker;
  if (marker.kind === "poly") return scalePoly(marker, padding);
  const placement = markerPlacement(marker);
  if (placement.kind === "poly") return marker;
  return markerAt(placement.kind, placement.x, placement.y, placement.size + padding);
}

function readPointList(points: string): Point[] {
  return points.split(/\s+/).flatMap((pair) => {
    const [x, y] = pair.split(",").map(Number);
    return Number.isFinite(x) && Number.isFinite(y) ? [{ x, y }] : [];
  });
}

function hotspotMarkerBounds(marker: HotspotMarkerShape): {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
} | null {
  if (marker.kind === "circle") {
    return {
      minX: marker.cx - marker.r,
      minY: marker.cy - marker.r,
      maxX: marker.cx + marker.r,
      maxY: marker.cy + marker.r,
    };
  }
  if (marker.kind === "rect") {
    return {
      minX: marker.x,
      minY: marker.y,
      maxX: marker.x + marker.width,
      maxY: marker.y + marker.height,
    };
  }
  const points = readPointList(marker.points);
  if (points.length === 0) return null;
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const point of points) {
    minX = Math.min(minX, point.x);
    minY = Math.min(minY, point.y);
    maxX = Math.max(maxX, point.x);
    maxY = Math.max(maxY, point.y);
  }
  return { minX, minY, maxX, maxY };
}

/** 마커와 화면 획이 이미지 밖으로 나간 만큼. 단위는 이미지 픽셀이다. */
export function hotspotMarkerOverflow(
  markers: readonly HotspotMarkerShape[],
  width: number,
  height: number,
  strokePadX: number,
  strokePadY = strokePadX
): { left: number; top: number; right: number; bottom: number } {
  let minX = 0;
  let minY = 0;
  let maxX = width;
  let maxY = height;
  for (const marker of markers) {
    const box = hotspotMarkerBounds(marker);
    if (!box) continue;
    minX = Math.min(minX, box.minX - strokePadX);
    minY = Math.min(minY, box.minY - strokePadY);
    maxX = Math.max(maxX, box.maxX + strokePadX);
    maxY = Math.max(maxY, box.maxY + strokePadY);
  }
  return {
    left: Math.max(0, -minX),
    top: Math.max(0, -minY),
    right: Math.max(0, maxX - width),
    bottom: Math.max(0, maxY - height),
  };
}

function onSegment(point: Point, start: Point, end: Point) {
  const cross = (point.y - start.y) * (end.x - start.x) - (point.x - start.x) * (end.y - start.y);
  if (Math.abs(cross) > 1e-6) return false;
  const dot = (point.x - start.x) * (end.x - start.x) + (point.y - start.y) * (end.y - start.y);
  if (dot < -1e-6) return false;
  const length2 = (end.x - start.x) ** 2 + (end.y - start.y) ** 2;
  return dot <= length2 + 1e-6;
}

function pointInPolygon(point: Point, polygon: Point[]) {
  let inside = false;
  for (let index = 0, previous = polygon.length - 1; index < polygon.length; previous = index++) {
    const start = polygon[previous];
    const end = polygon[index];
    if (onSegment(point, start, end)) return true;
    if (
      start.y > point.y !== end.y > point.y &&
      point.x < ((end.x - start.x) * (point.y - start.y)) / (end.y - start.y) + start.x
    ) {
      inside = !inside;
    }
  }
  return inside;
}

function distanceToSegment(point: Point, start: Point, end: Point) {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const length2 = dx * dx + dy * dy;
  if (length2 === 0) return Math.hypot(point.x - start.x, point.y - start.y);
  const t = Math.min(
    1,
    Math.max(0, ((point.x - start.x) * dx + (point.y - start.y) * dy) / length2)
  );
  return Math.hypot(point.x - (start.x + t * dx), point.y - (start.y + t * dy));
}

function pointInShape(point: Point, shape: HotspotShape) {
  if (shape.kind === "rect") {
    return (
      point.x >= shape.x - FIT_EPSILON &&
      point.y >= shape.y - FIT_EPSILON &&
      point.x <= shape.x + shape.width + FIT_EPSILON &&
      point.y <= shape.y + shape.height + FIT_EPSILON
    );
  }
  if (shape.kind === "circle") {
    return Math.hypot(point.x - shape.cx, point.y - shape.cy) <= shape.r + FIT_EPSILON;
  }
  if (shape.kind === "ellipse") {
    const rad = (shape.rotation * Math.PI) / 180;
    const cos = Math.cos(rad);
    const sin = Math.sin(rad);
    const dx = point.x - shape.cx;
    const dy = point.y - shape.cy;
    const localX = dx * cos + dy * sin;
    const localY = -dx * sin + dy * cos;
    return (localX / shape.rx) ** 2 + (localY / shape.ry) ** 2 <= 1 + FIT_EPSILON;
  }
  const polygon = readPointList(shape.points);
  return polygon.length >= 3 && pointInPolygon(point, polygon);
}

function polyRadius(marker: Extract<HotspotMarkerShape, { kind: "poly" }>): number {
  const points = readPointList(marker.points);
  if (points.length === 0) return 0;
  const center = pointsCenter(points);
  return Math.max(...points.map((point) => Math.hypot(point.x - center.x, point.y - center.y)));
}

/** 다각형의 점 배치는 유지하고 무게중심만 옮긴다. 세 점이면 삼각형이다. */
function movePoly(
  marker: Extract<HotspotMarkerShape, { kind: "poly" }>,
  x: number,
  y: number
): HotspotMarkerShape {
  const points = readPointList(marker.points);
  const center = pointsCenter(points);
  const dx = x - center.x;
  const dy = y - center.y;
  return {
    kind: "poly",
    points: points.map((point) => `${point.x + dx},${point.y + dy}`).join(" "),
  };
}

function scalePoly(
  marker: Extract<HotspotMarkerShape, { kind: "poly" }>,
  padding: number
): HotspotMarkerShape {
  const points = readPointList(marker.points);
  const center = pointsCenter(points);
  const size = polyRadius(marker);
  if (!(size > 0)) return marker;
  const factor = (size + padding) / size;
  return {
    kind: "poly",
    points: points
      .map(
        (point) =>
          `${center.x + (point.x - center.x) * factor},${center.y + (point.y - center.y) * factor}`
      )
      .join(" "),
  };
}

function relocateMarker(marker: HotspotMarkerShape, x: number, y: number): HotspotMarkerShape {
  if (marker.kind === "poly") return movePoly(marker, x, y);
  const placement = markerPlacement(marker);
  if (placement.kind === "poly") return marker;
  return markerAt(placement.kind, x, y, placement.size);
}

function pointsCenter(points: readonly Point[]): Point {
  if (points.length === 0) return { x: 0, y: 0 };
  return {
    x: points.reduce((sum, point) => sum + point.x, 0) / points.length,
    y: points.reduce((sum, point) => sum + point.y, 0) / points.length,
  };
}

function markerOutline(marker: HotspotMarkerShape): Point[] {
  if (marker.kind === "triangle" || marker.kind === "poly" || marker.kind === "check") {
    return readPointList(marker.points);
  }
  if (marker.kind === "rect") {
    return [
      { x: marker.x, y: marker.y },
      { x: marker.x + marker.width, y: marker.y },
      { x: marker.x + marker.width, y: marker.y + marker.height },
      { x: marker.x, y: marker.y + marker.height },
    ];
  }
  const count = 32;
  return Array.from({ length: count }, (_, index) => {
    const angle = (index / count) * Math.PI * 2;
    return {
      x: marker.cx + marker.r * Math.cos(angle),
      y: marker.cy + marker.r * Math.sin(angle),
    };
  });
}

function markerFits(shape: HotspotShape, marker: HotspotMarkerShape) {
  if (marker.kind === "circle" && shape.kind === "circle") {
    return (
      Math.hypot(marker.cx - shape.cx, marker.cy - shape.cy) + marker.r <= shape.r + FIT_EPSILON
    );
  }
  if (marker.kind === "circle" && shape.kind === "rect") {
    return (
      marker.cx - marker.r >= shape.x - FIT_EPSILON &&
      marker.cy - marker.r >= shape.y - FIT_EPSILON &&
      marker.cx + marker.r <= shape.x + shape.width + FIT_EPSILON &&
      marker.cy + marker.r <= shape.y + shape.height + FIT_EPSILON
    );
  }
  if (marker.kind === "circle" && shape.kind === "poly") {
    const polygon = readPointList(shape.points);
    const center = { x: marker.cx, y: marker.cy };
    if (polygon.length < 3 || !pointInPolygon(center, polygon)) return false;
    const clearance = Math.min(
      ...polygon.map((point, index) =>
        distanceToSegment(center, point, polygon[(index + 1) % polygon.length])
      )
    );
    return clearance + FIT_EPSILON >= marker.r;
  }
  return markerOutline(marker).every((point) => pointInShape(point, shape));
}

function interiorPoint(shape: HotspotShape): Point {
  if (shape.kind === "circle" || shape.kind === "ellipse") return { x: shape.cx, y: shape.cy };
  if (shape.kind === "rect") {
    return { x: shape.x + shape.width / 2, y: shape.y + shape.height / 2 };
  }
  const polygon = readPointList(shape.points);
  let twiceArea = 0;
  let x = 0;
  let y = 0;
  for (let index = 0; index < polygon.length; index += 1) {
    const start = polygon[index];
    const end = polygon[(index + 1) % polygon.length];
    const cross = start.x * end.y - end.x * start.y;
    twiceArea += cross;
    x += (start.x + end.x) * cross;
    y += (start.y + end.y) * cross;
  }
  if (polygon.length === 0 || Math.abs(twiceArea) < 1e-6) {
    const count = polygon.length || 1;
    return {
      x: polygon.reduce((sum, point) => sum + point.x, 0) / count,
      y: polygon.reduce((sum, point) => sum + point.y, 0) / count,
    };
  }
  return { x: x / (3 * twiceArea), y: y / (3 * twiceArea) };
}

function shiftMarkerInside(
  region: HotspotShape,
  marker: HotspotMarkerShape,
  padding: number
): HotspotMarkerShape | null {
  const placement = markerPlacement(marker);
  const at = (point: Point) => relocateMarker(marker, point.x, point.y);
  const fits = (candidate: HotspotMarkerShape) =>
    markerFits(region, inflateMarker(candidate, padding));
  if (fits(marker)) return marker;

  const anchor = interiorPoint(region);
  const anchored = at(anchor);
  if (!fits(anchored)) return null;

  const origin = { x: placement.x, y: placement.y };
  let high = 1;
  let low = 0;
  for (let step = 0; step < 20; step += 1) {
    const t = (low + high) / 2;
    const point = {
      x: origin.x + (anchor.x - origin.x) * t,
      y: origin.y + (anchor.y - origin.y) * t,
    };
    if (fits(at(point))) high = t;
    else low = t;
  }
  const fitted = at({
    x: origin.x + (anchor.x - origin.x) * high,
    y: origin.y + (anchor.y - origin.y) * high,
  });
  const rounded = roundHotspotMarker(fitted);
  if (fits(rounded)) return rounded;

  for (let step = 1; step <= 12; step += 1) {
    const t = Math.min(1, high + step / 12);
    const next = roundHotspotMarker(
      at({
        x: origin.x + (anchor.x - origin.x) * t,
        y: origin.y + (anchor.y - origin.y) * t,
      })
    );
    if (fits(next)) return next;
  }
  const centered = roundHotspotMarker(anchored);
  return fits(centered) ? centered : null;
}

/**
 * 마커 도형 전체가 선택 영역 안에 들어가도록 중심을 옮긴다.
 * `padding`은 획이 경계에 잘리지 않도록 더 안쪽에 둘 여백이다.
 * 여백까지는 들어가지 않으면 도형만 맞추고, 그래도 안 되면 영역 중심에 둔다.
 */
export function containHotspotMarker(
  region: HotspotShape,
  marker: HotspotMarkerShape,
  padding = 0
): HotspotMarkerShape {
  const anchor = interiorPoint(region);
  return (
    shiftMarkerInside(region, marker, padding) ??
    (padding > 0 ? shiftMarkerInside(region, marker, 0) : null) ??
    roundHotspotMarker(relocateMarker(marker, anchor.x, anchor.y))
  );
}

/** 좌표가 없을 때 영역 중심과 기준 크기로 표시 도형을 만든다. */
export function placeDefaultHotspotMarker(
  region: HotspotShape,
  kind: HotspotMarkerKind,
  size: number,
  polyPoints?: string
): HotspotMarkerShape {
  const center = interiorPoint(region);
  return placeHotspotMarker(kind, center.x, center.y, size, polyPoints);
}

/** 툴바 노출 순서. 앞에 있을수록 기본 선택이다. */
const HOTSPOT_MARKER_TOOLBAR_ORDER = HOTSPOT_MARKER_KINDS;

export function isHotspotGrouped(element: Element): boolean {
  return element.getAttribute("data-groups")?.trim().toLowerCase() === "true";
}

/** 그룹 채점 도형. 응답 처리의 쌍 조건과 같다. triangle은 쌍 정답에 넣지 않는다. */
const GROUP_PAIR_SHAPES = new Set<HotspotMarkerKind>(["circle", "rect", "poly", "check"]);

export interface HotspotGroupMember {
  chosen: boolean;
  studentShape?: HotspotMarkerKind;
}

/** 같은 그룹의 모든 영역이 선택되고, 채점 도형이 하나일 때 그 쌍은 정답이다. */
export function hotspotGroupPairCorrect(members: readonly HotspotGroupMember[]): boolean {
  if (members.length === 0 || members.some((member) => !member.chosen)) return false;
  const shape = members[0]?.studentShape;
  if (!shape || !GROUP_PAIR_SHAPES.has(shape)) return false;
  return members.every((member) => member.studentShape === shape);
}

/**
 * 제출 후 영역 색.
 * 그룹에 묶인 영역은 그 쌍이 같은 도형일 때만 정답이다.
 * 그룹이 아니면 그 영역의 정답 도형과 학생이 찍은 도형이 같아야 한다.
 */
export function hotspotAreaFeedback(input: {
  submitted: boolean;
  grouped: boolean;
  itemCorrect: boolean;
  chosen: boolean;
  correctIds: readonly string[];
  regionId: string;
  studentShape?: HotspotMarkerKind;
  answerShape?: HotspotMarkerKind;
  /** 같은 `data-answer-group` 구성. 그룹에 묶인 영역만 넘긴다. */
  groupMembers?: readonly HotspotGroupMember[];
}): "correct" | "incorrect" | undefined {
  if (!input.submitted || !input.chosen) return undefined;
  const regionCorrect =
    input.correctIds.length > 0 ? input.correctIds.includes(input.regionId) : input.itemCorrect;
  if (!regionCorrect) return "incorrect";
  if (input.grouped && input.groupMembers) {
    return hotspotGroupPairCorrect(input.groupMembers) ? "correct" : "incorrect";
  }
  const expected = input.answerShape ?? "circle";
  return input.studentShape === expected ? "correct" : "incorrect";
}

/** interaction `data-marker-shapes`. 공백 구분이고 모르는 토큰은 버린다. 속성이 없거나 비면 undefined다. */
function readDeclaredMarkerShapes(element: Element): HotspotMarkerKind[] | undefined {
  const raw = element.getAttribute("data-marker-shapes");
  if (raw === null) return undefined;
  const kinds = raw
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .filter((token): token is HotspotMarkerKind => isHotspotMarkerKind(token));
  return kinds.length > 0 ? [...new Set(kinds)] : undefined;
}

/**
 * 툴바 도형 종류. 우선순위 순으로 두고, 첫 항목이 기본 선택이다.
 * `data-marker-shapes`가 있으면 그것만 쓴다. 없는 옛 XML은 choice의 `data-marker-shape`를 모은다.
 */
export function hotspotMarkerKinds(
  choices: readonly HotspotChoice[],
  declared?: readonly HotspotMarkerKind[]
): HotspotMarkerKind[] {
  const present = new Set<HotspotMarkerKind>(declared);
  if (!declared) {
    for (const choice of choices) {
      if (choice.markerKind) present.add(choice.markerKind);
    }
  }
  return HOTSPOT_MARKER_TOOLBAR_ORDER.filter((kind) => present.has(kind));
}

/** RESPONSE_SHAPES에 넣을 값. 선택한 영역마다 `[영역ID, 도형]` 하나다. */
export function buildHotspotShapes(
  ids: readonly string[],
  placed: Readonly<Record<string, HotspotMarkerShape>>
): Array<[string, string]> {
  return ids.flatMap((id) => {
    const marker = placed[id];
    return marker ? [[id, marker.kind] as [string, string]] : [];
  });
}

function isShapePair(value: unknown): value is readonly [unknown, unknown] {
  return Array.isArray(value) && value.length === 2;
}

/**
 * 학생 도형 복원. 필드 자체가 없으면 null이다.
 * 빈 배열은 선택된 도형이 없다는 뜻이고, geometry로 도형을 보충하지 않는다.
 */
export function readHotspotShapes(value: unknown): Map<string, HotspotMarkerKind> | null {
  if (value === undefined || value === null) return null;
  const map = new Map<string, HotspotMarkerKind>();
  if (!Array.isArray(value)) return map;
  for (const item of value) {
    if (!isShapePair(item)) continue;
    const [identifier, shape] = item;
    if (typeof identifier !== "string" || identifier.trim() === "") continue;
    if (typeof shape !== "string" || !isHotspotMarkerKind(shape)) continue;
    map.set(identifier, shape);
  }
  return map;
}

/** RESPONSE_GEOMETRY에 넣을 값. 선택한 영역의 마커만 `id|shape|coords`로 넣는다. */
export function buildHotspotGeometry(
  ids: readonly string[],
  placed: Readonly<Record<string, HotspotMarkerShape>>
): string[] {
  return ids.flatMap((id) => {
    const marker = placed[id];
    return marker ? [formatHotspotGeometry(id, marker)] : [];
  });
}

const HOTSPOT_OVERLAP_ALL_ANSWER_REGIONS = "all-answer-regions";

function readOverlapSelection(element: Element): "all-answer-regions" | "invalid" | undefined {
  const raw = element.getAttribute("data-overlap-selection");
  if (raw === null || raw.trim() === "") return undefined;
  return raw.trim() === HOTSPOT_OVERLAP_ALL_ANSWER_REGIONS ? "all-answer-regions" : "invalid";
}

/** `true`/`false`만 역할로 인정한다. 속성이 없거나 다른 값이면 null이다. */
function readAnswerRegion(element: Element): boolean | null {
  const raw = element.getAttribute("data-answer-region");
  if (raw === null) return null;
  const value = raw.trim().toLowerCase();
  if (value === "true") return true;
  if (value === "false") return false;
  return null;
}

/**
 * 클릭 좌표를 포함하는 동시 입력 대상.
 * 정답 영역이 하나라도 있으면 그 ID만, 없으면 문서 순서상 맨 위 일반 영역 하나다.
 */
export function hotspotOverlapTargetIds(
  choices: readonly HotspotChoice[],
  point: { x: number; y: number }
): string[] {
  const hits = choices.filter((choice) => pointInShape(point, choice.shape));
  const answers = hits.filter((choice) => choice.answerRegion === true);
  if (answers.length > 0) return answers.map((choice) => choice.identifier);
  const topNormal = hits.filter((choice) => choice.answerRegion !== true).at(-1);
  return topNormal ? [topNormal.identifier] : [];
}

/** 겹친 대상을 함께 선택하거나, 같은 도형으로 다시 누르면 함께 해제한다. */
export function resolveHotspotOverlapSelection(input: {
  choices: readonly HotspotChoice[];
  currentIds: readonly string[];
  placed: Readonly<Record<string, HotspotMarkerShape>>;
  targetIds: readonly string[];
  maxChoices: number;
  stamp: (choice: HotspotChoice) => HotspotMarkerShape;
}): { ids: string[]; placed: Record<string, HotspotMarkerShape> } | null {
  if (input.targetIds.length === 0) return null;
  const choiceById = new Map(input.choices.map((choice) => [choice.identifier, choice]));
  const targets = input.targetIds.flatMap((id) => {
    const choice = choiceById.get(id);
    return choice ? [choice] : [];
  });
  if (targets.length !== input.targetIds.length) return null;

  const stamped = new Map(targets.map((choice) => [choice.identifier, input.stamp(choice)]));
  const targetSet = new Set(input.targetIds);
  const allSameTool = targets.every((choice) => {
    const marker = stamped.get(choice.identifier);
    const placed = input.placed[choice.identifier];
    return (
      input.currentIds.includes(choice.identifier) &&
      placed !== undefined &&
      marker !== undefined &&
      placed.kind === marker.kind
    );
  });

  if (allSameTool) {
    const ids = input.currentIds.filter((id) => !targetSet.has(id));
    const placed: Record<string, HotspotMarkerShape> = {};
    for (const id of ids) {
      const marker = input.placed[id];
      if (marker) placed[id] = marker;
    }
    return { ids, placed };
  }

  const selected = new Set(input.currentIds);
  const added = input.choices
    .map((choice) => choice.identifier)
    .filter((id) => targetSet.has(id) && !selected.has(id));
  const ids = [...input.currentIds, ...added];
  if (input.maxChoices > 0 && ids.length > input.maxChoices) return null;

  const placed: Record<string, HotspotMarkerShape> = { ...input.placed };
  for (const choice of targets) {
    const marker = stamped.get(choice.identifier);
    if (marker) placed[choice.identifier] = marker;
  }
  return { ids, placed };
}

export function readHotspotGeometry(value: unknown): Map<string, HotspotMarkerShape> {
  const map = new Map<string, HotspotMarkerShape>();
  const list = Array.isArray(value) ? value : typeof value === "string" && value ? [value] : [];
  for (const item of list) {
    if (typeof item !== "string" || !item) continue;
    const parsed = parseHotspotGeometryValue(item);
    if (parsed) map.set(parsed.identifier, parsed.shape);
  }
  return map;
}

export function parseHotspotModel(element: Element): HotspotModel | null {
  const image = readImage(element);
  if (!image) return null;

  const requestedOverlap = readOverlapSelection(element);
  const requireAnswerRegion = requestedOverlap === "all-answer-regions";
  const choices: HotspotChoice[] = [];
  let choiceCount = 0;
  let overlapInvalid = requestedOverlap === "invalid";
  let choiceIndex = 0;
  for (const child of element.children) {
    if (child.tagName.toLowerCase() !== "qti-hotspot-choice") continue;
    choiceCount += 1;
    choiceIndex += 1;
    const identifier = child.getAttribute("identifier")?.trim() ?? "";
    const shape = readShape(child);
    const answerRegion = readAnswerRegion(child);
    if (requireAnswerRegion && (answerRegion === null || !identifier || !shape)) {
      overlapInvalid = true;
    }
    if (!identifier || !shape) continue;
    const label = child.getAttribute("hotspot-label")?.trim() || `영역 ${choiceIndex}`;
    const markerKind = readMarkerKind(child);
    const marker = readMarker(child);
    const answerGroup = child.getAttribute("data-answer-group")?.trim();
    choices.push({
      identifier,
      label,
      shape,
      ...(markerKind ? { markerKind } : {}),
      ...(marker ? { marker } : {}),
      ...(requireAnswerRegion && answerRegion !== null ? { answerRegion } : {}),
      ...(answerGroup ? { answerGroup } : {}),
    });
  }
  if (requireAnswerRegion && choiceCount === 0) overlapInvalid = true;

  const markerSize = Number(element.getAttribute("data-answer-marker-size"));
  const markerShapes = readDeclaredMarkerShapes(element);
  const overlapSelection =
    requestedOverlap === undefined ? undefined : overlapInvalid ? "invalid" : "all-answer-regions";

  return {
    responseIdentifier: element.getAttribute("response-identifier")?.trim() || "RESPONSE",
    maxChoices: readMaxChoices(element),
    answerMarkerSize: Number.isFinite(markerSize) && markerSize > 0 ? markerSize : 10,
    grouped: isHotspotGrouped(element),
    ...(markerShapes ? { markerShapes } : {}),
    ...(overlapSelection ? { overlapSelection } : {}),
    image,
    choices,
  };
}
