import { type MathKey, type MathTab } from "./mathSymbols";

export const MIDDLE_SCHOOL_MATH_TABS = [
  "basic",
  "geometry",
  "algebra",
  "characters",
] as const satisfies readonly MathTab[];

const key = (
  partial: Omit<MathKey, "labelType"> & {
    labelType?: MathKey["labelType"];
  },
): MathKey => ({
  labelType: "latex",
  ...partial,
});

export const MIDDLE_SCHOOL_BASIC_KEYS: readonly MathKey[] = [
  key({
    id: "neq",
    tab: "basic",
    group: "연산",
    insert: "\\neq",
    label: "\\neq",
  }),
  key({
    id: "colon",
    tab: "basic",
    group: "연산",
    insert: "\\colon",
    label: "\\colon",
  }),
  key({
    id: "pm",
    tab: "basic",
    group: "연산",
    insert: "\\pm",
    label: "\\pm",
  }),
  key({
    id: "percent",
    tab: "basic",
    group: "연산",
    insert: "\\%",
    label: "\\%",
  }),
  key({
    id: "lt",
    tab: "basic",
    group: "연산",
    insert: "<",
    label: "<",
    labelType: "text",
  }),
  key({
    id: "leq",
    tab: "basic",
    group: "연산",
    insert: "\\leq",
    label: "\\leq",
  }),
  key({
    id: "gt",
    tab: "basic",
    group: "연산",
    insert: ">",
    label: ">",
    labelType: "text",
  }),
  key({
    id: "geq",
    tab: "basic",
    group: "연산",
    insert: "\\geq",
    label: "\\geq",
  }),
  key({
    id: "paren",
    tab: "basic",
    group: "괄호1",
    insert: "\\left(#?\\right)",
    label: "\\left(\\square\\right)",
  }),
  key({
    id: "brace",
    tab: "basic",
    group: "괄호1",
    insert: "\\left\\{#?\\right\\}",
    label: "\\left\\{\\square\\right\\}",
  }),
  key({
    id: "bracket",
    tab: "basic",
    group: "괄호1",
    insert: "\\left[#?\\right]",
    label: "\\left[\\square\\right]",
  }),
  key({
    id: "abs",
    tab: "basic",
    group: "괄호1",
    insert: "\\left|#?\\right|",
    label: "\\left|\\square\\right|",
  }),
  key({
    id: "dot",
    tab: "basic",
    group: "수 표현",
    insert: "\\dot{#?}",
    label: "\\dot{\\square}",
  }),
  key({
    id: "cdots",
    tab: "basic",
    group: "수 표현",
    insert: "\\cdots",
    label: "\\cdots",
  }),
  key({
    id: "sqrt",
    tab: "basic",
    group: "수 표현",
    insert: "\\sqrt{#?}",
    label: "\\sqrt{\\square}",
  }),
  key({
    id: "cases",
    tab: "basic",
    group: "연립",
    insert: "\\begin{cases}#?\\\\#?\\end{cases}",
    label: "\\begin{cases}\\square\\\\\\square\\end{cases}",
  }),
  key({
    id: "prime",
    tab: "basic",
    group: "수 표현",
    insert: "\\prime",
    label: "\\prime",
  }),
];

export const MIDDLE_SCHOOL_ALGEBRA_KEYS: readonly MathKey[] = [
  key({
    id: "sin",
    tab: "algebra",
    group: "삼각비",
    insert: "\\sin{#?}",
    label: "\\sin",
  }),
  key({
    id: "cos",
    tab: "algebra",
    group: "삼각비",
    insert: "\\cos{#?}",
    label: "\\cos",
  }),
  key({
    id: "tan",
    tab: "algebra",
    group: "삼각비",
    insert: "\\tan{#?}",
    label: "\\tan",
  }),
];

export const MIDDLE_SCHOOL_GEOMETRY_KEYS: readonly MathKey[] = [
  key({
    id: "segment",
    tab: "geometry",
    group: "선",
    insert: "\\overline{#?}",
    label: "\\overline{\\square}",
  }),
  key({
    id: "ray-right",
    tab: "geometry",
    group: "선",
    insert: "\\overrightarrow{#?}",
    label: "\\overrightarrow{\\square}",
  }),
  key({
    id: "ray-left",
    tab: "geometry",
    group: "선",
    insert: "\\overleftarrow{#?}",
    label: "\\overleftarrow{\\square}",
  }),
  key({
    id: "line",
    tab: "geometry",
    group: "선",
    insert: "\\overleftrightarrow{#?}",
    label: "\\overleftrightarrow{\\square}",
  }),
  key({
    id: "arc",
    tab: "geometry",
    group: "선",
    insert: "\\overset{\\huge\\frown}{#?}",
    label: "\\overset{\\frown}{\\square}",
  }),
  key({
    id: "equiv",
    tab: "geometry",
    group: "관계",
    insert: "\\equiv",
    label: "\\equiv",
  }),
  key({
    id: "sim",
    tab: "geometry",
    group: "관계",
    insert: "\\sim",
    label: "\\sim",
  }),
  key({
    id: "sslash",
    tab: "geometry",
    group: "관계",
    insert: "\\sslash",
    label: "\\sslash",
  }),
  key({
    id: "perp",
    tab: "geometry",
    group: "관계",
    insert: "\\perp",
    label: "\\perp",
  }),
  key({
    id: "triangle",
    tab: "geometry",
    group: "도형",
    insert: "\\triangle",
    label: "\\triangle",
  }),
  key({
    id: "square",
    tab: "geometry",
    group: "도형",
    insert: "\\Box",
    label: "\\Box",
  }),
  key({
    id: "angle",
    tab: "geometry",
    group: "각",
    insert: "\\angle",
    label: "\\angle",
  }),
  key({
    id: "geo-degree",
    tab: "geometry",
    group: "각",
    insert: "{#?}^{\\circ}",
    label: "\\square^{\\circ}",
  }),
];

export const MIDDLE_SCHOOL_GREEK_KEYS: readonly MathKey[] = [
  key({
    id: "greek-alpha",
    tab: "characters",
    group: "그리스",
    insert: "\\alpha",
    label: "\\alpha",
  }),
  key({
    id: "greek-beta",
    tab: "characters",
    group: "그리스",
    insert: "\\beta",
    label: "\\beta",
  }),
  key({
    id: "greek-gamma",
    tab: "characters",
    group: "그리스",
    insert: "\\gamma",
    label: "\\gamma",
  }),
  key({
    id: "greek-delta",
    tab: "characters",
    group: "그리스",
    insert: "\\delta",
    label: "\\delta",
  }),
  key({
    id: "greek-theta",
    tab: "characters",
    group: "그리스",
    insert: "\\theta",
    label: "\\theta",
  }),
  key({
    id: "greek-pi",
    tab: "characters",
    group: "그리스",
    insert: "\\pi",
    label: "\\pi",
  }),
  key({
    id: "greek-sigma",
    tab: "characters",
    group: "그리스",
    insert: "\\sigma",
    label: "\\sigma",
  }),
  key({
    id: "greek-omega",
    tab: "characters",
    group: "그리스",
    insert: "\\omega",
    label: "\\omega",
  }),
];

export const MIDDLE_SCHOOL_LETTERS = "abcdefghijklmnopqrstuvwxyz".split("");

export const MIDDLE_SCHOOL_MATH_KEYS: readonly MathKey[] = [
  ...MIDDLE_SCHOOL_BASIC_KEYS,
  ...MIDDLE_SCHOOL_ALGEBRA_KEYS,
  ...MIDDLE_SCHOOL_GEOMETRY_KEYS,
  ...MIDDLE_SCHOOL_GREEK_KEYS,
];

export const MIDDLE_SCHOOL_KEYS_BY_TAB: Record<
  "basic" | "algebra" | "geometry" | "characters",
  readonly MathKey[]
> = {
  basic: MIDDLE_SCHOOL_BASIC_KEYS,
  algebra: MIDDLE_SCHOOL_ALGEBRA_KEYS,
  geometry: MIDDLE_SCHOOL_GEOMETRY_KEYS,
  characters: MIDDLE_SCHOOL_GREEK_KEYS,
};

export interface MiddleSchoolPadKey {
  id: string;
  label: string;
  insert?: string;
  command?: string;
  labelLatex?: string;
  empty?: boolean;
}

export const MIDDLE_SCHOOL_PAD_KEYS: readonly MiddleSchoolPadKey[] = [
  { id: "left", label: "<", command: "moveToPreviousChar" },
  { id: "right", label: ">", command: "moveToNextChar" },
  { id: "spacer", label: "", empty: true },
  { id: "backspace", label: "⌫", command: "deleteBackward" },
  { id: "7", label: "7", insert: "7" },
  { id: "8", label: "8", insert: "8" },
  { id: "9", label: "9", insert: "9" },
  { id: "div", label: "÷", insert: "\\div" },
  { id: "4", label: "4", insert: "4" },
  { id: "5", label: "5", insert: "5" },
  { id: "6", label: "6", insert: "6" },
  { id: "times", label: "×", insert: "\\times" },
  { id: "1", label: "1", insert: "1" },
  { id: "2", label: "2", insert: "2" },
  { id: "3", label: "3", insert: "3" },
  { id: "minus", label: "−", insert: "-" },
  { id: "0", label: "0", insert: "0" },
  { id: "decimal", label: ".", insert: "." },
  { id: "comma", label: ",", insert: "," },
  { id: "plus", label: "+", insert: "+" },
  {
    id: "dfrac",
    label: "분수",
    labelLatex: "\\frac{\\square}{\\square}",
    insert: "\\dfrac{#?}{#?}",
  },
  {
    id: "sup",
    label: "위첨자",
    labelLatex: "\\square^{\\square}",
    insert: "{#?}^{#?}",
  },
  { id: "pi", label: "π", labelLatex: "\\pi", insert: "\\pi" },
  { id: "eq", label: "=", insert: "=" },
];
