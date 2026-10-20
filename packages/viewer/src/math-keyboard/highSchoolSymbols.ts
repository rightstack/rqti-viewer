import { type MathKey, type MathTab, takeKeys } from "./mathSymbols";
import {
  MIDDLE_SCHOOL_ALGEBRA_KEYS,
  MIDDLE_SCHOOL_BASIC_KEYS,
  MIDDLE_SCHOOL_GEOMETRY_KEYS,
} from "./middleSchoolSymbols";

const key = (
  partial: Omit<MathKey, "labelType"> & {
    labelType?: MathKey["labelType"];
  }
): MathKey => ({
  labelType: "latex",
  ...partial,
});

const HIGH_SCHOOL_ONLY_FROM_MIDDLE = {
  cdot: key({
    id: "cdot",
    tab: "basic",
    group: "연산",
    insert: "\\cdot",
    label: "\\cdot",
  }),
  eq: key({
    id: "eq",
    tab: "basic",
    group: "연산",
    insert: "=",
    label: "=",
    labelType: "text",
  }),
  dfrac: key({
    id: "dfrac",
    tab: "basic",
    group: "수 표현",
    insert: "\\frac{#?}{#?}",
    label: "\\frac{\\square}{\\square}",
  }),
  sup: key({
    id: "sup",
    tab: "basic",
    group: "수 표현",
    insert: "{#?}^{#?}",
    label: "\\square^{\\square}",
  }),
  sub: key({
    id: "sub",
    tab: "basic",
    group: "수 표현",
    insert: "{#?}_{#?}",
    label: "\\square_{\\square}",
  }),
  orderedPair: key({
    id: "ordered-pair",
    tab: "basic",
    group: "괄호2",
    insert: "\\left(#?, #?\\right)",
    label: "\\left(\\square, \\square\\right)",
  }),
  bracketBound: key({
    id: "bracket-bound",
    tab: "algebra",
    group: "기호",
    insert: "\\left[#?\\right]_{#?}^{#?}",
    label: "\\left[\\square\\right]_{\\square}^{\\square}",
  }),
  pi: key({
    id: "pi",
    tab: "algebra",
    group: "기호",
    insert: "\\pi",
    label: "\\pi",
  }),
  degree: key({
    id: "degree",
    tab: "algebra",
    group: "기호",
    insert: "{#?}^{\\circ}",
    label: "\\square^{\\circ}",
  }),
};

export const HIGH_SCHOOL_BASIC_KEYS: readonly MathKey[] = takeKeys(
  MIDDLE_SCHOOL_BASIC_KEYS,
  "pm",
  HIGH_SCHOOL_ONLY_FROM_MIDDLE.cdot,
  "percent",
  HIGH_SCHOOL_ONLY_FROM_MIDDLE.eq,
  "neq",
  "lt",
  "leq",
  "gt",
  "geq",
  HIGH_SCHOOL_ONLY_FROM_MIDDLE.dfrac,
  "dot",
  HIGH_SCHOOL_ONLY_FROM_MIDDLE.sup,
  HIGH_SCHOOL_ONLY_FROM_MIDDLE.sub,
  "sqrt",
  key({
    id: "sqrt-n",
    tab: "basic",
    group: "수 표현",
    insert: "\\sqrt[#?]{#?}",
    label: "\\sqrt[\\square]{\\square}",
  }),
  "paren",
  "abs",
  "brace",
  "bracket",
  HIGH_SCHOOL_ONLY_FROM_MIDDLE.orderedPair,
  key({
    id: "interval-oc",
    tab: "basic",
    group: "괄호2",
    insert: "\\left(#?, #?\\right]",
    label: "\\left(\\square, \\square\\right]",
  }),
  key({
    id: "interval-co",
    tab: "basic",
    group: "괄호2",
    insert: "\\left[#?, #?\\right)",
    label: "\\left[\\square, \\square\\right)",
  }),
  key({
    id: "interval-cc",
    tab: "basic",
    group: "괄호2",
    insert: "\\left[#?, #?\\right]",
    label: "\\left[\\square, \\square\\right]",
  }),
  "cases"
);

export const HIGH_SCHOOL_ALGEBRA_KEYS: readonly MathKey[] = takeKeys(
  MIDDLE_SCHOOL_ALGEBRA_KEYS,
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
  key({
    id: "sec",
    tab: "algebra",
    group: "삼각비",
    insert: "\\sec{#?}",
    label: "\\sec",
  }),
  key({
    id: "csc",
    tab: "algebra",
    group: "삼각비",
    insert: "\\csc{#?}",
    label: "\\csc",
  }),
  key({
    id: "cot",
    tab: "algebra",
    group: "삼각비",
    insert: "\\cot{#?}",
    label: "\\cot",
  }),
  key({
    id: "log",
    tab: "algebra",
    group: "로그",
    insert: "\\log{#?}",
    label: "\\log",
  }),
  key({
    id: "log-base",
    tab: "algebra",
    group: "로그",
    insert: "\\log_{#?}{#?}",
    label: "\\log_{\\square}\\square",
  }),
  key({
    id: "ln",
    tab: "algebra",
    group: "로그",
    insert: "\\ln{#?}",
    label: "\\ln",
  }),
  key({
    id: "sum",
    tab: "algebra",
    group: "시그마",
    insert: "\\sum",
    label: "\\sum",
  }),
  key({
    id: "sum-bound",
    tab: "algebra",
    group: "시그마",
    insert: "\\sum_{#?}^{#?}",
    label: "\\sum_{\\square}^{\\square}",
  }),
  key({
    id: "lim",
    tab: "algebra",
    group: "극한",
    insert: "\\lim",
    label: "\\lim",
  }),
  key({
    id: "lim-to",
    tab: "algebra",
    group: "극한",
    insert: "\\lim_{#?\\to#?}",
    label: "\\lim_{\\square\\to\\square}",
  }),
  key({
    id: "prime",
    tab: "algebra",
    group: "미분",
    insert: "{#?}^{\\prime}",
    label: "\\square^{\\prime}",
  }),
  key({
    id: "prime2",
    tab: "algebra",
    group: "미분",
    insert: "{#?}^{\\prime\\prime}",
    label: "\\square^{\\prime\\prime}",
  }),
  key({
    id: "dydx",
    tab: "algebra",
    group: "미분",
    insert: "\\dfrac{dy}{dx}",
    label: "\\dfrac{dy}{dx}",
  }),
  key({
    id: "delta",
    tab: "algebra",
    group: "미분",
    insert: "\\Delta",
    label: "\\Delta",
  }),
  key({
    id: "int",
    tab: "algebra",
    group: "적분",
    insert: "\\int",
    label: "\\int",
  }),
  key({
    id: "int-bound",
    tab: "algebra",
    group: "적분",
    insert: "\\int_{#?}^{#?}",
    label: "\\int_{\\square}^{\\square}",
  }),
  HIGH_SCHOOL_ONLY_FROM_MIDDLE.bracketBound,
  HIGH_SCHOOL_ONLY_FROM_MIDDLE.pi,
  HIGH_SCHOOL_ONLY_FROM_MIDDLE.degree,
  key({
    id: "infty",
    tab: "algebra",
    group: "기호",
    insert: "\\infty",
    label: "\\infty",
  })
);

export const HIGH_SCHOOL_GEOMETRY_KEYS: readonly MathKey[] = takeKeys(
  MIDDLE_SCHOOL_GEOMETRY_KEYS,
  "segment",
  "ray-right",
  "ray-left",
  "line",
  "arc",
  "equiv",
  "sim",
  "sslash",
  "perp",
  "triangle",
  "square",
  "angle",
  "geo-degree",
  key({
    id: "vec",
    tab: "geometry",
    group: "벡터",
    insert: "\\vec{#?}",
    label: "\\vec{\\square}",
  }),
  key({
    id: "vec-ab",
    tab: "geometry",
    group: "벡터",
    insert: "\\overrightarrow{#?#?}",
    label: "\\overrightarrow{\\square\\square}",
  })
);

export const HIGH_SCHOOL_SET_MATRIX_KEYS: readonly MathKey[] = [
  key({
    id: "set-vert",
    tab: "setMatrix",
    group: "집합",
    insert: "\\vert",
    label: "\\vert",
  }),
  key({
    id: "set-varnothing",
    tab: "setMatrix",
    group: "집합",
    insert: "\\varnothing",
    label: "\\varnothing",
  }),
  key({
    id: "set-in",
    tab: "setMatrix",
    group: "집합",
    insert: "\\in",
    label: "\\in",
  }),
  key({
    id: "set-notin",
    tab: "setMatrix",
    group: "집합",
    insert: "\\notin",
    label: "\\notin",
  }),
  key({
    id: "set-subset",
    tab: "setMatrix",
    group: "집합",
    insert: "\\subset",
    label: "\\subset",
  }),
  key({
    id: "set-notsubset",
    tab: "setMatrix",
    group: "집합",
    insert: "\\not\\subset",
    label: "\\not\\subset",
  }),
  key({
    id: "set-cap",
    tab: "setMatrix",
    group: "집합",
    insert: "\\cap",
    label: "\\cap",
  }),
  key({
    id: "set-cup",
    tab: "setMatrix",
    group: "집합",
    insert: "\\cup",
    label: "\\cup",
  }),
  key({
    id: "mat-2x2",
    tab: "setMatrix",
    group: "행렬",
    insert: "\\begin{pmatrix}#? & #?\\\\#? & #?\\end{pmatrix}",
    label: "\\begin{pmatrix}\\square & \\square\\\\\\square & \\square\\end{pmatrix}",
    cols: 2,
  }),
  key({
    id: "mat-1x2",
    tab: "setMatrix",
    group: "행렬",
    insert: "\\begin{pmatrix}#? & #?\\end{pmatrix}",
    label: "\\begin{pmatrix}\\square & \\square\\end{pmatrix}",
    cols: 2,
  }),
  key({
    id: "mat-1x3",
    tab: "setMatrix",
    group: "행렬",
    insert: "\\begin{pmatrix}#? & #? & #?\\end{pmatrix}",
    label: "\\begin{pmatrix}\\square & \\square & \\square\\end{pmatrix}",
    cols: 2,
  }),
  key({
    id: "mat-2x3",
    tab: "setMatrix",
    group: "행렬",
    insert: "\\begin{pmatrix}#? & #? & #?\\\\#? & #? & #?\\end{pmatrix}",
    label:
      "\\begin{pmatrix}\\square & \\square & \\square\\\\\\square & \\square & \\square\\end{pmatrix}",
    cols: 2,
  }),
  key({
    id: "mat-3x3",
    tab: "setMatrix",
    group: "행렬",
    insert: "\\begin{pmatrix}#? & #? & #?\\\\#? & #? & #?\\\\#? & #? & #?\\end{pmatrix}",
    label:
      "\\begin{pmatrix}\\square & \\square & \\square\\\\\\square & \\square & \\square\\\\\\square & \\square & \\square\\end{pmatrix}",
    cols: 2,
  }),
];

export const HIGH_SCHOOL_STATISTICS_KEYS: readonly MathKey[] = [
  key({
    id: "nPr",
    tab: "statistics",
    group: "순열·조합",
    insert: "{#?}\\mathrm{P}_{#?}",
    label: "\\square\\mathrm{P}_{\\square}",
  }),
  key({
    id: "nCr",
    tab: "statistics",
    group: "순열·조합",
    insert: "{#?}\\mathrm{C}_{#?}",
    label: "\\square\\mathrm{C}_{\\square}",
  }),
  key({
    id: "nPir",
    tab: "statistics",
    group: "순열·조합",
    insert: "{#?}\\Pi_{#?}",
    label: "\\square\\Pi_{\\square}",
  }),
  key({
    id: "nHr",
    tab: "statistics",
    group: "순열·조합",
    insert: "{#?}\\mathrm{H}_{#?}",
    label: "\\square\\mathrm{H}_{\\square}",
  }),
  key({
    id: "factorial",
    tab: "statistics",
    group: "순열·조합",
    insert: "!",
    label: "!",
    labelType: "text",
  }),
];

export const HIGH_SCHOOL_MATH_KEYS: readonly MathKey[] = [
  ...HIGH_SCHOOL_BASIC_KEYS,
  ...HIGH_SCHOOL_ALGEBRA_KEYS,
  ...HIGH_SCHOOL_GEOMETRY_KEYS,
  ...HIGH_SCHOOL_SET_MATRIX_KEYS,
  ...HIGH_SCHOOL_STATISTICS_KEYS,
];

export const HIGH_SCHOOL_MATH_TABS = [
  "basic",
  "algebra",
  "geometry",
  "setMatrix",
  "statistics",
] as const satisfies readonly MathTab[];

export const HIGH_SCHOOL_KEYS_BY_TAB: Record<MathTab, readonly MathKey[]> = {
  basic: HIGH_SCHOOL_BASIC_KEYS,
  algebra: HIGH_SCHOOL_ALGEBRA_KEYS,
  geometry: HIGH_SCHOOL_GEOMETRY_KEYS,
  characters: [],
  setMatrix: HIGH_SCHOOL_SET_MATRIX_KEYS,
  statistics: HIGH_SCHOOL_STATISTICS_KEYS,
};
