import { Fragment, useMemo } from "react";
import { Circle, Triangle } from "lucide-react";
import { parseTextWithLaTeX } from "../../parser/parseLatexToReact";
import { renderQtiNode } from "../../parser/renderQtiNode";
import { getNodeKey } from "../../utils/getNodeKey";
import { HottextAnswerSurface } from "./HottextInteraction";
import {
  HOTTEXT_MARKER_SHAPE_NAME,
  type HottextCorrectAnswerGroup,
  type HottextMarkerShape,
  hottextCorrectAnswerUsesSurface,
} from "./hottextRules";

interface HottextCorrectAnswerProps {
  groups: readonly HottextCorrectAnswerGroup[];
  displayOf: (id: string) => string;
  keyPrefix: string;
  qtiXml?: string | null;
  responseIdentifier: string;
  token?: string;
}

function readHottextInteraction(
  qtiXml: string | null | undefined,
  responseIdentifier: string
): Element | null {
  if (!qtiXml?.trim() || typeof DOMParser === "undefined") return null;
  const doc = new DOMParser().parseFromString(qtiXml, "text/xml");
  if (doc.querySelector("parsererror")) return null;
  return (
    Array.from(doc.querySelectorAll("qti-hottext-interaction")).find(
      (node) => (node.getAttribute("response-identifier") || "RESPONSE") === responseIdentifier
    ) ?? null
  );
}

function hottextChoiceElements(interaction: Element | null): Map<string, Element> {
  const choices = new Map<string, Element>();
  if (!interaction) return choices;
  interaction.querySelectorAll("qti-hottext").forEach((node) => {
    if (node.closest("qti-hottext-interaction") !== interaction) return;
    const id = node.getAttribute("identifier")?.trim() ?? "";
    if (id) choices.set(id, node);
  });
  return choices;
}

function answerShapesOf(
  groups: readonly HottextCorrectAnswerGroup[]
): Map<string, HottextMarkerShape> {
  const shapes = new Map<string, HottextMarkerShape>();
  for (const group of groups) {
    if (!group.shape) continue;
    for (const id of group.ids) shapes.set(id, group.shape);
  }
  return shapes;
}

function belongsToInteraction(node: Element, interaction: Element) {
  return node.closest("qti-hottext-interaction") === interaction;
}

function answerGroups(interaction: Element): Element[] {
  return Array.from(interaction.querySelectorAll("span.hottext-group")).filter((group) => {
    if (!belongsToInteraction(group, interaction)) return false;
    const parent = group.parentElement?.closest("span.hottext-group");
    return !parent || !belongsToInteraction(parent, interaction);
  });
}

function answerStimulus(interaction: Element): Element | null {
  return (
    Array.from(interaction.querySelectorAll(".qti-ext-stimulus")).find((node) =>
      belongsToInteraction(node, interaction)
    ) ?? interaction.closest(".qti-ext-stimulus")
  );
}

function groupRow(groups: readonly Element[]): ChildNode[] {
  const doc = groups[0].ownerDocument;
  return groups.flatMap((group, index) =>
    index === 0 ? [group] : [doc.createTextNode(", "), group]
  );
}

export function HottextCorrectAnswer({
  groups,
  displayOf,
  keyPrefix,
  qtiXml,
  responseIdentifier,
  token,
}: HottextCorrectAnswerProps) {
  const interaction = useMemo(
    () => readHottextInteraction(qtiXml, responseIdentifier),
    [qtiXml, responseIdentifier]
  );
  const choices = useMemo(() => hottextChoiceElements(interaction), [interaction]);
  const showSurface = hottextCorrectAnswerUsesSurface(groups) && interaction !== null;
  const answerShapes = useMemo(() => answerShapesOf(groups), [groups]);
  const contentGroups = interaction ? answerGroups(interaction) : [];
  const stimulus = interaction && contentGroups.length === 0 ? answerStimulus(interaction) : null;
  const slice = contentGroups.length > 0 ? groupRow(contentGroups) : stimulus ? [stimulus] : [];

  if (showSurface && interaction && slice.length > 0) {
    return (
      <div className="qti-ext-hottext-correct-answer qti-ext-hottext-correct-answer--surface">
        <HottextAnswerSurface
          nodes={slice}
          interaction={interaction}
          shapes={answerShapes}
          token={token}
        />
      </div>
    );
  }

  return (
    <div className="qti-ext-hottext-correct-answer">
      {groups.map((group) => (
        <div key={group.ids.join(",")} className="qti-ext-hottext-correct-answer-row">
          {group.shape ? (
            <span className="qti-ext-hottext-correct-answer-shape">
              {group.shape === "circle" ? (
                <Circle
                  aria-hidden={false}
                  role="img"
                  aria-label={HOTTEXT_MARKER_SHAPE_NAME.circle}
                />
              ) : (
                <Triangle
                  aria-hidden={false}
                  role="img"
                  aria-label={HOTTEXT_MARKER_SHAPE_NAME.triangle}
                />
              )}
            </span>
          ) : null}
          <span className="qti-ext-hottext-correct-answer-items">
            {group.ids.map((id, index) => {
              const choice = choices.get(id);
              const hasImage = choice?.querySelector("img") !== null;
              return (
                <Fragment key={id}>
                  {index > 0 ? <span aria-hidden="true">, </span> : null}
                  {hasImage && choice
                    ? Array.from(choice.childNodes).map((child) => (
                        <Fragment key={getNodeKey(child)}>
                          {renderQtiNode(child, { token })}
                        </Fragment>
                      ))
                    : parseTextWithLaTeX(displayOf(id), `${keyPrefix}-${id}`)}
                </Fragment>
              );
            })}
          </span>
        </div>
      ))}
    </div>
  );
}
