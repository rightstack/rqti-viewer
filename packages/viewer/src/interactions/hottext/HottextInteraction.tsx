import React, {
  type ReactNode,
  useCallback,
  useMemo,
  useRef,
  useState,
} from "react";
import { Circle, Triangle } from "lucide-react";
import { groupListItems } from "../../parser/listGrouping";
import {
  isFormattingWhitespace,
  parseHTMLElement,
} from "../../parser/parseHtmlElement";
import { parseTextWithLaTeX } from "../../parser/parseLatexToReact";
import { FloatToolbar, type FloatToolbarTool } from "../../shared/FloatToolbar";
import type { QTIParserOptions } from "../../types";
import { HottextChoice } from "./HottextChoice";
import {
  HOTTEXT_MARKER_SHAPE_NAME,
  HOTTEXT_SHAPES_RESPONSE_ID,
  type HottextChoiceContext,
  type HottextChoiceStyle,
  type HottextFeedback,
  type HottextGroupStyle,
  type HottextMarkerShape,
  applyHottextMarker,
  buildHottextShapes,
  hottextChoiceHasImage,
  hottextChoiceHasMath,
  hottextExpectedShape,
  hottextInteractionHasGroups,
  hottextMarkTone,
  hottextResponseValue,
  hottextTextFitsOneCharacter,
  indexHottextChoices,
  isHottextGroupElement,
  readExpectedShapes,
  readHottextDisplayStyles,
  readHottextItemMaxChoices,
  readHottextMarkerMode,
  readResponseIdentifiers,
  readStudentShapes,
  readXmlHottextMarkerShapes,
} from "./hottextRules";

interface HottextInteractionProps {
  element: Element;
  options: QTIParserOptions;
  index: number;
}

const HOTTEXT_MARKER_TOOLS: readonly FloatToolbarTool[] = [
  {
    id: "circle",
    label: "원형",
    icon: <Circle className="rqti:size-6" aria-hidden="true" />,
  },
  {
    id: "triangle",
    label: "삼각형",
    icon: <Triangle className="rqti:size-6" aria-hidden="true" />,
  },
];

interface RenderContext {
  options: QTIParserOptions;
  choiceIndex: Map<string, HottextChoiceContext>;
  selected: string[];
  shapes: Readonly<Record<string, HottextMarkerShape>>;
  shapeMode: boolean;
  interactive: boolean;
  feedback: HottextFeedback | null;
  onToggle: (identifier: string) => void;
  groupStyle: HottextGroupStyle;
  choiceStyle: HottextChoiceStyle;
  answerShapes: ReadonlyMap<string, HottextMarkerShape> | null;
}

function containsHottextMarkup(element: Element): boolean {
  return element.querySelector("qti-hottext, span.hottext-group") !== null;
}

function renderText(text: string, keyPrefix: string): ReactNode[] {
  let textCount = 0;
  return parseTextWithLaTeX(text, keyPrefix).map((part) => {
    if (typeof part !== "string") return part;
    textCount += 1;
    return (
      <React.Fragment key={`${keyPrefix}-text-${textCount}`}>
        {part}
      </React.Fragment>
    );
  });
}

function renderHottextNodes(
  nodes: NodeListOf<ChildNode> | readonly ChildNode[],
  parentTag: string | undefined,
  context: RenderContext,
  keyPrefix: string,
): ReactNode[] {
  const rendered: ReactNode[] = [];

  Array.from(nodes).forEach((node, index) => {
    const key = `${keyPrefix}-${index}`;

    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent ?? "";
      if (text === "" || isFormattingWhitespace(text)) return;
      rendered.push(...renderText(text, key));
      return;
    }

    if (node.nodeType !== Node.ELEMENT_NODE) return;

    const element = node as Element;
    const tagName = element.tagName.toLowerCase();
    if (tagName === "qti-prompt") return;

    if (tagName === "qti-hottext-interaction") {
      rendered.push(
        ...renderHottextNodes(element.childNodes, undefined, context, key),
      );
      return;
    }

    if (tagName === "qti-hottext") {
      const identifier = element.getAttribute("identifier") ?? "";
      const hasMath = hottextChoiceHasMath(element);
      const hasImage = hottextChoiceHasImage(element);
      const fitsOneCharacter = hottextTextFitsOneCharacter(element);
      const answerShapes = context.answerShapes;
      const answerKey = answerShapes !== null;
      const answerShape = answerKey
        ? answerShapes.get(identifier) ?? null
        : null;
      const tone = answerKey
        ? null
        : hottextMarkTone(identifier, context.selected, context.feedback);
      const studentShape = answerKey
        ? null
        : context.shapeMode
        ? context.feedback?.studentShapes[identifier] ??
          (context.feedback ? null : context.shapes[identifier] ?? null)
        : tone
        ? "circle"
        : null;
      const body = renderHottextNodes(
        element.childNodes,
        tagName,
        context,
        key,
      );

      if (!identifier) {
        rendered.push(
          <span key={key} className="qti-ext-hottext-label">
            {body}
          </span>,
        );
        return;
      }

      rendered.push(
        <HottextChoice
          key={identifier}
          identifier={identifier}
          tone={tone}
          studentShape={studentShape}
          expectedShape={
            answerKey
              ? answerShape
              : context.options.mode === "practice"
              ? null
              : hottextExpectedShape(identifier, context.feedback)
          }
          expectedTone={
            answerKey || context.options.isSubmit ? "correct" : "selected"
          }
          pressed={
            answerKey
              ? false
              : (context.feedback?.submittedIds ?? context.selected).includes(
                  identifier,
                )
          }
          interactive={context.interactive}
          answerKey={answerKey}
          markName={
            answerShape ? HOTTEXT_MARKER_SHAPE_NAME[answerShape] : undefined
          }
          hasMath={hasMath}
          hasImage={hasImage}
          fitsOneCharacter={fitsOneCharacter}
          choiceStyle={context.choiceStyle}
          onToggle={context.onToggle}
        >
          {body}
        </HottextChoice>,
      );
      return;
    }

    if (isHottextGroupElement(element)) {
      const className = [
        "qti-ext-hottext-group",
        context.groupStyle === "block" && "qti-ext-hottext-group--block",
        element.getAttribute("class"),
      ]
        .filter(Boolean)
        .join(" ");
      rendered.push(
        <span key={key} className={className}>
          {renderHottextNodes(element.childNodes, "span", context, key)}
        </span>,
      );
      return;
    }

    const className = element.getAttribute("class") ?? "";
    if (
      className.includes("qti-ext-mathfield") ||
      !containsHottextMarkup(element)
    ) {
      const parsed = parseHTMLElement(
        element,
        context.options,
        index,
        parentTag,
      );
      if (parsed) rendered.push(parsed);
      return;
    }

    const base = parseHTMLElement(element, context.options, index, parentTag);
    if (!base || !React.isValidElement<{ className?: string }>(base)) return;
    const children = renderHottextNodes(
      element.childNodes,
      tagName,
      context,
      key,
    );
    const paragraphClassName =
      tagName === "p"
        ? [base.props.className, "qti-ext-hottext-paragraph"]
            .filter(Boolean)
            .join(" ")
        : base.props.className;
    rendered.push(
      React.cloneElement(base, { className: paragraphClassName }, children),
    );
  });

  return groupListItems(rendered as Array<React.ReactElement | string>);
}

function resolveFeedback(
  options: QTIParserOptions,
  interaction: Element,
  responseIdentifier: string,
  shapeMode: boolean,
): HottextFeedback | null {
  const isPreview = options.mode === "preview";
  const allowColors = isPreview || options.submissionMode !== "SIMULTANEOUS";
  if (!allowColors || (!isPreview && !options.isSubmit)) return null;

  const submit = options.submitResponse;
  if (!isPreview && !submit) return null;

  // 문항 상세 미리보기는 정답만 그린다. 응시 리뷰는 제출 responses로 학생 도형을 맞춘다.
  const response =
    isPreview && !options.isSubmit
      ? undefined
      : submit?.response ?? options.responses;
  const correct = isPreview
    ? options.correctAnswers ?? options.responses
    : submit?.correctAnswer ?? options.correctAnswers;
  let correctIds = readResponseIdentifiers(correct?.[responseIdentifier]);
  const expectedShapes = shapeMode
    ? readExpectedShapes(correct?.[HOTTEXT_SHAPES_RESPONSE_ID])
    : new Map<string, HottextMarkerShape>();
  if (
    isPreview &&
    (correctIds.length === 0 || (shapeMode && expectedShapes.size === 0))
  ) {
    const xmlShapes = readXmlHottextMarkerShapes(interaction);
    if (correctIds.length === 0) correctIds = [...xmlShapes.keys()];
    if (shapeMode && expectedShapes.size === 0) {
      for (const id of correctIds) {
        const shape = xmlShapes.get(id);
        if (shape) expectedShapes.set(id, shape);
      }
    }
  }
  return {
    submittedIds: readResponseIdentifiers(response?.[responseIdentifier]),
    correctIds,
    shapeMode,
    studentShapes: shapeMode
      ? readStudentShapes(response?.[HOTTEXT_SHAPES_RESPONSE_ID])
      : {},
    expectedShapes,
  };
}

function shapeRecordKey(
  shapes: Readonly<Record<string, HottextMarkerShape>>,
): string {
  return Object.entries(shapes)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([identifier, shape]) => `${identifier}:${shape}`)
    .join("\u0000");
}

export function HottextInteraction({
  element,
  options,
  index,
}: HottextInteractionProps) {
  const responseIdentifier =
    element.getAttribute("response-identifier") || "RESPONSE";
  const choiceIndex = useMemo(() => indexHottextChoices(element), [element]);
  const displayStyles = useMemo(
    () => readHottextDisplayStyles(element),
    [element],
  );
  const shapeMode = readHottextMarkerMode(element) === "shape";
  const markerTools = shapeMode ? HOTTEXT_MARKER_TOOLS : [];
  const itemMaxChoices = readHottextItemMaxChoices(element);
  const groupBorderOnInteraction =
    displayStyles.groupStyle === "block" &&
    !hottextInteractionHasGroups(element);
  const restored = readResponseIdentifiers(
    options.responses?.[responseIdentifier],
  );
  const restoredShapes = shapeMode
    ? readStudentShapes(options.responses?.[HOTTEXT_SHAPES_RESPONSE_ID])
    : {};
  const restoredKey = `${restored.join("\u0000")}::${shapeRecordKey(
    restoredShapes,
  )}`;
  const [selected, setSelected] = useState(restored);
  const [shapes, setShapes] = useState(restoredShapes);
  const [selectionSource, setSelectionSource] = useState(restoredKey);
  const [tool, setTool] = useState<HottextMarkerShape>("circle");
  const anchorRef = useRef<HTMLDivElement | null>(null);
  /** 자식 툴바의 layout effect는 이 div의 ref 연결 전에 돈다. 연결 뒤 다시 재게 한다. */
  const [anchorReady, setAnchorReady] = useState(false);
  const attachAnchor = useCallback((node: HTMLDivElement | null) => {
    anchorRef.current = node;
    setAnchorReady(node !== null);
  }, []);

  if (selectionSource !== restoredKey) {
    setSelectionSource(restoredKey);
    setSelected(restored);
    setShapes(restoredShapes);
  }

  const selectionLocked =
    options.mode === "preview" ||
    options.mode === "thumbnail" ||
    !!options.isSubmit;
  const interactive = !selectionLocked;
  const feedback = resolveFeedback(
    options,
    element,
    responseIdentifier,
    shapeMode,
  );

  const publish = (
    next: string[],
    nextShapes: Record<string, HottextMarkerShape>,
  ) => {
    setSelected(next);
    setShapes(nextShapes);
    options.onResponseChange?.(responseIdentifier, hottextResponseValue(next));
    if (!shapeMode) return;
    options.onResponseChange?.(
      HOTTEXT_SHAPES_RESPONSE_ID,
      buildHottextShapes(next, nextShapes),
    );
  };

  const handleToggle = (identifier: string) => {
    if (!interactive) return;
    const applied = applyHottextMarker({
      selected,
      shapes,
      identifier,
      choice: choiceIndex.get(identifier),
      shapeMode,
      tool,
      itemMaxChoices,
    });
    publish(applied.selected, applied.shapes);
  };

  const content = renderHottextNodes(
    element.childNodes,
    undefined,
    {
      options,
      choiceIndex,
      selected,
      shapes,
      shapeMode,
      interactive,
      feedback,
      onToggle: handleToggle,
      groupStyle: displayStyles.groupStyle,
      choiceStyle: displayStyles.choiceStyle,
      answerShapes: null,
    },
    `hottext-${index}`,
  );

  const className = [
    "qti-ext-hottext-interaction",
    groupBorderOnInteraction && "qti-ext-hottext-interaction--block",
    element.getAttribute("class"),
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div
      key={`hottext-${responseIdentifier}-${index}`}
      ref={attachAnchor}
      className={className}
    >
      {interactive && markerTools.length > 0 ? (
        <FloatToolbar
          tools={markerTools}
          selectedId={tool}
          anchorRef={anchorRef}
          anchorReady={anchorReady}
          label="표시 도형"
          moveLabel="표시 도형 이동"
          hint={"표시 도형을 고른 뒤,\n본문의 말을 클릭하세요."}
          onSelect={(id) => {
            if (id === "circle" || id === "triangle") setTool(id);
          }}
        />
      ) : null}
      {content}
    </div>
  );
}

export function HottextAnswerSurface({
  nodes,
  interaction,
  shapes,
  token,
}: {
  nodes: readonly ChildNode[];
  interaction: Element;
  shapes: ReadonlyMap<string, HottextMarkerShape>;
  token?: string;
}) {
  const displayStyles = useMemo(
    () => readHottextDisplayStyles(interaction),
    [interaction],
  );
  const options = useMemo<QTIParserOptions>(
    () => ({ mode: "preview", token }),
    [token],
  );
  const content = renderHottextNodes(
    nodes,
    undefined,
    {
      options,
      choiceIndex: new Map(),
      selected: [],
      shapes: {},
      shapeMode: true,
      interactive: false,
      feedback: null,
      onToggle: () => undefined,
      groupStyle: displayStyles.groupStyle,
      choiceStyle: displayStyles.choiceStyle,
      answerShapes: shapes,
    },
    "hottext-answer",
  );

  return <div className="qti-ext-hottext-correct-answer-flow">{content}</div>;
}
