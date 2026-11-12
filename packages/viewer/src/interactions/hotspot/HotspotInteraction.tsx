import {
  type DragEvent,
  type KeyboardEvent,
  type MouseEvent,
  type SyntheticEvent,
  useCallback,
  useMemo,
  useRef,
  useState,
} from "react";
import { Check, Triangle } from "lucide-react";
import HotspotShapeIcon from "./HotspotShapeIcon";
import { FloatToolbar } from "../../shared/FloatToolbar";
import type { FeedbackSubmitResponse, QTIParserOptions } from "../../types";
import { resolveMediaUrl } from "../../utils/urlUtils";
import {
  HOTSPOT_GEOMETRY_RESPONSE_ID,
  HOTSPOT_SHAPES_RESPONSE_ID,
  type HotspotChoice,
  type HotspotMarkerKind,
  type HotspotMarkerShape,
  type HotspotShape,
  buildHotspotGeometry,
  buildHotspotShapes,
  hotspotAreaFeedback,
  hotspotMarkerKinds,
  hotspotMarkerOverflow,
  hotspotOverlapTargetIds,
  hotspotRenderedSize,
  parseHotspotModel,
  placeDefaultHotspotMarker,
  placeHotspotMarker,
  readHotspotGeometry,
  readHotspotShapes,
  resolveHotspotOverlapSelection,
} from "./hotspotGeometry";

interface HotspotInteractionProps {
  element: Element;
  options: QTIParserOptions;
  index: number;
}

const MARKER_HALO_PX = 5.5;
const GRAPHIC_MAX_WIDTH_FALLBACK = 520;

function fitDisplay(
  size: { width: number; height: number },
  maxWidth: number
): { width: number; height: number } {
  if (size.width <= maxWidth || size.width <= 0) return size;
  const scale = maxWidth / size.width;
  return { width: maxWidth, height: size.height * scale };
}

function readGraphicMaxWidth(): number {
  if (typeof document === "undefined") return GRAPHIC_MAX_WIDTH_FALLBACK;
  const value = Number.parseFloat(
    getComputedStyle(document.documentElement).getPropertyValue(
      "--qti-graphic-interaction-max-width"
    )
  );
  return Number.isFinite(value) && value > 0 ? value : GRAPHIC_MAX_WIDTH_FALLBACK;
}

const HOTSPOT_MARKER_LABELS: Record<HotspotMarkerKind, string> = {
  circle: "원",
  rect: "사각형",
  triangle: "삼각형",
  poly: "다각형",
  check: "체크",
};

function sharedPolySides(choices: readonly HotspotChoice[]): number | undefined {
  const counts = choices.flatMap((choice) => {
    if (choice.marker?.kind !== "poly") return [];
    const count = choice.marker.points.split(/\s+/).filter(Boolean).length;
    return count >= 3 ? [count] : [];
  });
  if (counts.length === 0 || counts.some((count) => count !== counts[0])) return undefined;
  return counts[0];
}

function PolygonToolIcon({ sides }: { sides: number }) {
  const points = Array.from({ length: sides }, (_, index) => {
    const angle = -Math.PI / 2 + (index * 2 * Math.PI) / sides;
    return `${12 + 8 * Math.cos(angle)},${12 + 8 * Math.sin(angle)}`;
  }).join(" ");
  return (
    <svg
      className="rqti:size-8"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <polygon points={points} />
    </svg>
  );
}

function hotspotMarkerIcon(kind: HotspotMarkerKind, choices: readonly HotspotChoice[]) {
  const className = "rqti:size-8";
  if (kind === "circle" || kind === "rect") {
    return <HotspotShapeIcon shape={kind} className={className} />;
  }
  if (kind === "triangle" || kind === "check") {
    const Icon = kind === "triangle" ? Triangle : Check;
    return <Icon className={className} aria-hidden="true" />;
  }
  const sides = sharedPolySides(choices) ?? firstPolySides(choices) ?? 3;
  if (sides === 3) return <Triangle className={className} aria-hidden="true" />;
  return <PolygonToolIcon sides={sides} />;
}

function firstPolySides(choices: readonly HotspotChoice[]): number | undefined {
  const marker = choices.find((choice) => choice.marker?.kind === "poly")?.marker;
  if (marker?.kind !== "poly") return undefined;
  const count = marker.points.split(/\s+/).filter(Boolean).length;
  return count >= 3 ? count : undefined;
}

function buildImageSrc(src: string, token: string | undefined): string | undefined {
  const resolved = resolveMediaUrl(src);
  if (!resolved) return undefined;
  if (!token || resolved.startsWith("data:")) return resolved;
  return `${resolved}?t=${token}`;
}

function pointerToImage(svg: SVGSVGElement, clientX: number, clientY: number) {
  const matrix = svg.getScreenCTM();
  if (!matrix) return null;
  const point = new DOMPoint(clientX, clientY).matrixTransform(matrix.inverse());
  if (!Number.isFinite(point.x) || !Number.isFinite(point.y)) return null;
  return { x: point.x, y: point.y };
}

function shapeAnchor(shape: HotspotShape) {
  if (shape.kind === "circle" || shape.kind === "ellipse") return { x: shape.cx, y: shape.cy };
  if (shape.kind === "rect") {
    return { x: shape.x + shape.width / 2, y: shape.y + shape.height / 2 };
  }
  const pairs = shape.points.split(" ");
  let sumX = 0;
  let sumY = 0;
  let count = 0;
  for (const pair of pairs) {
    const [x, y] = pair.split(",").map(Number);
    if (!Number.isFinite(x) || !Number.isFinite(y)) continue;
    sumX += x;
    sumY += y;
    count += 1;
  }
  return count > 0 ? { x: sumX / count, y: sumY / count } : { x: 0, y: 0 };
}

function readIdList(value: unknown): string[] {
  if (Array.isArray(value)) {
    return [
      ...new Set(value.filter((item): item is string => typeof item === "string" && item !== "")),
    ];
  }
  if (typeof value === "string" && value) return [value];
  return [];
}

type HotspotFeedback = "correct" | "incorrect";

function HotspotShapeNode({
  choice,
  selected,
  feedback,
  hasMarker,
  locked,
  onSelect,
}: {
  choice: HotspotChoice;
  selected: boolean;
  feedback?: HotspotFeedback;
  hasMarker: boolean;
  locked: boolean;
  onSelect: (identifier: string, event?: MouseEvent<SVGElement>) => void;
}) {
  const handleKeyDown = (event: KeyboardEvent<SVGElement>) => {
    if (locked) return;
    if (event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    onSelect(choice.identifier);
  };

  const shapeProps = {
    className: "qti-ext-hotspot__shape",
    role: "button" as const,
    tabIndex: locked ? -1 : 0,
    "aria-label": choice.label,
    "aria-pressed": selected,
    "aria-disabled": locked || undefined,
    "data-disabled": locked ? ("true" as const) : undefined,
    "data-selected": selected ? ("true" as const) : undefined,
    "data-feedback": feedback,
    "data-has-marker": hasMarker ? ("true" as const) : undefined,
    "data-hotspot-id": choice.identifier,
    vectorEffect: "non-scaling-stroke" as const,
    onClick: locked
      ? undefined
      : (event: MouseEvent<SVGElement>) => onSelect(choice.identifier, event),
    onKeyDown: handleKeyDown,
  };

  return renderShape(choice.shape, shapeProps);
}

function HotspotMarkerNode({
  shape,
  selected,
  feedback,
  choiceId,
}: {
  shape: HotspotMarkerShape;
  selected: boolean;
  feedback?: HotspotFeedback;
  choiceId: string;
}) {
  const shared = {
    "aria-hidden": true as const,
    "data-hotspot-id": choiceId,
    pointerEvents: "none" as const,
    vectorEffect: "non-scaling-stroke" as const,
  };
  return (
    <g className="qti-ext-hotspot__marker-group">
      {renderShape(shape, { ...shared, className: "qti-ext-hotspot__marker-halo" })}
      {renderShape(shape, {
        ...shared,
        className: "qti-ext-hotspot__marker",
        "data-selected": selected ? ("true" as const) : undefined,
        "data-feedback": feedback,
      })}
    </g>
  );
}

function renderShape(
  shape: HotspotShape | HotspotMarkerShape,
  props: {
    className: string;
    role?: "button";
    tabIndex?: number;
    "aria-label"?: string;
    "aria-pressed"?: boolean;
    "aria-hidden"?: boolean;
    "aria-disabled"?: true;
    "data-disabled"?: "true";
    "data-selected"?: "true";
    "data-feedback"?: HotspotFeedback;
    "data-has-marker"?: "true";
    "data-hotspot-id"?: string;
    pointerEvents?: "none";
    vectorEffect: "non-scaling-stroke";
    onClick?: (event: MouseEvent<SVGElement>) => void;
    onKeyDown?: (event: KeyboardEvent<SVGElement>) => void;
  }
) {
  if (shape.kind === "rect") {
    return <rect {...props} x={shape.x} y={shape.y} width={shape.width} height={shape.height} />;
  }
  if (shape.kind === "circle") {
    return <circle {...props} cx={shape.cx} cy={shape.cy} r={shape.r} />;
  }
  if (shape.kind === "ellipse") {
    return (
      <ellipse
        {...props}
        cx={shape.cx}
        cy={shape.cy}
        rx={shape.rx}
        ry={shape.ry}
        transform={shape.rotation ? `rotate(${shape.rotation} ${shape.cx} ${shape.cy})` : undefined}
      />
    );
  }
  if (shape.kind === "check") {
    return <polyline {...props} points={shape.points} fill="none" strokeLinecap="round" />;
  }
  return <polygon {...props} points={shape.points} fillRule="evenodd" />;
}

export function HotspotInteraction({ element, options, index }: HotspotInteractionProps) {
  const xmlClass = element.getAttribute("class") || "";
  const model = useMemo(() => parseHotspotModel(element), [element]);
  const isMultiple = (model?.maxChoices ?? 0) !== 1;
  const responseIdentifier = model?.responseIdentifier ?? "";
  const markerKinds = useMemo(
    () => (model ? hotspotMarkerKinds(model.choices, model.markerShapes) : []),
    [model]
  );
  const markerKindsKey = markerKinds.join("\0");
  const markerTools = useMemo(
    () =>
      markerKinds.map((kind) => ({
        id: kind,
        label: HOTSPOT_MARKER_LABELS[kind],
        icon: hotspotMarkerIcon(kind, model?.choices ?? []),
      })),
    [markerKinds, model]
  );

  const initialIds = useMemo(
    () => readIdList(options.responses?.[responseIdentifier]),
    [options.responses, responseIdentifier]
  );

  const [value, setValue] = useState<string[]>(initialIds);
  const [placements, setPlacements] = useState<Record<string, HotspotMarkerShape>>({});
  const [tool, setTool] = useState<HotspotMarkerKind>(markerKinds[0] ?? "circle");
  const restoredIds = initialIds.join("\0");
  const [syncedIds, setSyncedIds] = useState(restoredIds);
  const [toolKey, setToolKey] = useState(markerKindsKey);
  let answeredValue = value;
  if (syncedIds !== restoredIds) {
    setSyncedIds(restoredIds);
    setValue(initialIds);
    setPlacements({});
    answeredValue = initialIds;
  }
  if (toolKey !== markerKindsKey) {
    setToolKey(markerKindsKey);
    setTool(markerKinds[0] ?? "circle");
  }

  const svgRef = useRef<SVGSVGElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const src = model ? buildImageSrc(model.image.src, options.token) : undefined;
  const [loadedSrc, setLoadedSrc] = useState<string | undefined>();
  const imageReady = Boolean(src) && loadedSrc === src;
  const imageRef = useCallback(
    (image: HTMLImageElement | null) => {
      if (
        !image ||
        image.getAttribute("src") !== src ||
        !image.complete ||
        image.naturalWidth <= 0
      ) {
        return;
      }
      setLoadedSrc(src);
    },
    [src]
  );

  if (!model) return null;

  const isPreview = options.mode === "preview";
  const isReadOnly = options.mode !== "practice";
  const showFeedback = isPreview || options.submissionMode !== "SIMULTANEOUS";
  const isSubmit = showFeedback ? !!options.isSubmit : false;
  const interactive =
    !!options.onResponseChange && !isSubmit && !isReadOnly && model.overlapSelection !== "invalid";
  const effectiveSubmitResponse = showFeedback
    ? isPreview
      ? ({
          correct: options.correct || false,
          response: options.responses,
          correctAnswer: options.correctAnswers,
        } as FeedbackSubmitResponse)
      : options.submitResponse
    : undefined;

  const correctSource =
    effectiveSubmitResponse?.correctAnswer?.[responseIdentifier] ??
    options.correctAnswers?.[responseIdentifier];
  const correctIdList = readIdList(correctSource);
  const submittedIds = readIdList(effectiveSubmitResponse?.response?.[responseIdentifier]);
  const responseSource = effectiveSubmitResponse?.response ?? options.responses;
  const shapesById = readHotspotShapes(responseSource?.[HOTSPOT_SHAPES_RESPONSE_ID]);
  const geometryById = readHotspotGeometry(responseSource?.[HOTSPOT_GEOMETRY_RESPONSE_ID]);

  const restoredMarker = (choice: HotspotChoice): HotspotMarkerShape | undefined => {
    if (shapesById) {
      const kind = shapesById.get(choice.identifier);
      if (!kind) return undefined;
      const stored = geometryById.get(choice.identifier);
      if (stored?.kind === kind) return stored;
      return placeDefaultHotspotMarker(
        choice.shape,
        kind,
        model.answerMarkerSize,
        choice.marker?.kind === "poly" ? choice.marker.points : undefined
      );
    }
    return geometryById.get(choice.identifier) ?? choice.marker;
  };

  const publishSelection = (ids: string[], placed: Record<string, HotspotMarkerShape>) => {
    setValue(ids);
    setPlacements(placed);
    options.onResponseChange?.(responseIdentifier, ids);
    options.onResponseChange?.(HOTSPOT_SHAPES_RESPONSE_ID, buildHotspotShapes(ids, placed));
    options.onResponseChange?.(HOTSPOT_GEOMETRY_RESPONSE_ID, buildHotspotGeometry(ids, placed));
  };

  const stampKind = markerKinds.length >= 2 ? tool : (markerKinds[0] ?? "circle");

  const polyPointsFor = (choice: HotspotChoice) => {
    if (stampKind !== "poly") return undefined;
    if (choice.marker?.kind === "poly") return choice.marker.points;
    const polyTemplate = model.choices.find((item) => item.marker?.kind === "poly")?.marker;
    return polyTemplate?.kind === "poly" ? polyTemplate.points : undefined;
  };

  const stampAtPoint = (choice: HotspotChoice, point: { x: number; y: number }) =>
    placeHotspotMarker(stampKind, point.x, point.y, model.answerMarkerSize, polyPointsFor(choice));

  const placedFor = (ids: readonly string[]) => {
    const placedNow: Record<string, HotspotMarkerShape> = {};
    for (const item of model.choices) {
      const marker = placements[item.identifier] ?? restoredMarker(item);
      if (marker && ids.includes(item.identifier)) placedNow[item.identifier] = marker;
    }
    return placedNow;
  };

  const handleSelect = (choiceId: string, event?: MouseEvent<SVGElement>) => {
    if (!interactive) return;
    if (model.overlapSelection === "all-answer-regions" && event) {
      if (!svgRef.current) return;
      const point = pointerToImage(svgRef.current, event.clientX, event.clientY);
      if (!point) return;
      const current = readIdList(value);
      const targetIds = hotspotOverlapTargetIds(model.choices, point);
      const next = resolveHotspotOverlapSelection({
        choices: model.choices,
        currentIds: current,
        placed: placedFor(current),
        targetIds,
        maxChoices: model.maxChoices,
        stamp: (choice) => stampAtPoint(choice, point),
      });
      if (next) publishSelection(next.ids, next.placed);
      return;
    }
    const choice = model.choices.find((item) => item.identifier === choiceId);
    if (!choice) return;
    const current = readIdList(value);
    const placedNow = placedFor(current);
    const fromPointer =
      event && svgRef.current ? pointerToImage(svgRef.current, event.clientX, event.clientY) : null;
    const existing = placedNow[choiceId];
    const stamped = stampAtPoint(choice, fromPointer ?? shapeAnchor(choice.shape));
    if (current.includes(choiceId)) {
      if (existing?.kind === stampKind) {
        const next = current.filter((id) => id !== choiceId);
        publishSelection(
          next,
          Object.fromEntries(Object.entries(placedNow).filter(([id]) => next.includes(id)))
        );
        return;
      }
      publishSelection(current, { ...placedNow, [choiceId]: stamped });
      return;
    }
    if (!isMultiple) {
      publishSelection([choiceId], { [choiceId]: stamped });
      return;
    }
    if (model.maxChoices > 0 && current.length >= model.maxChoices) return;
    publishSelection([...current, choiceId], { ...placedNow, [choiceId]: stamped });
  };

  const answeredIds = readIdList(answeredValue);
  const selectedIds = answeredIds;
  const renderedSize = hotspotRenderedSize(model.image);
  const answerKey = options.answerKeyPreview === true;
  const answerDisplay = answerKey ? fitDisplay(renderedSize, readGraphicMaxWidth()) : renderedSize;
  const scaleX = model.image.width > 0 ? answerDisplay.width / model.image.width : 1;
  const scaleY = model.image.height > 0 ? answerDisplay.height / model.image.height : 1;
  const answerMarkers = answerKey
    ? model.choices.flatMap((choice) => {
        const marker = placements[choice.identifier] ?? restoredMarker(choice);
        const visible =
          marker &&
          (selectedIds.includes(choice.identifier) || submittedIds.includes(choice.identifier));
        return visible && marker ? [marker] : [];
      })
    : [];
  const markerPad = answerKey
    ? hotspotMarkerOverflow(
        answerMarkers,
        model.image.width,
        model.image.height,
        scaleX > 0 ? MARKER_HALO_PX / scaleX : 0,
        scaleY > 0 ? MARKER_HALO_PX / scaleY : 0
      )
    : undefined;
  const answerFrame = markerPad
    ? {
        stageWidth: answerDisplay.width + (markerPad.left + markerPad.right) * scaleX,
        stageHeight: answerDisplay.height + (markerPad.top + markerPad.bottom) * scaleY,
        imageLeft: markerPad.left * scaleX,
        imageTop: markerPad.top * scaleY,
        viewBox: [
          -markerPad.left,
          -markerPad.top,
          model.image.width + markerPad.left + markerPad.right,
          model.image.height + markerPad.top + markerPad.bottom,
        ]
          .map((coordinate) => Number(coordinate.toFixed(3)))
          .join(" "),
      }
    : undefined;

  const handleImageLoad = (event: SyntheticEvent<HTMLImageElement>) => {
    const image = event.currentTarget;
    if (image.getAttribute("src") === src && image.naturalWidth > 0) setLoadedSrc(src);
  };

  const blockImageGesture = (event: DragEvent<HTMLImageElement> | MouseEvent<HTMLImageElement>) => {
    event.preventDefault();
  };

  return (
    <div
      className={`qti-ext-hotspot ${xmlClass}`.trim()}
      data-index={index}
      data-overlap-selection={model.overlapSelection}
    >
      {interactive && markerKinds.length >= 2 ? (
        <FloatToolbar
          tools={markerTools}
          selectedId={tool}
          anchorRef={stageRef}
          anchorReady={imageReady}
          side="right"
          label="표시 도형"
          moveLabel="표시 도형 이동"
          hint={"정답 모양을 선택한 뒤,\n문제의 정답 영역을 클릭하세요."}
          onSelect={(id) => {
            const kind = markerKinds.find((item) => item === id);
            if (kind) setTool(kind);
          }}
        />
      ) : null}
      <div
        ref={stageRef}
        className="qti-ext-hotspot__stage"
        data-interactive={interactive ? "true" : undefined}
        style={
          answerFrame
            ? { width: answerFrame.stageWidth, height: answerFrame.stageHeight }
            : undefined
        }
        onClick={(event) => event.stopPropagation()}
      >
        <img
          ref={imageRef}
          className="qti-ext-image qti-ext-hotspot__image"
          src={src}
          alt={model.image.alt}
          width={answerFrame ? answerDisplay.width : renderedSize.width}
          height={answerFrame ? answerDisplay.height : renderedSize.height}
          style={
            answerFrame
              ? {
                  position: "absolute",
                  left: answerFrame.imageLeft,
                  top: answerFrame.imageTop,
                  width: answerDisplay.width,
                  height: answerDisplay.height,
                  maxWidth: "none",
                }
              : { width: renderedSize.width }
          }
          draggable={false}
          onLoad={handleImageLoad}
          onDragStart={blockImageGesture}
          onContextMenu={blockImageGesture}
        />
        <svg
          ref={svgRef}
          className="qti-ext-hotspot__overlay"
          data-ready={imageReady ? "true" : undefined}
          viewBox={answerFrame?.viewBox ?? `0 0 ${model.image.width} ${model.image.height}`}
          preserveAspectRatio="none"
        >
          {model.choices.map((choice) => {
            const selected = selectedIds.includes(choice.identifier);
            const chosen = submittedIds.includes(choice.identifier);
            const marker = placements[choice.identifier] ?? restoredMarker(choice);
            const groupMembers = choice.answerGroup
              ? model.choices
                  .filter((item) => item.answerGroup === choice.answerGroup)
                  .map((item) => ({
                    chosen: submittedIds.includes(item.identifier),
                    studentShape: (placements[item.identifier] ?? restoredMarker(item))?.kind,
                  }))
              : undefined;
            const feedback = hotspotAreaFeedback({
              submitted: isSubmit && !!effectiveSubmitResponse,
              grouped: model.grouped,
              itemCorrect: !!effectiveSubmitResponse?.correct,
              chosen,
              correctIds: correctIdList,
              regionId: choice.identifier,
              studentShape: marker?.kind,
              answerShape: choice.markerKind,
              groupMembers,
            });
            const showMarker = Boolean(marker) && (selected || Boolean(feedback));

            return (
              <g key={choice.identifier}>
                <HotspotShapeNode
                  choice={choice}
                  selected={showMarker && selected}
                  feedback={showMarker ? feedback : undefined}
                  hasMarker={showMarker}
                  locked={!interactive}
                  onSelect={handleSelect}
                />
                {showMarker && marker ? (
                  <HotspotMarkerNode
                    shape={marker}
                    selected={selected}
                    feedback={feedback}
                    choiceId={choice.identifier}
                  />
                ) : null}
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}
