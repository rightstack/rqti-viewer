import { type CSSProperties, useLayoutEffect, useMemo, useRef, useState } from "react";
import type { MathLevel } from "../../math-keyboard";
import type { QTIParserOptions, ResponseValue, ResponseValueMap } from "../../types";
import { resolveSchoolLevel } from "../../utils";
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
  /** PCI `data-school-level`. `isMath` 칸에만 넘긴다. */
  schoolLevel: MathLevel | null;
}

function ImageInputBlankView({
  config,
  rootResponseIdentifier,
  options,
  index,
  schoolLevel,
}: ImageInputBlankViewProps) {
  const imageRef = useRef<HTMLImageElement>(null);
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });

  useLayoutEffect(() => {
    const image = imageRef.current;
    if (!image) return;

    const measure = () => {
      const { width, height } = image.getBoundingClientRect();
      if (width <= 0 || height <= 0) return;
      setImageSize((current) =>
        current.width === width && current.height === height ? current : { width, height }
      );
    };

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
  const mode = options.mode as string | undefined;
  const isReadOnly =
    isPreview || mode === "thumbnail" || mode === "paper" || !options.onResponseChange;

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
  const showFractionAsLatex = options.answerKeyPreview === true;

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
  const correctAnswerOf = (cellId: string) => readCell(correctAnswers, cellId);

  const handleChange = (cellId: string, value: string) => {
    if (isReadOnly) return;
    // 값은 문자열 그대로 둔다. trim·선행 0 제거를 하면 저작 정답과 어긋난다.
    options.onResponseChange?.(cellId, value);
  };

  const src = buildImageSrc(config.src, options.token, options.baseUrl);
  const scale = imageSize.width > 0 ? imageSize.width / config.baseWidth : 0;

  return (
    <div className="qti-ext-image-input-blank" data-index={index}>
      <img
        ref={imageRef}
        className="qti-ext-image-input-blank__image"
        src={src}
        alt={config.alt}
        style={{
          width: `${config.displayWidth ?? config.baseWidth}px`,
        }}
      />
      {scale > 0 && (
        <div
          className="qti-ext-image-input-blank__overlay"
          style={{ width: imageSize.width, height: imageSize.height }}
        >
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
                    "--image-blank-calculated-font-size": `${screenFontSize}px`,
                  } as CSSProperties
                }
              >
                <ImageBlankRegionContent
                  region={region}
                  displayIndex={regionIndex + 1}
                  readOnly={isReadOnly}
                  showMath={isPreview || options.isSubmit === true || options.mode === "thumbnail"}
                  showFractionAsLatex={showFractionAsLatex}
                  valueOf={valueOf}
                  correctAnswerOf={correctAnswerOf}
                  historyScope={options.itemKey}
                  mathKeyboardLevel={region.isMath ? schoolLevel : null}
                  stateClassOf={stateClassOf}
                  isSubmit={options.isSubmit === true}
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
      schoolLevel={resolveSchoolLevel(element)}
    />
  );
}
