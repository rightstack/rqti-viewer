/**
 * 중등 수식입력기 기호 세트.
 * QMS 기획안(2026.07) 학생용 UX(3쪽) + 중등 기호(5–7쪽).
 * 3개 탭(기본/대수/기하)만 포함한다. 수 표현(분수 등)은 기본 탭.
 * "고등" 표기 심볼·저작 전용은 제외.
 */

import { type MathKey, type MathTab } from "./mathSymbols";

/** 중등 노출 탭(3장). */
export const MIDDLE_SCHOOL_MATH_TABS = [
  "basic",
  "algebra",
  "geometry",
] as const satisfies readonly MathTab[];

const key = (
  partial: Omit<MathKey, "labelType"> & {
    labelType?: MathKey["labelType"];
  },
): MathKey => ({
  labelType: "latex",
  ...partial,
});

/** 1) 기본 — 연산·수 표현·괄호·연립 */
export const MIDDLE_SCHOOL_BASIC_KEYS: readonly MathKey[] = [
  key({
    id: "pm",
    tab: "basic",
    group: "연산",
    insert: "\\pm",
    label: "\\pm",
    command: "pm",
  }),
  key({
    id: "cdot",
    tab: "basic",
    group: "연산",
    insert: "\\cdot",
    label: "\\cdot",
    command: "cdot",
  }),
  key({
    id: "percent",
    tab: "basic",
    group: "연산",
    insert: "\\%",
    label: "\\%",
    command: "%",
  }),
  key({
    id: "eq",
    tab: "basic",
    group: "연산",
    insert: "=",
    label: "=",
    labelType: "text",
    command: "=",
  }),
  key({
    id: "neq",
    tab: "basic",
    group: "연산",
    insert: "\\neq",
    label: "\\neq",
    command: "neq",
  }),
  key({
    id: "lt",
    tab: "basic",
    group: "연산",
    insert: "<",
    label: "<",
    labelType: "text",
    command: "<",
  }),
  key({
    id: "leq",
    tab: "basic",
    group: "연산",
    insert: "\\leq",
    label: "\\leq",
    command: "leq",
  }),
  key({
    id: "gt",
    tab: "basic",
    group: "연산",
    insert: ">",
    label: ">",
    labelType: "text",
    command: ">",
  }),
  key({
    id: "geq",
    tab: "basic",
    group: "연산",
    insert: "\\geq",
    label: "\\geq",
    command: "geq",
  }),
  key({
    id: "dfrac",
    tab: "basic",
    group: "수 표현",
    insert: "\\dfrac{#?}{#?}",
    label: "\\dfrac{\\square}{\\square}",
    command: "dfrac",
  }),
  key({
    id: "dot",
    tab: "basic",
    group: "수 표현",
    insert: "\\dot{#?}",
    label: "\\dot{\\square}",
    command: "dot",
  }),
  key({
    id: "sup",
    tab: "basic",
    group: "수 표현",
    insert: "{#?}^{#?}",
    label: "\\square^{\\square}",
    command: "^",
  }),
  key({
    id: "sub",
    tab: "basic",
    group: "수 표현",
    insert: "{#?}_{#?}",
    label: "\\square_{\\square}",
    command: "_",
  }),
  key({
    id: "sqrt",
    tab: "basic",
    group: "수 표현",
    insert: "\\sqrt{#?}",
    label: "\\sqrt{\\square}",
    command: "sqrt",
  }),
  key({
    id: "paren",
    tab: "basic",
    group: "괄호1",
    insert: "\\left(#?\\right)",
    label: "\\left(\\square\\right)",
    command: "left",
  }),
  key({
    id: "abs",
    tab: "basic",
    group: "괄호1",
    insert: "\\left|#?\\right|",
    label: "\\left|\\square\\right|",
    command: "left",
  }),
  key({
    id: "brace",
    tab: "basic",
    group: "괄호1",
    insert: "\\left\\{#?\\right\\}",
    label: "\\left\\{\\square\\right\\}",
    command: "left",
  }),
  key({
    id: "bracket",
    tab: "basic",
    group: "괄호1",
    insert: "\\left[#?\\right]",
    label: "\\left[\\square\\right]",
    command: "left",
  }),
  // 괄호2 — 순서쌍/좌표 (□, □). 반개구간·폐구간은 고등이라 제외.
  key({
    id: "ordered-pair",
    tab: "basic",
    group: "괄호2",
    insert: "\\left(#?, #?\\right)",
    label: "\\left(\\square, \\square\\right)",
    command: "left",
  }),
  key({
    id: "cases",
    tab: "basic",
    group: "연립",
    insert: "\\begin{cases}#?\\\\#?\\end{cases}",
    label: "\\begin{cases}\\square\\\\\\square\\end{cases}",
    command: "cases",
  }),
];

/** 2) 대수 — 삼각비·π·degree. 고등(로그·시그마·극한 등)은 제외 */
export const MIDDLE_SCHOOL_ALGEBRA_KEYS: readonly MathKey[] = [
  key({
    id: "sin",
    tab: "algebra",
    group: "삼각비",
    insert: "\\sin{#?}",
    label: "\\sin",
    command: "sin",
  }),
  key({
    id: "cos",
    tab: "algebra",
    group: "삼각비",
    insert: "\\cos{#?}",
    label: "\\cos",
    command: "cos",
  }),
  key({
    id: "tan",
    tab: "algebra",
    group: "삼각비",
    insert: "\\tan{#?}",
    label: "\\tan",
    command: "tan",
  }),
  key({
    id: "pi",
    tab: "algebra",
    group: "기호",
    insert: "\\pi",
    label: "\\pi",
    command: "pi",
  }),
  key({
    id: "degree",
    tab: "algebra",
    group: "기호",
    insert: "{#?}^{\\circ}",
    label: "\\square^{\\circ}",
    command: "circ",
  }),
  key({
    id: "bracket-bound",
    tab: "algebra",
    group: "기호",
    insert: "\\left[#?\\right]_{#?}^{#?}",
    label: "\\left[\\square\\right]_{\\square}^{\\square}",
    command: "left",
  }),
];

/** 3) 기하 — 선·관계·도형·각. 벡터·집합·행렬은 제외 */
export const MIDDLE_SCHOOL_GEOMETRY_KEYS: readonly MathKey[] = [
  key({
    id: "segment",
    tab: "geometry",
    group: "선",
    insert: "\\overline{#?}",
    label: "\\overline{\\square}",
    command: "overline",
  }),
  key({
    id: "ray-right",
    tab: "geometry",
    group: "선",
    insert: "\\overrightarrow{#?}",
    label: "\\overrightarrow{\\square}",
    command: "overrightarrow",
  }),
  key({
    id: "ray-left",
    tab: "geometry",
    group: "선",
    insert: "\\overleftarrow{#?}",
    label: "\\overleftarrow{\\square}",
    command: "overleftarrow",
  }),
  key({
    id: "line",
    tab: "geometry",
    group: "선",
    insert: "\\overleftrightarrow{#?}",
    label: "\\overleftrightarrow{\\square}",
    command: "overleftrightarrow",
  }),
  key({
    id: "arc",
    tab: "geometry",
    group: "선",
    insert: "\\overset{\\huge\\frown}{#?}",
    label: "\\overset{\\frown}{\\square}",
    command: "overset",
  }),
  key({
    id: "equiv",
    tab: "geometry",
    group: "관계",
    insert: "\\equiv",
    label: "\\equiv",
    command: "equiv",
  }),
  key({
    id: "sim",
    tab: "geometry",
    group: "관계",
    insert: "\\sim",
    label: "\\sim",
    command: "sim",
  }),
  key({
    id: "sslash",
    tab: "geometry",
    group: "관계",
    insert: "\\sslash",
    label: "\\sslash",
    command: "sslash",
  }),
  key({
    id: "perp",
    tab: "geometry",
    group: "관계",
    insert: "\\perp",
    label: "\\perp",
    command: "perp",
  }),
  key({
    id: "triangle",
    tab: "geometry",
    group: "도형",
    insert: "\\triangle",
    label: "\\triangle",
    command: "triangle",
  }),
  key({
    id: "square",
    tab: "geometry",
    group: "도형",
    insert: "\\Box",
    label: "\\Box",
    command: "Box",
  }),
  key({
    id: "angle",
    tab: "geometry",
    group: "각",
    insert: "\\angle",
    label: "\\angle",
    command: "angle",
  }),
  key({
    id: "geo-degree",
    tab: "geometry",
    group: "각",
    insert: "{#?}^{\\circ}",
    label: "\\square^{\\circ}",
    command: "circ",
  }),
];

export const MIDDLE_SCHOOL_MATH_KEYS: readonly MathKey[] = [
  ...MIDDLE_SCHOOL_BASIC_KEYS,
  ...MIDDLE_SCHOOL_ALGEBRA_KEYS,
  ...MIDDLE_SCHOOL_GEOMETRY_KEYS,
];

export const MIDDLE_SCHOOL_KEYS_BY_TAB: Record<
  "basic" | "algebra" | "geometry",
  readonly MathKey[]
> = {
  basic: MIDDLE_SCHOOL_BASIC_KEYS,
  algebra: MIDDLE_SCHOOL_ALGEBRA_KEYS,
  geometry: MIDDLE_SCHOOL_GEOMETRY_KEYS,
};

export interface MiddleSchoolPadKey {
  id: string;
  insert?: string;
  action?: "backspace";
  label: string;
}

/** 우측 고정 패드 — 숫자·사칙·등호·백스페이스 */
export const MIDDLE_SCHOOL_PAD_KEYS: readonly MiddleSchoolPadKey[] = [
  { id: "7", insert: "7", label: "7" },
  { id: "8", insert: "8", label: "8" },
  { id: "9", insert: "9", label: "9" },
  { id: "plus", insert: "+", label: "+" },
  { id: "4", insert: "4", label: "4" },
  { id: "5", insert: "5", label: "5" },
  { id: "6", insert: "6", label: "6" },
  { id: "minus", insert: "-", label: "−" },
  { id: "1", insert: "1", label: "1" },
  { id: "2", insert: "2", label: "2" },
  { id: "3", insert: "3", label: "3" },
  { id: "times", insert: "\\times", label: "×" },
  { id: "0", insert: "0", label: "0" },
  { id: "dot", insert: ".", label: "." },
  { id: "eq", insert: "=", label: "=" },
  { id: "div", insert: "\\div", label: "÷" },
  { id: "backspace", action: "backspace", label: "⌫" },
];
