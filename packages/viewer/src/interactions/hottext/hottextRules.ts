import type { ResponseValueMap } from "../../types";

/** 저작 저장값과 같다. 1은 단일, 0은 개수 상한 없는 다중. */
export const HOTTEXT_MAX_CHOICES = {
  SINGLE: 1,
  MULTIPLE: 0,
} as const;

export type HottextMaxChoices = (typeof HOTTEXT_MAX_CHOICES)[keyof typeof HOTTEXT_MAX_CHOICES];

export interface HottextChoiceContext {
  identifier: string;
  /** 자유형은 문항 max-choices. 그룹은 그 그룹의 data-max-choices. */
  maxChoices: number;
  /** null이면 그룹 밖의 자유형이다. */
  groupIdentifiers: string[] | null;
  /** 자유형 단일에서 교체할 같은 응답의 자유형 식별자. */
  freeIdentifiers?: readonly string[];
}

export const HOTTEXT_MARKER_SHAPES = ["circle", "triangle"] as const;
export type HottextMarkerShape = (typeof HOTTEXT_MARKER_SHAPES)[number];

export const HOTTEXT_MARKER_SHAPE_NAME: Record<HottextMarkerShape, string> = {
  circle: "원형",
  triangle: "삼각형",
};

/** 학생 도형. 좌표는 두지 않는다. */
export const HOTTEXT_SHAPES_RESPONSE_ID = "RESPONSE_SHAPES";

export interface HottextGroupRequirement {
  identifiers: string[];
  /** 그룹의 data-max-choices. 1은 하나, 0은 그룹 안 개수 제한 없음. */
  maxChoices: number;
}

export interface HottextSubmitRequirement {
  responseIdentifier: string;
  /** 0이면 자유형은 1개 이상, 그룹형은 그룹 규칙만 본다. */
  minChoices: number;
  /** 자유형 상한. 1은 단일, 0은 도형 개수와 상관없이 제한이 없다. 그룹형에는 쓰지 않는다. */
  maxChoices: number;
  shapeMode: boolean;
  /** 그룹이 없으면 자유형이다. */
  groups: HottextGroupRequirement[];
}

export interface HottextFeedback {
  /** 제출된 응답 identifier. `submitResponse.response` */
  submittedIds: string[];
  /** 정답 응답 identifier. `submitResponse.correctAnswer` */
  correctIds: string[];
  shapeMode: boolean;
  /** 학생이 찍은 도형. 없으면 원으로 채우지 않는다. */
  studentShapes: Readonly<Record<string, HottextMarkerShape>>;
  /** 정답 API의 `"H2 circle"` 문자열. XML 속성이 아니다. */
  expectedShapes: ReadonlyMap<string, HottextMarkerShape>;
}

export type HottextMarkTone = "selected" | "correct" | "incorrect";

export const HOTTEXT_GROUP_STYLES = ["transparent", "block"] as const;
export const HOTTEXT_CHOICE_STYLES = ["block", "underline", "transparent"] as const;

export type HottextGroupStyle = (typeof HOTTEXT_GROUP_STYLES)[number];
export type HottextChoiceStyle = (typeof HOTTEXT_CHOICE_STYLES)[number];

export interface HottextDisplayStyles {
  groupStyle: HottextGroupStyle;
  choiceStyle: HottextChoiceStyle;
}

function isHottextGroupStyle(value: string | null): value is HottextGroupStyle {
  return value === "transparent" || value === "block";
}

function isHottextChoiceStyle(value: string | null): value is HottextChoiceStyle {
  return value === "block" || value === "underline" || value === "transparent";
}

/**
 * 속성이 없으면 테두리 투명, 선택 영역 블록이다.
 * 테두리 블록과 선택 영역 블록은 테두리 블록, 선택 영역 투명으로 보정한다.
 * 허용값 밖은 그 필드만 기본값으로 본다.
 */
export function readHottextDisplayStyles(interaction: Element): HottextDisplayStyles {
  const groupAttribute = interaction.getAttribute("data-group-style");
  const choiceAttribute = interaction.getAttribute("data-choice-style");
  const groupStyle = isHottextGroupStyle(groupAttribute) ? groupAttribute : "transparent";
  const choiceStyle = isHottextChoiceStyle(choiceAttribute) ? choiceAttribute : "block";

  return {
    groupStyle,
    choiceStyle: groupStyle === "block" && choiceStyle === "block" ? "transparent" : choiceStyle,
  };
}

export function hottextInteractionHasGroups(interaction: Element): boolean {
  return Array.from(interaction.querySelectorAll("span.hottext-group")).some(
    (group) => group.closest("qti-hottext-interaction") === interaction
  );
}

const LATEX_DELIMITER = /\\\(|\\\[|\$[^$\n]+\$/;

/** 선택지 본문에 수식이 있으면 동그라미를 수식 크기로 쓴다. */
export function hottextChoiceHasMath(element: Element): boolean {
  if (element.querySelector(".qti-ext-mathfield, [data-latex]")) return true;
  return LATEX_DELIMITER.test(element.textContent ?? "");
}

/** 글자가 한 글자 이하면 숫자와 같은 크기의 마커를 쓴다. */
export function hottextTextFitsOneCharacter(element: Element): boolean {
  if (hottextChoiceHasMath(element)) return false;
  const text = (element.textContent ?? "").replace(/\s/g, "");
  return [...text].length <= 1;
}

export function isHottextGroupElement(element: Element): boolean {
  if (element.tagName.toLowerCase() !== "span") return false;
  return (element.getAttribute("class") ?? "").split(/\s+/).includes("hottext-group");
}

/** 그룹 상한은 span.hottext-group의 data-max-choices만 읽는다. 없으면 1, 0은 제한 없음. */
export function readHottextMaxChoices(element: Element): number {
  const raw = element.getAttribute("data-max-choices");
  if (raw === null || raw.trim() === "") return HOTTEXT_MAX_CHOICES.SINGLE;
  const value = Number(raw);
  if (!Number.isFinite(value) || value < 0) return HOTTEXT_MAX_CHOICES.SINGLE;
  return Math.floor(value);
}

/** 자유형은 인터랙션 max-choices가 1일 때만 단일이다. 없거나 0이면 다중. */
function readFreeHottextMaxChoices(interaction: Element): HottextMaxChoices {
  return readHottextItemMaxChoices(interaction) === HOTTEXT_MAX_CHOICES.SINGLE
    ? HOTTEXT_MAX_CHOICES.SINGLE
    : HOTTEXT_MAX_CHOICES.MULTIPLE;
}

/** 문항 전체 상한. 없거나 0이면 제한이 없다. */
export function readHottextItemMaxChoices(interaction: Element): number {
  const raw = interaction.getAttribute("max-choices");
  if (raw === null || raw.trim() === "") return HOTTEXT_MAX_CHOICES.MULTIPLE;
  const value = Number(raw);
  return Number.isFinite(value) && value > 0 ? value : HOTTEXT_MAX_CHOICES.MULTIPLE;
}

/** 속성이 없으면 자유형은 1, 그룹형은 그룹마다 1개 규칙에 맡긴다. */
export function readHottextItemMinChoices(interaction: Element, groupCount: number): number {
  const raw = interaction.getAttribute("min-choices");
  if (raw === null || raw.trim() === "") return groupCount > 0 ? 0 : 1;
  const value = Number(raw);
  return Number.isFinite(value) && value >= 0 ? value : groupCount > 0 ? 0 : 1;
}

/** 누락과 selection은 일반 선택이다. triangle 속성으로 shape를 만들지 않는다. */
export function readHottextMarkerMode(interaction: Element): "selection" | "shape" {
  return interaction.getAttribute("data-marker-mode")?.trim().toLowerCase() === "shape"
    ? "shape"
    : "selection";
}

export function isHottextMarkerShape(value: unknown): value is HottextMarkerShape {
  return value === "circle" || value === "triangle";
}

export function hottextChoiceHasImage(element: Element): boolean {
  return element.querySelector("img") !== null;
}

export function readResponseIdentifiers(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === "string" && item !== "");
  }
  if (typeof value === "string" && value.trim() !== "") return [value];
  return [];
}

function hottextIdentifiersInGroup(group: Element): string[] {
  const identifiers: string[] = [];
  group.querySelectorAll("qti-hottext").forEach((node) => {
    if (node.closest("span.hottext-group") !== group) return;
    const identifier = node.getAttribute("identifier");
    if (identifier) identifiers.push(identifier);
  });
  return identifiers;
}

export function indexHottextChoices(interaction: Element): Map<string, HottextChoiceContext> {
  const map = new Map<string, HottextChoiceContext>();
  const groupIdentifiers = new Map<Element, string[]>();
  const freeMaxChoices = readFreeHottextMaxChoices(interaction);
  const freeIdentifiers: string[] = [];

  const identifiersFor = (group: Element): string[] => {
    const cached = groupIdentifiers.get(group);
    if (cached) return cached;
    const identifiers = hottextIdentifiersInGroup(group);
    groupIdentifiers.set(group, identifiers);
    return identifiers;
  };

  interaction.querySelectorAll("qti-hottext").forEach((node) => {
    const identifier = node.getAttribute("identifier") ?? "";
    if (!identifier || map.has(identifier)) return;

    const group = node.closest("span.hottext-group");
    if (!group || !interaction.contains(group)) {
      if (freeMaxChoices === HOTTEXT_MAX_CHOICES.SINGLE) freeIdentifiers.push(identifier);
      map.set(identifier, {
        identifier,
        maxChoices: freeMaxChoices,
        groupIdentifiers: null,
        ...(freeMaxChoices === HOTTEXT_MAX_CHOICES.SINGLE ? { freeIdentifiers } : {}),
      });
      return;
    }

    map.set(identifier, {
      identifier,
      maxChoices: readHottextMaxChoices(group),
      groupIdentifiers: identifiersFor(group),
    });
  });

  return map;
}

function toggleGroupSelection(
  selected: readonly string[],
  identifier: string,
  groupIdentifiers: readonly string[],
  maxChoices: number
): string[] {
  if (selected.includes(identifier)) return selected.filter((id) => id !== identifier);

  const groupIds = new Set(groupIdentifiers);
  const outside = selected.filter((id) => !groupIds.has(id));
  const inside = selected.filter((id) => groupIds.has(id));
  if (maxChoices === HOTTEXT_MAX_CHOICES.MULTIPLE) return [...selected, identifier];
  if (maxChoices === HOTTEXT_MAX_CHOICES.SINGLE) return [...outside, identifier];
  if (inside.length >= maxChoices) return [...selected];
  return [...selected, identifier];
}

export function toggleHottextSelection(
  selected: readonly string[],
  identifier: string,
  choice: HottextChoiceContext | undefined,
  itemMaxChoices: number = HOTTEXT_MAX_CHOICES.MULTIPLE
): string[] {
  if (!choice) return [...selected];

  if (choice.groupIdentifiers !== null) {
    return toggleGroupSelection(selected, identifier, choice.groupIdentifiers, choice.maxChoices);
  }

  const alreadySelected = selected.includes(identifier);
  if (choice.maxChoices !== HOTTEXT_MAX_CHOICES.SINGLE) {
    const next = alreadySelected
      ? selected.filter((id) => id !== identifier)
      : [...selected, identifier];
    if (itemMaxChoices > 0 && next.length > itemMaxChoices && next.length > selected.length) {
      return [...selected];
    }
    return next;
  }

  if (alreadySelected) return selected.filter((id) => id !== identifier);
  const replaced = new Set(choice.freeIdentifiers ?? []);
  return [...selected.filter((id) => !replaced.has(id)), identifier];
}

/** 단일·다중 모두 ID 배열이다. */
export function hottextResponseValue(selected: readonly string[]): string[] {
  return [...selected];
}

function keepShapes(
  shapes: Readonly<Record<string, HottextMarkerShape>>,
  ids: readonly string[]
): Record<string, HottextMarkerShape> {
  const next: Record<string, HottextMarkerShape> = {};
  for (const id of ids) {
    const shape = shapes[id];
    if (shape) next[id] = shape;
  }
  return next;
}

/** 같은 도형으로 다시 누르면 지우고, 다른 도형이면 ID는 둔 채 도형만 바꾼다. */
export function applyHottextMarker(input: {
  selected: readonly string[];
  shapes: Readonly<Record<string, HottextMarkerShape>>;
  identifier: string;
  choice: HottextChoiceContext | undefined;
  shapeMode: boolean;
  tool: HottextMarkerShape;
  itemMaxChoices: number;
}): { selected: string[]; shapes: Record<string, HottextMarkerShape> } {
  const { identifier, choice, shapeMode, tool, itemMaxChoices } = input;
  if (!choice) {
    return { selected: [...input.selected], shapes: { ...input.shapes } };
  }

  if (shapeMode && input.selected.includes(identifier)) {
    if (input.shapes[identifier] === tool) {
      const selected = input.selected.filter((id) => id !== identifier);
      return { selected, shapes: keepShapes(input.shapes, selected) };
    }
    if (input.shapes[identifier]) {
      return { selected: [...input.selected], shapes: { ...input.shapes, [identifier]: tool } };
    }
  }

  const selected = toggleHottextSelection(input.selected, identifier, choice, itemMaxChoices);
  if (!shapeMode || !selected.includes(identifier)) {
    return { selected, shapes: shapeMode ? keepShapes(input.shapes, selected) : {} };
  }
  return { selected, shapes: { ...keepShapes(input.shapes, selected), [identifier]: tool } };
}

/** 학생 복원 중첩 쌍. `"H2 circle"` 정답 문자열은 읽지 않는다. */
export function readStudentShapes(value: unknown): Record<string, HottextMarkerShape> {
  const shapes: Record<string, HottextMarkerShape> = {};
  if (!Array.isArray(value)) return shapes;
  for (const item of value) {
    if (!Array.isArray(item) || item.length < 2) continue;
    const identifier: unknown = item[0];
    const shape: unknown = item[1];
    if (typeof identifier !== "string" || identifier === "" || !isHottextMarkerShape(shape)) {
      continue;
    }
    shapes[identifier] = shape;
  }
  return shapes;
}

/** 정답 API의 공백 구분 문자열. 학생 중첩 쌍과 섞지 않는다. */
export function readExpectedShapes(value: unknown): Map<string, HottextMarkerShape> {
  const shapes = new Map<string, HottextMarkerShape>();
  if (!Array.isArray(value)) return shapes;
  for (const item of value) {
    if (typeof item !== "string") continue;
    const splitAt = item.lastIndexOf(" ");
    if (splitAt <= 0) continue;
    const identifier = item.slice(0, splitAt).trim();
    const shape = item
      .slice(splitAt + 1)
      .trim()
      .toLowerCase();
    if (!identifier || !isHottextMarkerShape(shape)) continue;
    shapes.set(identifier, shape);
  }
  return shapes;
}

export function buildHottextShapes(
  ids: readonly string[],
  shapes: Readonly<Record<string, HottextMarkerShape>>
): Array<[string, HottextMarkerShape]> {
  return ids.flatMap((id) => {
    const shape = shapes[id];
    return shape ? [[id, shape] as [string, HottextMarkerShape]] : [];
  });
}

export interface HottextCorrectAnswerGroup {
  /** null이면 도형 없이 본문만 한 줄로 둔다. */
  shape: HottextMarkerShape | null;
  ids: string[];
}

/** 정답 영역. selection은 한 줄, shape는 도형마다 줄을 나눈다. */
export function groupHottextCorrectAnswers(
  ids: readonly string[],
  expectedValue: unknown,
  shapeMode: boolean
): HottextCorrectAnswerGroup[] {
  if (!shapeMode) {
    return ids.length > 0 ? [{ shape: null, ids: [...ids] }] : [];
  }

  const expected = readExpectedShapes(expectedValue);
  const grouped = new Map<HottextMarkerShape, string[]>();
  const unshaped: string[] = [];
  for (const id of ids) {
    const shape = expected.get(id);
    if (!shape) {
      unshaped.push(id);
      continue;
    }
    const list = grouped.get(shape);
    if (list) list.push(id);
    else grouped.set(shape, [id]);
  }

  const groups: HottextCorrectAnswerGroup[] = HOTTEXT_MARKER_SHAPES.flatMap((shape) => {
    const shapeIds = grouped.get(shape);
    return shapeIds && shapeIds.length > 0 ? [{ shape, ids: shapeIds }] : [];
  });
  if (unshaped.length > 0) groups.push({ shape: null, ids: unshaped });
  return groups;
}

export function hottextCorrectAnswerUsesSurface(
  groups: readonly HottextCorrectAnswerGroup[]
): boolean {
  return groups.length >= 2 && groups.every((group) => group.shape !== null);
}

/** 저작 도구가 정답 선택지에 넣은 data-marker-shape. */
export function readXmlHottextMarkerShapes(interaction: Element): Map<string, HottextMarkerShape> {
  const shapes = new Map<string, HottextMarkerShape>();
  interaction.querySelectorAll("qti-hottext").forEach((node) => {
    if (node.closest("qti-hottext-interaction") !== interaction) return;
    const identifier = node.getAttribute("identifier")?.trim() ?? "";
    const shape = node.getAttribute("data-marker-shape")?.trim().toLowerCase();
    if (!identifier || !isHottextMarkerShape(shape)) return;
    shapes.set(identifier, shape);
  });
  return shapes;
}

export function readXmlHottextExpectedShapeValue(
  qtiXml: string | null | undefined,
  responseIdentifier: string
): string[] {
  if (!qtiXml?.trim() || typeof DOMParser === "undefined") return [];
  const doc = new DOMParser().parseFromString(qtiXml, "text/xml");
  if (doc.querySelector("parsererror")) return [];
  const interaction = Array.from(doc.querySelectorAll("qti-hottext-interaction")).find(
    (node) => (node.getAttribute("response-identifier") || "RESPONSE") === responseIdentifier
  );
  if (!interaction) return [];
  return Array.from(readXmlHottextMarkerShapes(interaction), ([id, shape]) => `${id} ${shape}`);
}

/** 정답 API 도형이 없으면 저작 XML의 data-marker-shape를 쓴다. */
export function hottextExpectedShapeValue(
  apiValue: unknown,
  qtiXml: string | null | undefined,
  responseIdentifier: string
): unknown {
  if (readExpectedShapes(apiValue).size > 0) return apiValue;
  const fromXml = readXmlHottextExpectedShapeValue(qtiXml, responseIdentifier);
  return fromXml.length > 0 ? fromXml : apiValue;
}

export function hottextXmlUsesShapeMode(
  qtiXml: string | null | undefined,
  responseIdentifier: string
): boolean {
  if (!qtiXml?.trim() || typeof DOMParser === "undefined") return false;
  const doc = new DOMParser().parseFromString(qtiXml, "text/xml");
  if (doc.querySelector("parsererror")) return false;
  return Array.from(doc.querySelectorAll("qti-hottext-interaction")).some(
    (interaction) =>
      (interaction.getAttribute("response-identifier") || "RESPONSE") === responseIdentifier &&
      readHottextMarkerMode(interaction) === "shape"
  );
}

export function readHottextSubmitRequirements(xml: string): HottextSubmitRequirement[] {
  if (!xml || typeof DOMParser === "undefined") return [];

  const doc = new DOMParser().parseFromString(xml, "text/xml");
  if (doc.querySelector("parsererror")) return [];

  return Array.from(doc.querySelectorAll("qti-hottext-interaction")).map((interaction) => {
    const groups = Array.from(interaction.querySelectorAll("span.hottext-group"))
      .filter((group) => group.closest("qti-hottext-interaction") === interaction)
      .map((group) => ({
        identifiers: hottextIdentifiersInGroup(group),
        maxChoices: readHottextMaxChoices(group),
      }));
    return {
      responseIdentifier: interaction.getAttribute("response-identifier") || "RESPONSE",
      minChoices: readHottextItemMinChoices(interaction, groups.length),
      maxChoices: readHottextItemMaxChoices(interaction),
      shapeMode: readHottextMarkerMode(interaction) === "shape",
      groups,
    };
  });
}

export function emptyHottextSubmit(xml: string): ResponseValueMap {
  const requirements = readHottextSubmitRequirements(xml);
  const body: Record<string, string[]> = {};
  if (requirements.length === 0) {
    body.RESPONSE = [];
    return body;
  }
  for (const requirement of requirements) body[requirement.responseIdentifier] = [];
  if (requirements.some((requirement) => requirement.shapeMode)) {
    body[HOTTEXT_SHAPES_RESPONSE_ID] = [];
  }
  return body;
}

export function canSubmitHottext(
  responses: ResponseValueMap,
  requirements: readonly HottextSubmitRequirement[]
): boolean {
  if (requirements.length === 0) return false;

  return requirements.every((requirement) => {
    const selected = readResponseIdentifiers(responses[requirement.responseIdentifier]);
    const grouped = requirement.groups.length > 0;
    if (grouped) {
      const groupsMatch = requirement.groups.every((group) => {
        const count = group.identifiers.filter((identifier) =>
          selected.includes(identifier)
        ).length;
        if (count < 1) return false;
        return group.maxChoices === HOTTEXT_MAX_CHOICES.MULTIPLE || count <= group.maxChoices;
      });
      if (!groupsMatch) return false;
    } else {
      if (requirement.maxChoices > 0 && selected.length > requirement.maxChoices) return false;
      if (selected.length < requirement.minChoices) return false;
    }
    if (!requirement.shapeMode) return selected.length > 0 || requirement.minChoices === 0;
    const shapes = readStudentShapes(responses[HOTTEXT_SHAPES_RESPONSE_ID]);
    return selected.every((identifier) => shapes[identifier] !== undefined);
  });
}

/**
 * 제출 전에는 고른 항목만 선택색이다.
 * 제출 후에는 제출 응답에 있는 식별자만 정오답색을 쓴다.
 * shape는 같은 ID라도 도형이 다르면 오답색이다. 고르지 않은 정답은 학생 색을 칠하지 않는다.
 */
export function hottextMarkTone(
  identifier: string,
  selected: readonly string[],
  feedback: HottextFeedback | null
): HottextMarkTone | null {
  if (!feedback) return selected.includes(identifier) ? "selected" : null;
  if (!feedback.submittedIds.includes(identifier)) return null;
  if (feedback.shapeMode && !feedback.studentShapes[identifier]) return null;
  if (!feedback.correctIds.includes(identifier)) return "incorrect";
  if (!feedback.shapeMode) return "correct";
  const expected = feedback.expectedShapes.get(identifier);
  return expected && feedback.studentShapes[identifier] === expected ? "correct" : "incorrect";
}

/** 정답 공개가 허용된 정답 ID의 기대 도형. selection은 원형이다. */
export function hottextExpectedShape(
  identifier: string,
  feedback: HottextFeedback | null
): HottextMarkerShape | null {
  if (!feedback || !feedback.correctIds.includes(identifier)) return null;
  if (!feedback.shapeMode) return "circle";
  return feedback.expectedShapes.get(identifier) ?? null;
}
