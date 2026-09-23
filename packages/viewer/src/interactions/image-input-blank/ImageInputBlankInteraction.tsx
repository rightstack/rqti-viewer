import { type CSSProperties, useLayoutEffect, useMemo, useRef, useState } from "react";
import type { QTIParserOptions, ResponseValue, ResponseValueMap } from "../../types";
import { appendMediaToken, resolveMediaUrl } from "../../utils/urlUtils";
import { ImageBlankRegionContent } from "./ImageBlankRegionContent";
import {
  type ImageBlankConfig,
  getImageBlankRegionFontSize,
  getImageBlankRegionResponseIds,
  imageBlankPercent,
  parseImageBlankConfig,
} from "./utils";

type ImageBlankOptions = Omit<QTIParserOptions, "onResponseChange" | "responses"> & {
  onResponseChange?: (identifier: string, value: ResponseValue) => void;
  responses?: ResponseValueMap;
};

interface ImageInputBlankInteractionProps {
  element: Element;
  options: ImageBlankOptions;
  index: number;
}

function toScalar(raw: unknown): string {
  if (raw === undefined || raw === null) return "";
  if (Array.isArray(raw)) return String(raw[0] ?? "");
  if (typeof raw === "object") return "";
  return String(raw);
}

/**
 * 응답 맵은 두 형태로 들어온다.
 * - 제출·채점: 칸 ID(`RESPONSE_N`, `FRACTION_N_W|N|D`)를 키로 쓰는 평면 맵
 * - 문항 조회 API의 correctAnswer: 루트 `IMAGE_RESPONSE_N`에 칸 순서대로 담긴 배열
 * 칸 ID가 있으면 그것을 쓰고, 없을 때만 루트 배열을 칸 순서로 읽는다.
 */
function readCellValue(
  source: Record<string, unknown> | undefined,
  cellId: string,
  rootId: string,
  cellIndex: number
): string {
  if (source && Object.prototype.hasOwnProperty.call(source, cellId)) {
    return toScalar(source[cellId]);
  }
  const root = source?.[rootId];
  return Array.isArray(root) ? toScalar(root[cellIndex]) : "";
}

function buildImageSrc(
  src: string,
  token: string | undefined,
  baseUrl: string | undefined
): string | undefined {
  return appendMediaToken(resolveMediaUrl(src, baseUrl), token);
}

interface ImageInputBlankViewProps {
  config: ImageBlankConfig;
  /** 루트 `IMAGE_RESPONSE_N`. 조회 API가 이 키로 정답을 줄 때만 쓴다. */
  rootResponseIdentifier: string;
  options: ImageBlankOptions;
  index: number;
}

/**
 * 저작 `ImageBlankOverlay`와 같은 방식으로 그린다. 배치는 기준계 퍼센트, 글자는 `regionBaseFont * scale`.
 * `scale`은 실제 이미지 폭 하나로만 구한다. 부모의 `transform: scale`을 다시 곱하지 않는다.
 */
function ImageInputBlankView({
  config,
  rootResponseIdentifier,
  options,
  index,
}: ImageInputBlankViewProps) {
  const imageRef = useRef<HTMLImageElement>(null);
  const [displayWidth, setDisplayWidth] = useState(0);

  useLayoutEffect(() => {
    const image = imageRef.current;
    if (!image) return;

    const measure = () => {
      const width = image.getBoundingClientRect().width;
      if (width > 0) setDisplayWidth(width);
    };

    // ResizeObserver 첫 콜백은 프레임이 돌아야 오는데, 캐시된 이미지에서는 그 프레임이 늦다.
    measure();
    image.addEventListener("load", measure);
    const observer = new ResizeObserver(measure);
    observer.observe(image);

    return () => {
      image.removeEventListener("load", measure);
      observer.disconnect();
    };
  }, []);

  const isPreview = options.mode === "preview";
  const isReadOnly = isPreview || options.mode === "thumbnail" || !options.onResponseChange;

  const responses = options.responses as Record<string, unknown> | undefined;
  const correctAnswers = options.correctAnswers as Record<string, unknown> | undefined;

  /** 루트 배열로 오는 정답 맵을 칸 순서로 읽을 때만 쓴다. 제출 키는 아니다. */
  const cellIds = useMemo(
    () => config.regions.flatMap(getImageBlankRegionResponseIds),
    [config.regions]
  );
  const readCell = (source: Record<string, unknown> | undefined, cellId: string) =>
    readCellValue(source, cellId, rootResponseIdentifier, cellIds.indexOf(cellId));

  /** 채점 전 preview는 빈 칸을 정답으로 채운다. 문항 미리보기와 정답 영역이 여기에 해당한다. */
  const fillEmptyWithCorrectAnswers = !options.isSubmit && isPreview;

  const valueOf = (cellId: string) => {
    const entered = readCell(responses, cellId);
    if (entered !== "") return entered;
    return fillEmptyWithCorrectAnswers ? readCell(correctAnswers, cellId) : "";
  };

  /** 수식 빈칸 `getInputBlankStateClass`와 같은 순서: 정답키 → 채점 결과 → 값이 있으면 선택. */
  const stateClassOf = (cellId: string) => {
    if (options.answerKeyPreview === true) return "qti-ext-image-input-blank__input--correct";
    const expected = readCell(correctAnswers, cellId);
    if (options.isSubmit && expected !== "") {
      return valueOf(cellId) === expected
        ? "qti-ext-image-input-blank__input--correct"
        : "qti-ext-image-input-blank__input--incorrect";
    }
    return valueOf(cellId) !== "" ? "qti-ext-image-input-blank__input--selected" : "";
  };

  const handleChange = (cellId: string, value: string) => {
    if (isReadOnly) return;
    // 값은 문자열 그대로 둔다. trim·선행 0 제거를 하면 저작 정답과 어긋난다.
    options.onResponseChange?.(cellId, value);
  };

  const src = buildImageSrc(config.src, options.token, options.baseUrl);
  const scale = displayWidth > 0 ? displayWidth / config.baseWidth : 0;

  return (
    <div
      className="qti-ext-image-input-blank"
      data-index={index}
      style={{
        // 배율은 폭으로만 준다. 좌표는 퍼센트, 글자는 측정된 폭에서 다시 계산되므로 같이 줄어든다.
        width: `calc(min(${config.displayWidth ?? config.baseWidth}px, 100%) * var(--qti-image-blank-scale, 1))`,
      }}
    >
      <img ref={imageRef} className="qti-ext-image-input-blank__image" src={src} alt={config.alt} />
      {scale > 0 && (
        <div className="qti-ext-image-input-blank__overlay">
          {config.regions.map((region, regionIndex) => {
            const screenFontSize = getImageBlankRegionFontSize(region, config.fontSize) * scale;
            return (
              <div
                key={region.id}
                className="qti-ext-image-input-blank__region"
                data-input-type={region.inputType}
                style={
                  {
                    left: imageBlankPercent(region.x, config.baseWidth),
                    top: imageBlankPercent(region.y, config.baseHeight),
                    width: imageBlankPercent(region.width, config.baseWidth),
                    height: imageBlankPercent(region.height, config.baseHeight),
                    // 테마 본문 font-size가 계산값을 덮지 않도록 변수로도 내려준다.
                    "--image-blank-calculated-font-size": `${screenFontSize}px`,
                    fontSize: `${screenFontSize}px`,
                  } as CSSProperties
                }
              >
                <ImageBlankRegionContent
                  region={region}
                  displayIndex={regionIndex + 1}
                  readOnly={isReadOnly}
                  showMath={isPreview || options.isSubmit === true}
                  valueOf={valueOf}
                  stateClassOf={stateClassOf}
                  onChange={handleChange}
                />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function ImageInputBlankInteraction({
  element,
  options,
  index,
}: ImageInputBlankInteractionProps) {
  const config = useMemo(() => parseImageBlankConfig(element), [element]);
  if (!config) return null;

  return (
    <ImageInputBlankView
      config={config}
      rootResponseIdentifier={element.getAttribute("response-identifier")?.trim() ?? ""}
      options={options}
      index={index}
    />
  );
}
