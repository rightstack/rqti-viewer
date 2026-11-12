/**
 * 복습 정답 표시용: identifier → 표시 문자열
 *
 * - qti-choice-interaction: label 속성이 있으면 그 값만; 없으면 interaction·부모 qti-ext-grid의
 *   qti-list-style-type-* 로 목록 마커(① 등); 그것도 없으면 본문 → identifier
 *   `qti-list-style-type-none`이면 buildChoiceCorrectAnswerItems로 원본 본문을 렌더
 * - qti-order-interaction: label 속성 → 순번 마커(A·1 등, identifier=DOM 순서에 고정) → 본문 → identifier
 * - qti-inline-choice-interaction: label → 본문 → 미디어 → identifier (단일 문자열, 기존과 동일)
 * - qti-hottext-interaction: identifier 대신 qti-hottext 본문. 수식은 `$...$`로 감싸 표시 단계에서 렌더
 * - qti-match-interaction 정답만: 쌍이 ROW_n / COL_m 형태면 `n-m` 또는 MatchAnswerView용 배열 (qtiXml으로 interaction 판별)
 * - qti-gap-match-interaction: 레이블이 있으면 레이블만(끝 `.` 제외), 없으면 본문만. 수식빈칸 본문은 GapMatchAnswerView
 * - FeedbackInline 정답 나열 순서: extractInteractionResponseIdentifiersInDocumentOrder 로 본문 interaction 순서 확보
 *
 * @see qti-ext.css @counter-style (circled_number, hangul-* …)
 */
import {
  IMAGE_INPUT_BLANK_TYPE,
  collectImageBlankCellIds,
} from "../interactions/image-input-blank/utils";
import { parsePairs } from "../interactions/match/utils";
import {
  MATH_INPUT_BLANK_TYPE,
  extractResponseIds,
  findMarkupDiv,
} from "../interactions/math-input-blank/utils";
import { extractListStyleType } from "../parser/listGrouping";
import type { MatchingPairType, MediaContentType, ResponseValueMap } from "../types";
import { extractMediaFromElement } from "./extractMediaFromElement";
import { removeMediaFromElementClone } from "./extractTextFromElement";
import { wrapMathFieldTextForInlineLatex } from "./wrapMathFieldTextForInlineLatex";

/** 정답 영역에 표시할 원문자 레이블. 본문용 마침표·공백은 넣지 않는다. */
const CIRCLED_MARKERS = [
  "①",
  "②",
  "③",
  "④",
  "⑤",
  "⑥",
  "⑦",
  "⑧",
  "⑨",
  "⑩",
] as const;

/** 정답 영역에 표시할 한글 자음 레이블 */
const HANGUL_CONSONANT_MARKERS = [
  "ㄱ",
  "ㄴ",
  "ㄷ",
  "ㄹ",
  "ㅁ",
  "ㅂ",
  "ㅅ",
  "ㅇ",
  "ㅈ",
  "ㅊ",
  "ㅋ",
  "ㅌ",
  "ㅍ",
  "ㅎ",
] as const;

/** hangul-consonant-paren */
const HANGUL_CONSONANT_PAREN_MARKERS = [
  "ㄱ)",
  "ㄴ)",
  "ㄷ)",
  "ㄹ)",
  "ㅁ)",
  "ㅂ)",
  "ㅅ)",
  "ㅇ)",
  "ㅈ)",
  "ㅊ)",
  "ㅋ)",
  "ㅌ)",
  "ㅍ)",
  "ㅎ)",
] as const;

/** hangul-consonant-bracket */
const HANGUL_CONSONANT_BRACKET_MARKERS = [
  "(ㄱ)",
  "(ㄴ)",
  "(ㄷ)",
  "(ㄹ)",
  "(ㅁ)",
  "(ㅂ)",
  "(ㅅ)",
  "(ㅇ)",
  "(ㅈ)",
  "(ㅊ)",
  "(ㅋ)",
  "(ㅌ)",
  "(ㅍ)",
  "(ㅎ)",
] as const;

/** hangul-syllable (class qti-list-style-type-hangul-syllable) */
const HANGUL_SYLLABLE_MARKERS = [
  "가",
  "나",
  "다",
  "라",
  "마",
  "바",
  "사",
  "아",
  "자",
  "차",
  "카",
  "타",
  "파",
  "하",
] as const;

function toSequenceAlpha(oneBased: number, baseCharCode: number): string {
  let s = "";
  let n = oneBased;
  while (n > 0) {
    n -= 1;
    s = String.fromCharCode(baseCharCode + (n % 26)) + s;
    n = Math.floor(n / 26);
  }
  return s;
}

function toRomanNumeral(num: number): string {
  const pairs: Array<[number, string]> = [
    [1000, "M"],
    [900, "CM"],
    [500, "D"],
    [400, "CD"],
    [100, "C"],
    [90, "XC"],
    [50, "L"],
    [40, "XL"],
    [10, "X"],
    [9, "IX"],
    [5, "V"],
    [4, "IV"],
    [1, "I"],
  ];
  let n = num;
  let out = "";
  for (const [v, sym] of pairs) {
    while (n >= v) {
      out += sym;
      n -= v;
    }
  }
  return out;
}

/**
 * choice interaction DOM 순서(1-based)에 해당하는 정답 레이블.
 * 본문용 마침표 구분자는 포함하지 않는다.
 * 알 수 없는 타입·범위 초과면 null → 호출부에서 일반 표시 로직으로 폴백.
 */
export function listStyleMarkerForIndex(
  listStyleType: string,
  oneBasedIndex: number,
): string | null {
  if (oneBasedIndex < 1) return null;
  const i = oneBasedIndex;

  switch (listStyleType) {
    case "decimal":
      return String(i);
    case "decimal-leading-zero":
      return i < 10 ? `0${i}` : String(i);
    case "lower-alpha":
      return toSequenceAlpha(i, 97);
    case "upper-alpha":
      return toSequenceAlpha(i, 65);
    case "lower-roman":
      return toRomanNumeral(i).toLowerCase();
    case "upper-roman":
      return toRomanNumeral(i);
    case "circled":
      return CIRCLED_MARKERS[i - 1] ?? null;
    case "hangul-consonant":
      return HANGUL_CONSONANT_MARKERS[i - 1] ?? null;
    case "hangul-consonant-paren":
      return HANGUL_CONSONANT_PAREN_MARKERS[i - 1] ?? null;
    case "hangul-consonant-bracket":
      return HANGUL_CONSONANT_BRACKET_MARKERS[i - 1] ?? null;
    case "hangul-syllable":
      return HANGUL_SYLLABLE_MARKERS[i - 1] ?? null;
    default:
      return null;
  }
}

const MEDIA_TYPE_LABEL: Record<MediaContentType["type"], string> = {
  image: "이미지",
  video: "동영상",
  audio: "오디오",
};

/**
 * 미디어 제거된 트리를 문서 순으로 직렬화. `qti-ext-mathfield`는 LaTeX 구간으로 붙임.
 */
function serializeChoiceBodyChildNodes(nodes: ChildNode[]): string {
  let out = "";
  for (const node of nodes) {
    if (node.nodeType === Node.TEXT_NODE) {
      out += node.textContent ?? "";
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      const e = node as Element;
      const cls = e.getAttribute("class") ?? "";
      if (cls.includes("qti-ext-mathfield")) {
        const chunk = wrapMathFieldTextForInlineLatex(e.textContent ?? "");
        if (chunk) out += chunk;
      } else {
        out += serializeChoiceBodyChildNodes(Array.from(e.childNodes));
      }
    }
  }
  return out;
}

/** 본문만 (텍스트 → 미디어 설명). 비어 있으면 "". */
function bodyDisplayFromChoiceElement(el: Element): string {
  const clone = el.cloneNode(true) as Element;
  removeMediaFromElementClone(clone);
  const bodyText = serializeChoiceBodyChildNodes(
    Array.from(clone.childNodes),
  ).trim();
  if (bodyText !== "") return bodyText;

  const media = extractMediaFromElement(el);
  if (media.length > 0) {
    const first = media[0];
    if (first.type === "image") {
      const alt = first.alt?.trim();
      if (alt) return alt;
    }
    const types = [...new Set(media.map((m) => m.type))];
    if (types.length === 1) {
      return MEDIA_TYPE_LABEL[types[0]];
    }
    return types.map((t) => MEDIA_TYPE_LABEL[t]).join(" · ");
  }

  return "";
}

function classTokens(classAttr: string): string[] {
  return classAttr.trim().split(/\s+/).filter(Boolean);
}

/** div.qti-ext-grid / qti-ext-grid-N 등 그리드 래퍼인지 */
function isQtiExtGridClass(classAttr: string): boolean {
  return classTokens(classAttr).some(
    (t) => t === "qti-ext-grid" || /^qti-ext-grid-\d+$/.test(t),
  );
}

/**
 * choice-interaction 자신의 class 또는 (grid일 때) 조상 qti-ext-grid의 class에서 list-style 추출
 */
function listStyleTypeForChoiceInteraction(
  interaction: Element,
): string | null {
  const fromEl = (el: Element) =>
    extractListStyleType(el.getAttribute("class") ?? "");

  const own = fromEl(interaction);
  if (own) return own;

  let p: Element | null = interaction.parentElement;
  while (p) {
    const cls = p.getAttribute("class") ?? "";
    if (isQtiExtGridClass(cls)) {
      const t = fromEl(p);
      if (t) return t;
    }
    p = p.parentElement;
  }
  return null;
}

/** qti-choice-interaction: label 속성 → 목록 마커(grid·interaction) → 본문 → identifier */
function choiceDisplayForBlockChoiceInteraction(
  el: Element,
  identifier: string,
  listStyleType: string | null,
  oneBasedIndex: number,
): string {
  const labelAttr = el.getAttribute("label")?.trim();
  if (labelAttr && labelAttr !== "") {
    return labelAttr;
  }

  if (listStyleType) {
    const m = listStyleMarkerForIndex(listStyleType, oneBasedIndex);
    if (m !== null) {
      return m.trim();
    }
  }

  const body = bodyDisplayFromChoiceElement(el);
  if (body !== "") {
    return body;
  }
  return identifier;
}

/** qti-inline-choice-interaction 등: 단일 표기 */
function choiceDisplayStringForElement(
  el: Element,
  identifier: string,
): string {
  const label = el.getAttribute("label")?.trim();
  if (label && label !== "") return label;

  const body = bodyDisplayFromChoiceElement(el);
  if (body !== "") return body;

  return identifier;
}

/** 수식 노드가 아니면 그대로, 수식이면 `$...$`로 감싸 parseTextWithLaTeX가 그리게 한다. */
function delimitHottextLatex(latex: string): string {
  const trimmed = latex.trim();
  if (trimmed.startsWith("$") || trimmed.startsWith("\\(") || trimmed.startsWith("\\[")) {
    return trimmed;
  }
  return `$${trimmed}$`;
}

/** qti-hottext 본문. 글자는 텍스트, qti-ext-mathfield는 data-latex를 수식으로 남긴다. */
function hottextContentForDisplay(el: Element): string {
  let out = "";
  const walk = (node: Node) => {
    if (node.nodeType === Node.TEXT_NODE) {
      out += node.textContent ?? "";
      return;
    }
    if (node.nodeType !== Node.ELEMENT_NODE) return;
    const element = node as Element;
    const className = element.getAttribute("class") ?? "";
    if (className.includes("qti-ext-mathfield")) {
      const latex = (element.getAttribute("data-latex") ?? element.textContent ?? "").trim();
      if (latex) out += delimitHottextLatex(latex);
      return;
    }
    element.childNodes.forEach(walk);
  };
  el.childNodes.forEach(walk);
  return out.trim();
}

export function buildChoiceIdentifierDisplayMapsFromQtiXml(
  qtiXml: string,
): Map<string, Map<string, string>> | null {
  if (!qtiXml?.trim()) return null;
  const doc = new DOMParser().parseFromString(qtiXml, "text/xml");
  if (doc.querySelector("parsererror")) return null;

  const result = new Map<string, Map<string, string>>();

  const addBlockChoices = (interaction: Element) => {
    const respId = interaction.getAttribute("response-identifier")?.trim();
    if (!respId) return;
    let map = result.get(respId);
    if (!map) {
      map = new Map();
      result.set(respId, map);
    }
    const choiceMap = map;
    const listStyleType = listStyleTypeForChoiceInteraction(interaction);

    interaction.querySelectorAll("qti-simple-choice").forEach((el, idx) => {
      const id = el.getAttribute("identifier")?.trim() ?? "";
      if (!id) return;
      choiceMap.set(
        id,
        choiceDisplayForBlockChoiceInteraction(el, id, listStyleType, idx + 1),
      );
    });
  };

  const addOrderChoices = (interaction: Element) => {
    const respId = interaction.getAttribute("response-identifier")?.trim();
    if (!respId) return;
    let map = result.get(respId);
    if (!map) {
      map = new Map();
      result.set(respId, map);
    }
    const choiceMap = map;
    // order는 순번 라벨이 identifier(DOM 순서)에 고정되어 따라간다. 미지정 시 decimal.
    const listStyleType =
      extractListStyleType(interaction.getAttribute("class") ?? "") ??
      "decimal";

    interaction.querySelectorAll("qti-simple-choice").forEach((el, idx) => {
      const id = el.getAttribute("identifier")?.trim() ?? "";
      if (!id) return;
      choiceMap.set(
        id,
        choiceDisplayForBlockChoiceInteraction(el, id, listStyleType, idx + 1),
      );
    });
  };

  const addInlineChoices = (interaction: Element) => {
    const respId = interaction.getAttribute("response-identifier")?.trim();
    if (!respId) return;
    let map = result.get(respId);
    if (!map) {
      map = new Map();
      result.set(respId, map);
    }
    const choiceMap = map;
    const listStyleType = extractListStyleType(
      interaction.getAttribute("class") ?? "",
    );

    interaction.querySelectorAll("qti-inline-choice").forEach((el, idx) => {
      const id = el.getAttribute("identifier")?.trim() ?? "";
      if (!id) return;
      let display: string;
      if (listStyleType) {
        const marker = listStyleMarkerForIndex(listStyleType, idx + 1);
        display =
          marker !== null
            ? marker.trim()
            : choiceDisplayStringForElement(el, id);
      } else {
        display = choiceDisplayStringForElement(el, id);
      }
      choiceMap.set(id, display);
    });
  };

  const addHottextChoices = (interaction: Element) => {
    const respId = interaction.getAttribute("response-identifier")?.trim();
    if (!respId) return;
    let map = result.get(respId);
    if (!map) {
      map = new Map();
      result.set(respId, map);
    }
    interaction.querySelectorAll("qti-hottext").forEach((el) => {
      const id = el.getAttribute("identifier")?.trim() ?? "";
      if (!id) return;
      const display = hottextContentForDisplay(el);
      map.set(id, display !== "" ? display : id);
    });
  };

  doc.querySelectorAll("qti-choice-interaction").forEach((el) => {
    addBlockChoices(el);
  });
  doc.querySelectorAll("qti-order-interaction").forEach((el) => {
    addOrderChoices(el);
  });
  doc.querySelectorAll("qti-inline-choice-interaction").forEach((el) => {
    addInlineChoices(el);
  });
  doc.querySelectorAll("qti-hottext-interaction").forEach((el) => {
    addHottextChoices(el);
  });

  return result;
}

/** 쉼표 선택자로 문서 순서 유지 (다중 TFQ·빈칸·인라인 선택·매칭 혼합) */
const INTERACTION_ORDER_SELECTOR =
  "qti-choice-interaction, qti-order-interaction, qti-inline-choice-interaction, qti-text-entry-interaction, qti-match-interaction, qti-gap-match-interaction, qti-portable-custom-interaction, qti-hotspot-interaction, qti-hottext-interaction";

/**
 * 복습 정답 표시 순서용: 위 interaction들의 response-identifier를 XML 트리 순으로 수집.
 * 중복 id는 첫 occurrence만. 파싱 실패·빈 XML이면 null.
 */
export function extractInteractionResponseIdentifiersInDocumentOrder(
  qtiXml: string | null | undefined,
): string[] | null {
  if (!qtiXml?.trim()) return null;
  const doc = new DOMParser().parseFromString(qtiXml, "text/xml");
  if (doc.querySelector("parsererror")) return null;

  const out: string[] = [];
  const seen = new Set<string>();
  doc.querySelectorAll(INTERACTION_ORDER_SELECTOR).forEach((el) => {
    const id = el.getAttribute("response-identifier")?.trim();
    if (!id || seen.has(id)) return;
    seen.add(id);
    out.push(id);
  });
  return out;
}

/** CLOZE 분수: `FRACTION_1_N` → base `FRACTION_1`, part `N` (W=정수부, N=분자, D=분모) */
const FRACTION_RESPONSE_PART_RE = /^(FRACTION_.+)_(N|D|W)$/;

export function parseFractionResponsePart(
  identifier: string,
): { base: string; part: "N" | "D" | "W" } | null {
  const m = identifier.match(FRACTION_RESPONSE_PART_RE);
  if (!m) return null;
  const part = m[2];
  if (part !== "N" && part !== "D" && part !== "W") return null;
  return { base: m[1], part };
}

function responseScalarStringForCorrectAnswer(value: unknown): string {
  if (value === undefined || value === null) return "";
  if (Array.isArray(value)) return String(value[0] ?? "").trim();
  if (typeof value === "string") return value.trim();
  return String(value).trim();
}

/** n·d 필수. w가 있으면 대분수 `w\\frac{n}{d}`, 없으면 `\\frac{n}{d}`. */
export function buildFractionLatexFromParts(
  w: string,
  n: string,
  d: string,
): string | null {
  if (!n || !d) return null;
  const frac = `\\frac{${n}}{${d}}`;
  if (w) return `${w}${frac}`;
  return frac;
}

export type CorrectAnswerFeedbackSegment =
  | { kind: "fractionLatex"; latex: string; key: string }
  | { kind: "vcqGrid"; key: string; correctAnswer: ResponseValueMap }
  | { kind: "mathInputBlank"; key: string; correctAnswer: ResponseValueMap }
  | { kind: "imageInputBlank"; key: string; correctAnswer: ResponseValueMap }
  | { kind: "hotspot"; key: string; correctAnswer: ResponseValueMap }
  | { kind: "default"; key: string; value: unknown };

function getPciElementsByType(qtiXml: string | null | undefined, type: string): Element[] {
  if (!qtiXml?.trim()) return [];
  const doc = new DOMParser().parseFromString(qtiXml, "text/xml");
  if (doc.querySelector("parsererror")) return [];
  return Array.from(doc.querySelectorAll("qti-portable-custom-interaction")).filter(
    (el) => el.getAttribute("custom-interaction-type-identifier") === type
  );
}

export function getMathInputBlankPciElementsFromQtiXml(
  qtiXml: string | null | undefined
): Element[] {
  return getPciElementsByType(qtiXml, MATH_INPUT_BLANK_TYPE);
}

export function getImageInputBlankPciElementsFromQtiXml(
  qtiXml: string | null | undefined
): Element[] {
  return getPciElementsByType(qtiXml, IMAGE_INPUT_BLANK_TYPE);
}

export function getHotspotInteractionElementsFromQtiXml(
  qtiXml: string | null | undefined,
): Element[] {
  if (!qtiXml?.trim()) return [];
  const doc = new DOMParser().parseFromString(qtiXml, "text/xml");
  if (doc.querySelector("parsererror")) return [];
  return Array.from(doc.querySelectorAll("qti-hotspot-interaction"));
}

function collectMathInputBlankIds(pciElements: Element[]): Set<string> {
  const ids = new Set<string>();
  for (const el of pciElements) {
    const latex = findMarkupDiv(el)?.getAttribute("data-latex") ?? "";
    for (const id of extractResponseIds(latex)) ids.add(id);
  }
  return ids;
}

export function getVcqResponseGridElementFromQtiXml(
  qtiXml: string | null | undefined,
): Element | null {
  if (!qtiXml?.trim()) return null;
  const doc = new DOMParser().parseFromString(qtiXml, "text/xml");
  if (doc.querySelector("parsererror")) return null;
  return (
    Array.from(doc.querySelectorAll("div")).find((el) => {
      const cls = el.getAttribute("class") ?? "";
      return cls.split(/\s+/).includes("qti-ext-vcq-grid--response");
    }) ?? null
  );
}

/**
 * 복습 정답 줄: VCQ response 그리드면 `vcqGrid`, `FRACTION_*_{N|D|W}` 는 베이스별로 묶어 LaTeX.
 * 문서 순서는 `extractInteractionResponseIdentifiersInDocumentOrder`와 동일하며,
 * 그룹은 해당 베이스 파트 중 XML에서 가장 먼저 나오는 식별자 위치에 한 번만 출력.
 * n/d 불완전 시 기존처럼 키별 `default` 세그먼트로 폴백.
 */
export function buildCorrectAnswerFeedbackSegments(
  correctAnswer: Record<string, unknown>,
  qtiXml: string | null | undefined,
): CorrectAnswerFeedbackSegment[] {
  if (
    Object.keys(correctAnswer).length > 0 &&
    getVcqResponseGridElementFromQtiXml(qtiXml) !== null
  ) {
    return [{ kind: "vcqGrid", key: "vcq", correctAnswer: correctAnswer as ResponseValueMap }];
  }

  const mathPciElements = getMathInputBlankPciElementsFromQtiXml(qtiXml);
  const mathPciResponseIds = new Set(
    mathPciElements
      .map((el) => el.getAttribute("response-identifier")?.trim() ?? "")
      .filter((id) => id.length > 0)
  );
  const mathBlankIds = collectMathInputBlankIds(mathPciElements);

  // 이미지 빈칸도 수식 빈칸처럼 루트 ID 하나를 한 세그먼트(그림)로 보여준다.
  // 안쪽 칸 ID는 정답 맵에 따로 들어 있으므로 거르지 않으면 같은 답이 두 번 나온다.
  const imagePciElements = getImageInputBlankPciElementsFromQtiXml(qtiXml);
  const imagePciResponseIds = new Set(
    imagePciElements
      .map((el) => el.getAttribute("response-identifier")?.trim() ?? "")
      .filter((id) => id.length > 0)
  );
  const imageBlankIds = new Set(imagePciElements.flatMap(collectImageBlankCellIds));
  const hotspotResponseIds = new Set(
    getHotspotInteractionElementsFromQtiXml(qtiXml)
      .map((el) => el.getAttribute("response-identifier")?.trim() ?? "")
      .filter((id) => id.length > 0),
  );

  const entries = Object.entries(correctAnswer);
  const order = extractInteractionResponseIdentifiersInDocumentOrder(qtiXml);

  const orderedIds: string[] = [];
  const used = new Set<string>();
  if (order && order.length > 0) {
    for (const id of order) {
      if (
        !mathPciResponseIds.has(id) &&
        !imagePciResponseIds.has(id) &&
        !Object.prototype.hasOwnProperty.call(correctAnswer, id)
      ) {
        continue;
      }
      orderedIds.push(id);
      used.add(id);
    }
    for (const [k] of entries) {
      if (!used.has(k)) orderedIds.push(k);
    }
  } else {
    for (const [k] of entries) {
      orderedIds.push(k);
    }
  }

  const consumedFractionBases = new Set<string>();

  const segmentForId = (rid: string): CorrectAnswerFeedbackSegment | null => {
    const parsed = parseFractionResponsePart(rid);
    if (!parsed) {
      return { kind: "default", key: rid, value: correctAnswer[rid] };
    }
    const { base } = parsed;
    if (consumedFractionBases.has(base)) {
      return null;
    }
    const n = responseScalarStringForCorrectAnswer(correctAnswer[`${base}_N`]);
    const d = responseScalarStringForCorrectAnswer(correctAnswer[`${base}_D`]);
    const w = responseScalarStringForCorrectAnswer(correctAnswer[`${base}_W`]);
    const latex = buildFractionLatexFromParts(w, n, d);
    if (latex !== null) {
      consumedFractionBases.add(base);
      return { kind: "fractionLatex", latex, key: rid };
    }
    return { kind: "default", key: rid, value: correctAnswer[rid] };
  };

  const out: CorrectAnswerFeedbackSegment[] = [];
  for (const rid of orderedIds) {
    if (mathPciResponseIds.has(rid)) {
      out.push({
        kind: "mathInputBlank",
        key: rid,
        correctAnswer: correctAnswer as ResponseValueMap,
      });
      continue;
    }
    if (imagePciResponseIds.has(rid)) {
      out.push({
        kind: "imageInputBlank",
        key: rid,
        correctAnswer: correctAnswer as ResponseValueMap,
      });
      continue;
    }
    if (hotspotResponseIds.has(rid)) {
      if (Object.prototype.hasOwnProperty.call(correctAnswer, rid)) {
        out.push({
          kind: "hotspot",
          key: rid,
          correctAnswer: correctAnswer as ResponseValueMap,
        });
      }
      continue;
    }
    if (rid === "RESPONSE_SHAPES") continue;
    if (!Object.prototype.hasOwnProperty.call(correctAnswer, rid)) continue;
    if (mathBlankIds.has(rid) || imageBlankIds.has(rid)) continue;
    const seg = segmentForId(rid);
    if (seg) out.push(seg);
  }
  return out;
}

const ROW_ID_RE = /^ROW_(\d+)$/i;
const COL_ID_RE = /^COL_(\d+)$/i;

/**
 * `qti-match-interaction` 안 첫·둘째 `qti-simple-match-set`의
 * `qti-simple-associable-choice` identifier를 문서 순서로 수집한다.
 * 3개 이상 세트인 경우 MatchAnswerView가 2열만 가정하므로 앞 두 세트만 사용한다.
 */
export function extractMatchRowColIdentifiersFromQtiXml(
  qtiXml: string | null | undefined,
  responseIdentifier?: string | null,
): { rows: string[]; cols: string[] } | null {
  if (!qtiXml?.trim()) return null;
  const doc = new DOMParser().parseFromString(qtiXml, "text/xml");
  if (doc.querySelector("parsererror")) return null;

  const rid = responseIdentifier?.trim();
  let interaction: Element | null = null;
  if (rid) {
    interaction =
      Array.from(doc.querySelectorAll("qti-match-interaction")).find(
        (el) => el.getAttribute("response-identifier")?.trim() === rid,
      ) ?? null;
  } else {
    interaction = doc.querySelector("qti-match-interaction");
  }

  if (!interaction) return null;

  const directSets = Array.from(
    interaction.querySelectorAll(":scope > qti-simple-match-set"),
  );
  const matchSets =
    directSets.length > 0
      ? directSets
      : Array.from(interaction.querySelectorAll("qti-simple-match-set"));

  if (matchSets.length < 2) {
    return { rows: [], cols: [] };
  }

  const collectIdentifiers = (set: Element): string[] => {
    const out: string[] = [];
    set.querySelectorAll("qti-simple-associable-choice").forEach((el) => {
      const id = el.getAttribute("identifier")?.trim() ?? "";
      if (id) out.push(id);
    });
    return out;
  };

  return {
    rows: collectIdentifiers(matchSets[0]),
    cols: collectIdentifiers(matchSets[1]),
  };
}

/**
 * `MatchInteraction`에 전달할 `qti-match-interaction` 요소.
 * 파싱 실패·해당 `response-identifier` 없으면 null. 반환 Element는 파싱된 Document에 귀속된다.
 */
export function getMatchInteractionElementFromQtiXml(
  qtiXml: string | null | undefined,
  responseIdentifier: string,
): Element | null {
  if (!qtiXml?.trim()) return null;
  const rid = responseIdentifier.trim();
  if (!rid) return null;
  const doc = new DOMParser().parseFromString(qtiXml, "text/xml");
  if (doc.querySelector("parsererror")) return null;
  return (
    Array.from(doc.querySelectorAll("qti-match-interaction")).find(
      (el) => el.getAttribute("response-identifier")?.trim() === rid,
    ) ?? null
  );
}

/** 해당 응답이 문항 XML 안의 qti-order-interaction 인지 */
export function isOrderInteractionResponse(
  qtiXml: string | null | undefined,
  responseIdentifier: string,
): boolean {
  return findOrderInteraction(qtiXml, responseIdentifier) !== null;
}

function findOrderInteraction(
  qtiXml: string | null | undefined,
  responseIdentifier: string,
): Element | null {
  const rid = responseIdentifier.trim();
  if (!rid || !qtiXml?.trim()) return null;
  const doc = new DOMParser().parseFromString(qtiXml, "text/xml");
  if (doc.querySelector("parsererror")) return null;
  return (
    Array.from(doc.querySelectorAll("qti-order-interaction")).find(
      (el) => el.getAttribute("response-identifier")?.trim() === rid,
    ) ?? null
  );
}

function orderChoicesById(interaction: Element): Map<string, { element: Element; index: number }> {
  const choiceById = new Map<string, { element: Element; index: number }>();
  interaction.querySelectorAll("qti-simple-choice").forEach((el, index) => {
    const id = el.getAttribute("identifier")?.trim() ?? "";
    if (!id || choiceById.has(id)) return;
    choiceById.set(id, { element: el, index });
  });
  return choiceById;
}

function orderResponseIds(value: unknown): string[] {
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed ? [trimmed] : [];
  }
  if (Array.isArray(value)) {
    return value.map((item) => (typeof item === "string" ? item : String(item)));
  }
  if (value === null || value === undefined) return [];
  return [String(value)];
}

export type OrderCorrectAnswerItem =
  | { kind: "text"; key: string; text: string }
  | { kind: "body"; key: string; html: string };

export type ChoiceCorrectAnswerItem =
  | { kind: "text"; key: string; text: string }
  | { kind: "body"; key: string; element: Element };

/** 레이블 없는 선다형 정답은 이미지·캡션·수식 마커를 포함한 원본 본문을 보존한다. */
export function buildChoiceCorrectAnswerItems(
  qtiXml: string | null | undefined,
  responseIdentifier: string,
  value: unknown,
): ChoiceCorrectAnswerItem[] | null {
  if (!qtiXml?.trim()) return null;
  const doc = new DOMParser().parseFromString(qtiXml, "text/xml");
  if (doc.querySelector("parsererror")) return null;

  const interaction = Array.from(doc.querySelectorAll("qti-choice-interaction")).find(
    (el) => el.getAttribute("response-identifier")?.trim() === responseIdentifier,
  );
  if (!interaction || listStyleTypeForChoiceInteraction(interaction) !== "none") return null;

  const ids = orderResponseIds(value);
  if (ids.length === 0) return null;
  const choices = orderChoicesById(interaction);

  return ids.map((id, index) => {
    const key = `${id}-${index}`;
    const choice = choices.get(id)?.element;
    if (!choice) return { kind: "text", key, text: id };
    const hasBody = Array.from(choice.childNodes).some(
      (node) => node.nodeType === Node.ELEMENT_NODE || node.textContent?.trim(),
    );
    return hasBody ? { kind: "body", key, element: choice } : { kind: "text", key, text: id };
  });
}

function serializeElementChildren(el: Element): string {
  const serializer = new XMLSerializer();
  return Array.from(el.childNodes)
    .map((node) => serializer.serializeToString(node))
    .join("");
}

export function buildOrderCorrectAnswerItems(
  qtiXml: string | null | undefined,
  responseIdentifier: string,
  value: unknown,
): OrderCorrectAnswerItem[] | null {
  const interaction = findOrderInteraction(qtiXml, responseIdentifier);
  if (!interaction) return null;

  const extracted = extractListStyleType(interaction.getAttribute("class") ?? "");
  if (extracted !== "none") return null;

  const choiceById = orderChoicesById(interaction);
  const ids = orderResponseIds(value);
  if (ids.length === 0) return null;

  return ids.map((id, index) => {
    const key = `${id}-${index}`;
    const choice = choiceById.get(id);
    if (!choice) return { kind: "text", key, text: id };
    const label = choice.element.getAttribute("label")?.trim();
    if (label) return { kind: "text", key, text: label };
    if (bodyDisplayFromChoiceElement(choice.element) === "") return { kind: "text", key, text: id };
    return { kind: "body", key, html: serializeElementChildren(choice.element) };
  });
}

/** 해당 응답이 문항 XML 안의 qti-hottext-interaction 인지 */
export function isHottextInteractionResponse(
  qtiXml: string | null | undefined,
  responseIdentifier: string,
): boolean {
  const rid = responseIdentifier.trim();
  if (!rid || !qtiXml?.trim()) return false;
  const doc = new DOMParser().parseFromString(qtiXml, "text/xml");
  if (doc.querySelector("parsererror")) return false;
  return Array.from(doc.querySelectorAll("qti-hottext-interaction")).some(
    (el) => el.getAttribute("response-identifier")?.trim() === rid,
  );
}

/** 해당 응답이 문항 XML 안의 qti-match-interaction 인지 */
export function isMatchInteractionResponse(
  qtiXml: string | null | undefined,
  responseIdentifier: string,
): boolean {
  const rid = responseIdentifier.trim();
  if (!rid || !qtiXml?.trim()) return false;
  const doc = new DOMParser().parseFromString(qtiXml, "text/xml");
  if (doc.querySelector("parsererror")) return false;
  return Array.from(doc.querySelectorAll("qti-match-interaction")).some(
    (el) => el.getAttribute("response-identifier")?.trim() === rid,
  );
}

/** `ROW_2 COL_1, ROW_3 COL_2` 한 줄·배열 한 칸 등 쉼표 구분 쌍 처리 */
function matchPairsForDisplay(value: unknown): MatchingPairType[] {
  const unwrapSingleCommaString =
    Array.isArray(value) &&
    value.length === 1 &&
    typeof value[0] === "string" &&
    value[0].includes(",");

  if (typeof value === "string" || unwrapSingleCommaString) {
    const raw = typeof value === "string" ? value : String(value[0]);
    const t = raw.trim();
    if (!t) return [];
    return t
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
      .map((seg) => {
        const parts = seg.split(/\s+/).filter(Boolean);
        return { leftId: parts[0] ?? "", rightId: parts[1] ?? "" };
      });
  }

  return parsePairs(value);
}

/**
 * qti-match-interaction 이고 각 쌍에 좌·우 identifier가 있으면 MatchAnswerView용 `"left right"` 배열.
 * identifier는 XML/API 그대로(ROW_n/COL_m 포함).
 */
export function getMatchCorrectResponseStrings(
  qtiXml: string | null | undefined,
  responseIdentifier: string,
  value: unknown,
): string[] | null {
  if (!isMatchInteractionResponse(qtiXml, responseIdentifier)) return null;
  const pairs = matchPairsForDisplay(value);
  if (pairs.length === 0) return null;
  const out: string[] = [];
  for (const p of pairs) {
    const left = typeof p.leftId === "string" ? p.leftId.trim() : "";
    const right = typeof p.rightId === "string" ? p.rightId.trim() : "";
    if (!left || !right) return null;
    out.push(`${left} ${right}`);
  }
  return out;
}

/** qti-match-interaction 정답: ROW_*·COL_* 쌍이면 `2-1, 3-2`, 그 외는 `id → id` 조각으로 이어 붙임 */
export function formatMatchCorrectAnswerForDisplay(
  qtiXml: string | null | undefined,
  responseIdentifier: string,
  value: unknown,
): string | null {
  const strings = getMatchCorrectResponseStrings(
    qtiXml,
    responseIdentifier,
    value,
  );
  if (strings === null) return null;
  const parts = strings.map((seg) => {
    const spaceIdx = seg.indexOf(" ");
    if (spaceIdx < 0) return seg;
    const left = seg.slice(0, spaceIdx);
    const right = seg.slice(spaceIdx + 1).trim();
    const rowM = left.match(ROW_ID_RE);
    const colM = right.match(COL_ID_RE);
    if (rowM && colM) {
      return `${parseInt(rowM[1], 10)}-${parseInt(colM[1], 10)}`;
    }
    return `${left} → ${right}`;
  });
  return parts.join(", ");
}

/** `response-identifier`에 해당하는 `qti-gap-match-interaction` 요소 (없으면 null) */
function getGapMatchInteractionElementFromQtiXml(
  qtiXml: string | null | undefined,
  responseIdentifier: string,
): Element | null {
  if (!qtiXml?.trim()) return null;
  const rid = responseIdentifier.trim();
  if (!rid) return null;
  const doc = new DOMParser().parseFromString(qtiXml, "text/xml");
  if (doc.querySelector("parsererror")) return null;
  return (
    Array.from(doc.querySelectorAll("qti-gap-match-interaction")).find(
      (el) => el.getAttribute("response-identifier")?.trim() === rid,
    ) ?? null
  );
}

/** 해당 응답이 문항 XML 안의 qti-gap-match-interaction 인지 */
export function isGapMatchInteractionResponse(
  qtiXml: string | null | undefined,
  responseIdentifier: string,
): boolean {
  return (
    getGapMatchInteractionElementFromQtiXml(qtiXml, responseIdentifier) !== null
  );
}

const LABEL_STYLE = {
  NUMBER: "number",
  NUMBER_CIRCLE: "number_circle",
  KOREAN_CONSONANT: "korean_consonant",
  KOREAN_CONSONANT_PAREN: "korean_consonant_paren",
  KOREAN_SYLLABLE: "korean_syllable",
  ENGLISH: "english",
  ENGLISH_UPPER: "english_upper",
  NONE: "none",
} as const;

type LabelStyleType = (typeof LABEL_STYLE)[keyof typeof LABEL_STYLE];

const GAP_CHOICE_LABEL_CLASS_PREFIX = "qti-ext-gap-label-";

const GAP_CHOICE_LABEL_TYPES = new Set<LabelStyleType>([
  LABEL_STYLE.NUMBER,
  LABEL_STYLE.NUMBER_CIRCLE,
  LABEL_STYLE.ENGLISH,
  LABEL_STYLE.ENGLISH_UPPER,
  LABEL_STYLE.KOREAN_CONSONANT,
  LABEL_STYLE.KOREAN_CONSONANT_PAREN,
  LABEL_STYLE.KOREAN_SYLLABLE,
]);

const CHOICE_LABEL_KOREAN_CONSONANTS = [
  "ㄱ",
  "ㄴ",
  "ㄷ",
  "ㄹ",
  "ㅁ",
  "ㅂ",
  "ㅅ",
  "ㅇ",
  "ㅈ",
  "ㅊ",
  "ㅋ",
  "ㅌ",
  "ㅍ",
  "ㅎ",
];

const CHOICE_LABEL_KOREAN_SYLLABLES = [
  "가",
  "나",
  "다",
  "라",
  "마",
  "바",
  "사",
  "아",
  "자",
  "차",
  "카",
  "타",
  "파",
  "하",
];

const CHOICE_LABEL_NUMBER_CIRCLE = ["①", "②", "③", "④", "⑤", "⑥", "⑦", "⑧", "⑨", "⑩"];

/** release-prd `labelUtils.getChoiceLabel`. 저작 모듈 의존 없이 함수만 옮긴다. */
function getChoiceLabel(style: LabelStyleType, index: number): string {
  switch (style) {
    case LABEL_STYLE.NUMBER:
      return `${(index + 1).toString()}.`;
    case LABEL_STYLE.NUMBER_CIRCLE:
      return CHOICE_LABEL_NUMBER_CIRCLE[index] || (index + 1).toString();
    case LABEL_STYLE.KOREAN_CONSONANT:
      return `${CHOICE_LABEL_KOREAN_CONSONANTS[index] || (index + 1).toString()}.`;
    case LABEL_STYLE.KOREAN_CONSONANT_PAREN:
      return `${CHOICE_LABEL_KOREAN_CONSONANTS[index] || (index + 1).toString()})`;
    case LABEL_STYLE.KOREAN_SYLLABLE:
      return `${CHOICE_LABEL_KOREAN_SYLLABLES[index] || (index + 1).toString()}.`;
    case LABEL_STYLE.ENGLISH:
      return `${String.fromCharCode(97 + index)}.`;
    case LABEL_STYLE.ENGLISH_UPPER:
      return `${String.fromCharCode(65 + index)}.`;
    case LABEL_STYLE.NONE:
      return "";
    default:
      return (index + 1).toString();
  }
}

/**
 * interaction class의 `qti-ext-gap-label-*`를 읽는다.
 * 접두 부분 일치는 쓰지 않고, 토큰 뒷부분을 enum과 완전 일치할 때만 인정한다.
 * 없거나 `none`이거나 알 수 없는 값이면 null.
 */
function extractGapChoiceLabelType(className: string): LabelStyleType | null {
  if (!className.trim()) return null;

  for (const token of className.trim().split(/\s+/)) {
    if (!token.startsWith(GAP_CHOICE_LABEL_CLASS_PREFIX)) continue;
    const type = token.slice(GAP_CHOICE_LABEL_CLASS_PREFIX.length);
    if (GAP_CHOICE_LABEL_TYPES.has(type as LabelStyleType)) {
      return type as LabelStyleType;
    }
    return null;
  }

  return null;
}

const MATH_INPUT_BLANK_SELECTOR = ".qti-ext-input-blank, .qti-ext-math-input-blank";

function hasMathInputBlank(el: Element): boolean {
  if (el.querySelector(MATH_INPUT_BLANK_SELECTOR)) return true;
  if ((el.textContent ?? "").includes("\\inputblank")) return true;
  return Array.from(el.querySelectorAll("[data-latex]")).some((node) =>
    (node.getAttribute("data-latex") ?? "").includes("\\inputblank")
  );
}

type GapMatchChoiceDisplay = {
  label: string;
  text: string;
  blankElement?: Element;
};

type GapMatchCorrectChoice = GapMatchChoiceDisplay & {
  gapId: string;
};

function resolveGapMatchCorrectChoices(
  qtiXml: string | null | undefined,
  responseIdentifier: string,
  value: unknown
): GapMatchCorrectChoice[] | null {
  const interaction = getGapMatchInteractionElementFromQtiXml(qtiXml, responseIdentifier);
  if (!interaction) return null;

  const choiceLabelType = extractGapChoiceLabelType(interaction.getAttribute("class") ?? "");
  const choiceById = new Map<string, GapMatchChoiceDisplay>();
  interaction.querySelectorAll("qti-gap-text").forEach((el, idx) => {
    const id = el.getAttribute("identifier")?.trim() ?? "";
    if (!id) return;
    const label = choiceLabelType
      ? getChoiceLabel(choiceLabelType, idx).trim().replace(/\.$/, "")
      : "";
    choiceById.set(id, {
      label,
      text: bodyDisplayFromChoiceElement(el) || id,
      ...(label === "" && hasMathInputBlank(el) ? { blankElement: el } : {}),
    });
  });

  const gapIds: string[] = [];
  interaction.querySelectorAll("qti-gap").forEach((el) => {
    const id = el.getAttribute("identifier")?.trim() ?? "";
    if (id) gapIds.push(id);
  });
  if (gapIds.length === 0) return null;

  const gapIdSet = new Set(gapIds);
  const gapToChoice = new Map<string, string>();
  for (const pair of matchPairsForDisplay(value)) {
    const a = typeof pair.leftId === "string" ? pair.leftId.trim() : "";
    const b = typeof pair.rightId === "string" ? pair.rightId.trim() : "";
    let gapId = a;
    let choiceId = b;
    if (!gapIdSet.has(a) && gapIdSet.has(b)) {
      gapId = b;
      choiceId = a;
    }
    if (gapId) gapToChoice.set(gapId, choiceId);
  }
  if (gapToChoice.size === 0) return null;

  const resolved: GapMatchCorrectChoice[] = [];
  gapIds.forEach((gapId) => {
    const choiceId = gapToChoice.get(gapId);
    if (!choiceId) return;
    resolved.push({
      gapId,
      ...(choiceById.get(choiceId) ?? { label: "", text: choiceId }),
    });
  });
  return resolved.length > 0 ? resolved : null;
}

export type GapMatchAnswerDisplayPart =
  | { gapId: string; text: string }
  | { gapId: string; element: Element };

/** 레이블이 없고 수식빈칸이 있을 때만. 그 외는 null → 문자열 포맷터. */
export function getGapMatchMathBlankAnswerParts(
  qtiXml: string | null | undefined,
  responseIdentifier: string,
  value: unknown
): GapMatchAnswerDisplayPart[] | null {
  const choices = resolveGapMatchCorrectChoices(qtiXml, responseIdentifier, value);
  if (!choices?.some((choice) => choice.blankElement)) return null;
  return choices.map((choice) =>
    choice.blankElement
      ? { gapId: choice.gapId, element: choice.blankElement }
      : { gapId: choice.gapId, text: choice.label || choice.text }
  );
}

/**
 * qti-gap-match-interaction 정답 표시.
 * - gap 문서 순. 레이블이 있으면 레이블만, 없으면 본문만 (`①, ③` 또는 `서울, 한강`)
 * - 레이블 끝 `.`는 선택형과 같이 뺀다 (`A.` → `A`)
 * - 레이블은 `qti-ext-gap-label-*`가 알려진 타입일 때만. 없거나 `none`이면 본문만
 * - 빈칸 순번은 붙이지 않는다. 쌍의 좌/우는 gap 식별자로 판별한다
 * - 레이블이 없고 본문에 수식빈칸이 있으면 GapMatchAnswerView가 그린다
 */
export function formatGapMatchCorrectAnswerForDisplay(
  qtiXml: string | null | undefined,
  responseIdentifier: string,
  value: unknown
): string | null {
  const choices = resolveGapMatchCorrectChoices(qtiXml, responseIdentifier, value);
  if (!choices) return null;
  return choices.map((choice) => choice.label || choice.text).join(", ");
}

export function formatCorrectAnswerValueForDisplay(
  responseIdentifier: string,
  value: unknown,
  maps: Map<string, Map<string, string>> | null,
  qtiXml?: string | null,
): string {
  const matchDisplay = formatMatchCorrectAnswerForDisplay(
    qtiXml ?? null,
    responseIdentifier,
    value,
  );
  if (matchDisplay !== null) {
    return matchDisplay;
  }

  const gapMatchDisplay = formatGapMatchCorrectAnswerForDisplay(
    qtiXml ?? null,
    responseIdentifier,
    value,
  );
  if (gapMatchDisplay !== null) {
    return gapMatchDisplay;
  }

  const idMap = maps?.get(responseIdentifier);

  const mapOne = (id: string): string => {
    if (!idMap || idMap.size === 0) return id;
    return idMap.get(id) ?? id;
  };

  // qti-order-interaction 정답은 순서를 나타내므로 하이픈으로 연결 (a-b-c)
  const separator = isOrderInteractionResponse(
    qtiXml ?? null,
    responseIdentifier,
  )
    ? " - "
    : ", ";

  if (typeof value === "string") {
    return mapOne(value);
  }
  if (Array.isArray(value)) {
    return value
      .map((v) => (typeof v === "string" ? mapOne(v) : String(v)))
      .join(separator);
  }
  if (value === null || value === undefined) {
    return "";
  }
  return String(value);
}
