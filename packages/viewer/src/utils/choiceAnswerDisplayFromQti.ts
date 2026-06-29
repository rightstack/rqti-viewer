/**
 * 복습 정답 표시용: identifier → 표시 문자열
 *
 * - qti-choice-interaction: label 속성이 있으면 그 값만; 없으면 interaction·부모 qti-ext-grid의
 *   qti-list-style-type-* 로 목록 마커(① 등); 그것도 없으면 본문 → identifier
 * - qti-inline-choice-interaction: label → 본문 → 미디어 → identifier (단일 문자열, 기존과 동일)
 * - qti-match-interaction 정답만: 쌍이 ROW_n / COL_m 형태면 `n-m` 또는 MatchAnswerView용 배열 (qtiXml으로 interaction 판별)
 * - FeedbackInline 정답 나열 순서: extractInteractionResponseIdentifiersInDocumentOrder 로 본문 interaction 순서 확보
 *
 * @see qti-ext.css @counter-style (circled_number, hangul-* …)
 */
import { parsePairs } from "../interactions/match/utils";
import { extractListStyleType } from "../parser/listGrouping";
import type { MatchingPairType, MediaContentType } from "../types";
import { extractMediaFromElement } from "./extractMediaFromElement";
import { removeMediaFromElementClone } from "./extractTextFromElement";
import { wrapMathFieldTextForInlineLatex } from "./wrapMathFieldTextForInlineLatex";

/** qti-ext.css @counter-style circled_number 과 동일 */
const CIRCLED_MARKERS = ["① ", "② ", "③ ", "④ ", "⑤ ", "⑥ ", "⑦ ", "⑧ ", "⑨ ", "⑩ "] as const;

/** qti-ext.css @counter-style hangul-consonant */
const HANGUL_CONSONANT_MARKERS = [
  "ㄱ. ",
  "ㄴ. ",
  "ㄷ. ",
  "ㄹ. ",
  "ㅁ. ",
  "ㅂ. ",
  "ㅅ. ",
  "ㅇ. ",
  "ㅈ. ",
  "ㅊ. ",
  "ㅋ. ",
  "ㅌ. ",
  "ㅍ. ",
  "ㅎ. ",
] as const;

/** hangul-consonant-paren */
const HANGUL_CONSONANT_PAREN_MARKERS = [
  "ㄱ) ",
  "ㄴ) ",
  "ㄷ) ",
  "ㄹ) ",
  "ㅁ) ",
  "ㅂ) ",
  "ㅅ) ",
  "ㅇ) ",
  "ㅈ) ",
  "ㅊ) ",
  "ㅋ) ",
  "ㅌ) ",
  "ㅍ) ",
  "ㅎ) ",
] as const;

/** hangul-consonant-bracket */
const HANGUL_CONSONANT_BRACKET_MARKERS = [
  "(ㄱ) ",
  "(ㄴ) ",
  "(ㄷ) ",
  "(ㄹ) ",
  "(ㅁ) ",
  "(ㅂ) ",
  "(ㅅ) ",
  "(ㅇ) ",
  "(ㅈ) ",
  "(ㅊ) ",
  "(ㅋ) ",
  "(ㅌ) ",
  "(ㅍ) ",
  "(ㅎ) ",
] as const;

/** hangul-syllable-dot (class qti-list-style-type-hangul-syllable) */
const HANGUL_SYLLABLE_MARKERS = [
  "가. ",
  "나. ",
  "다. ",
  "라. ",
  "마. ",
  "바. ",
  "사. ",
  "아. ",
  "자. ",
  "차. ",
  "카. ",
  "타. ",
  "파. ",
  "하. ",
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
 * choice interaction DOM 순서(1-based)에 해당하는 목록 마커.
 * 알 수 없는 타입·범위 초과면 null → 호출부에서 일반 표시 로직으로 폴백.
 */
function listStyleMarkerForIndex(listStyleType: string, oneBasedIndex: number): string | null {
  if (oneBasedIndex < 1) return null;
  const i = oneBasedIndex;

  switch (listStyleType) {
    case "decimal":
      return `${i}. `;
    case "decimal-leading-zero":
      return `${i < 10 ? `0${i}` : String(i)}. `;
    case "lower-alpha":
      return `${toSequenceAlpha(i, 97)}. `;
    case "upper-alpha":
      return `${toSequenceAlpha(i, 65)}. `;
    case "lower-roman":
      return `${toRomanNumeral(i).toLowerCase()}. `;
    case "upper-roman":
      return `${toRomanNumeral(i)}. `;
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
  const bodyText = serializeChoiceBodyChildNodes(Array.from(clone.childNodes)).trim();
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
  return classTokens(classAttr).some((t) => t === "qti-ext-grid" || /^qti-ext-grid-\d+$/.test(t));
}

/**
 * choice-interaction 자신의 class 또는 (grid일 때) 조상 qti-ext-grid의 class에서 list-style 추출
 */
function listStyleTypeForChoiceInteraction(interaction: Element): string | null {
  const fromEl = (el: Element) => extractListStyleType(el.getAttribute("class") ?? "");

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
  oneBasedIndex: number
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
function choiceDisplayStringForElement(el: Element, identifier: string): string {
  const label = el.getAttribute("label")?.trim();
  if (label && label !== "") return label;

  const body = bodyDisplayFromChoiceElement(el);
  if (body !== "") return body;

  return identifier;
}

export function buildChoiceIdentifierDisplayMapsFromQtiXml(
  qtiXml: string
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
      choiceMap.set(id, choiceDisplayForBlockChoiceInteraction(el, id, listStyleType, idx + 1));
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
    const listStyleType = extractListStyleType(interaction.getAttribute("class") ?? "");

    interaction.querySelectorAll("qti-inline-choice").forEach((el, idx) => {
      const id = el.getAttribute("identifier")?.trim() ?? "";
      if (!id) return;
      let display: string;
      if (listStyleType) {
        const marker = listStyleMarkerForIndex(listStyleType, idx + 1);
        display = marker !== null ? marker.trim() : choiceDisplayStringForElement(el, id);
      } else {
        display = choiceDisplayStringForElement(el, id);
      }
      choiceMap.set(id, display);
    });
  };

  doc.querySelectorAll("qti-choice-interaction").forEach((el) => {
    addBlockChoices(el);
  });
  doc.querySelectorAll("qti-inline-choice-interaction").forEach((el) => {
    addInlineChoices(el);
  });

  return result;
}

/** 쉼표 선택자로 문서 순서 유지 (다중 TFQ·빈칸·인라인 선택·매칭 혼합) */
const INTERACTION_ORDER_SELECTOR =
  "qti-choice-interaction, qti-inline-choice-interaction, qti-text-entry-interaction, qti-match-interaction";

/**
 * 복습 정답 표시 순서용: 위 interaction들의 response-identifier를 XML 트리 순으로 수집.
 * 중복 id는 첫 occurrence만. 파싱 실패·빈 XML이면 null.
 */
export function extractInteractionResponseIdentifiersInDocumentOrder(
  qtiXml: string | null | undefined
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
  identifier: string
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
function buildFractionLatexFromParts(w: string, n: string, d: string): string | null {
  if (!n || !d) return null;
  const frac = `\\frac{${n}}{${d}}`;
  if (w) return `${w}${frac}`;
  return frac;
}

export type CorrectAnswerFeedbackSegment =
  | { kind: "fractionLatex"; latex: string; key: string }
  | { kind: "default"; key: string; value: unknown };

/**
 * 복습 정답 줄: `FRACTION_*_{N|D|W}` 는 베이스별로 묶어 한 덩어리 LaTeX로 표시.
 * 문서 순서는 `extractInteractionResponseIdentifiersInDocumentOrder`와 동일하며,
 * 그룹은 해당 베이스 파트 중 XML에서 가장 먼저 나오는 식별자 위치에 한 번만 출력.
 * n/d 불완전 시 기존처럼 키별 `default` 세그먼트로 폴백.
 */
export function buildCorrectAnswerFeedbackSegments(
  correctAnswer: Record<string, unknown>,
  qtiXml: string | null | undefined
): CorrectAnswerFeedbackSegment[] {
  const entries = Object.entries(correctAnswer);
  const order = extractInteractionResponseIdentifiersInDocumentOrder(qtiXml);

  const orderedIds: string[] = [];
  const used = new Set<string>();
  if (order && order.length > 0) {
    for (const id of order) {
      if (!Object.prototype.hasOwnProperty.call(correctAnswer, id)) continue;
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
    if (!Object.prototype.hasOwnProperty.call(correctAnswer, rid)) continue;
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
  responseIdentifier?: string | null
): { rows: string[]; cols: string[] } | null {
  if (!qtiXml?.trim()) return null;
  const doc = new DOMParser().parseFromString(qtiXml, "text/xml");
  if (doc.querySelector("parsererror")) return null;

  const rid = responseIdentifier?.trim();
  let interaction: Element | null = null;
  if (rid) {
    interaction =
      Array.from(doc.querySelectorAll("qti-match-interaction")).find(
        (el) => el.getAttribute("response-identifier")?.trim() === rid
      ) ?? null;
  } else {
    interaction = doc.querySelector("qti-match-interaction");
  }

  if (!interaction) return null;

  const directSets = Array.from(interaction.querySelectorAll(":scope > qti-simple-match-set"));
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
  responseIdentifier: string
): Element | null {
  if (!qtiXml?.trim()) return null;
  const rid = responseIdentifier.trim();
  if (!rid) return null;
  const doc = new DOMParser().parseFromString(qtiXml, "text/xml");
  if (doc.querySelector("parsererror")) return null;
  return (
    Array.from(doc.querySelectorAll("qti-match-interaction")).find(
      (el) => el.getAttribute("response-identifier")?.trim() === rid
    ) ?? null
  );
}

/** 해당 응답이 문항 XML 안의 qti-match-interaction 인지 */
export function isMatchInteractionResponse(
  qtiXml: string | null | undefined,
  responseIdentifier: string
): boolean {
  const rid = responseIdentifier.trim();
  if (!rid || !qtiXml?.trim()) return false;
  const doc = new DOMParser().parseFromString(qtiXml, "text/xml");
  if (doc.querySelector("parsererror")) return false;
  return Array.from(doc.querySelectorAll("qti-match-interaction")).some(
    (el) => el.getAttribute("response-identifier")?.trim() === rid
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
  value: unknown
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
  value: unknown
): string | null {
  const strings = getMatchCorrectResponseStrings(qtiXml, responseIdentifier, value);
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

export function formatCorrectAnswerValueForDisplay(
  responseIdentifier: string,
  value: unknown,
  maps: Map<string, Map<string, string>> | null,
  qtiXml?: string | null
): string {
  const matchDisplay = formatMatchCorrectAnswerForDisplay(
    qtiXml ?? null,
    responseIdentifier,
    value
  );
  if (matchDisplay !== null) {
    return matchDisplay;
  }

  const idMap = maps?.get(responseIdentifier);

  const mapOne = (id: string): string => {
    if (!idMap || idMap.size === 0) return id;
    return idMap.get(id) ?? id;
  };

  if (typeof value === "string") {
    return mapOne(value);
  }
  if (Array.isArray(value)) {
    return value.map((v) => (typeof v === "string" ? mapOne(v) : String(v))).join(", ");
  }
  if (value === null || value === undefined) {
    return "";
  }
  return String(value);
}
