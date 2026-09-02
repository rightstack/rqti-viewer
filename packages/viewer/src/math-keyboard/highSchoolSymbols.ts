/**
 * 고등 수식입력기 기호 세트.
 * 중등 3개 탭(기본/대수/기하)에 고등 전용 2개 탭(집합·행렬, 통계)을 더한 5개 탭 구조.
 * - 기본: 중등 연산·수 표현·괄호 + n제곱근 + 구간(반개/폐구간)
 * - 대수: 삼각비(sec/csc/cot 포함)·로그·시그마·극한·미분·적분
 * - 기하: 선/관계/도형/각 + 벡터
 * - 집합·행렬: 집합(원소·부분집합·연산) + 행렬(pmatrix)
 * - 통계: 순열·조합(P/C/Π/H)·팩토리얼
 * 좌측 배치는 4열 줄바꿈 격자. 폭은 `mathLevels.ts`의 MATH_LEVEL_CONFIG에서 관리한다.
 */
import {
  takeKeys,
  type MathKey,
  type MathTab,
} from "./mathSymbols";
import {
  MIDDLE_SCHOOL_ALGEBRA_KEYS,
  MIDDLE_SCHOOL_BASIC_KEYS,
  MIDDLE_SCHOOL_GEOMETRY_KEYS,
} from "./middleSchoolSymbols";

const key = (
  partial: Omit<MathKey, "labelType"> & {
    labelType?: MathKey["labelType"];
  },
): MathKey => ({
  labelType: "latex",
  ...partial,
});

/** 1) 기본 — 중등 + n제곱근 + 구간(반개/폐구간) */
export const HIGH_SCHOOL_BASIC_KEYS: readonly MathKey[] = takeKeys(
  MIDDLE_SCHOOL_BASIC_KEYS,
  "pm",
  "cdot",
  "percent",
  "eq",
  "neq",
  "lt",
  "leq",
  "gt",
  "geq",
  "dfrac",
  "dot",
  "sup",
  "sub",
  "sqrt",
  key({
    id: "sqrt-n",
    tab: "basic",
    group: "수 표현",
    insert: "\\sqrt[#?]{#?}",
    label: "\\sqrt[\\square]{\\square}",
    command: "sqrt",
  }),
  "paren",
  "abs",
  "brace",
  "bracket",
  "ordered-pair",
  key({
    id: "interval-oc",
    tab: "basic",
    group: "괄호2",
    insert: "\\left(#?, #?\\right]",
    label: "\\left(\\square, \\square\\right]",
    command: "left",
  }),
  key({
    id: "interval-co",
    tab: "basic",
    group: "괄호2",
    insert: "\\left[#?, #?\\right)",
    label: "\\left[\\square, \\square\\right)",
    command: "left",
  }),
  key({
    id: "interval-cc",
    tab: "basic",
    group: "괄호2",
    insert: "\\left[#?, #?\\right]",
    label: "\\left[\\square, \\square\\right]",
    command: "left",
  }),
  "cases",
);

/** 2) 대수 — 중등 삼각비·기호 + 고등(sec/로그/시그마/극한/미분/적분) */
export const HIGH_SCHOOL_ALGEBRA_KEYS: readonly MathKey[] = takeKeys(
  MIDDLE_SCHOOL_ALGEBRA_KEYS,
  "sin",
  "cos",
  "tan",
  key({
    id: "sec",
    tab: "algebra",
    group: "삼각비",
    insert: "\\sec{#?}",
    label: "\\sec",
    command: "sec",
  }),
  key({
    id: "csc",
    tab: "algebra",
    group: "삼각비",
    insert: "\\csc{#?}",
    label: "\\csc",
    command: "csc",
  }),
  key({
    id: "cot",
    tab: "algebra",
    group: "삼각비",
    insert: "\\cot{#?}",
    label: "\\cot",
    command: "cot",
  }),
  key({
    id: "log",
    tab: "algebra",
    group: "로그",
    insert: "\\log{#?}",
    label: "\\log",
    command: "log",
  }),
  key({
    id: "log-base",
    tab: "algebra",
    group: "로그",
    insert: "\\log_{#?}{#?}",
    label: "\\log_{\\square}\\square",
    command: "log",
  }),
  key({
    id: "ln",
    tab: "algebra",
    group: "로그",
    insert: "\\ln{#?}",
    label: "\\ln",
    command: "ln",
  }),
  key({
    id: "sum",
    tab: "algebra",
    group: "시그마",
    insert: "\\sum",
    label: "\\sum",
    command: "sum",
  }),
  key({
    id: "sum-bound",
    tab: "algebra",
    group: "시그마",
    insert: "\\sum_{#?}^{#?}",
    label: "\\sum_{\\square}^{\\square}",
    command: "sum",
  }),
  key({
    id: "lim",
    tab: "algebra",
    group: "극한",
    insert: "\\lim",
    label: "\\lim",
    command: "lim",
  }),
  key({
    id: "lim-to",
    tab: "algebra",
    group: "극한",
    insert: "\\lim_{#?\\to#?}",
    label: "\\lim_{\\square\\to\\square}",
    command: "lim",
  }),
  key({
    id: "prime",
    tab: "algebra",
    group: "미분",
    insert: "{#?}^{\\prime}",
    label: "\\square^{\\prime}",
    command: "prime",
  }),
  key({
    id: "prime2",
    tab: "algebra",
    group: "미분",
    insert: "{#?}^{\\prime\\prime}",
    label: "\\square^{\\prime\\prime}",
    command: "prime",
  }),
  key({
    id: "dydx",
    tab: "algebra",
    group: "미분",
    insert: "\\dfrac{dy}{dx}",
    label: "\\dfrac{dy}{dx}",
    command: "dfrac",
  }),
  key({
    id: "delta",
    tab: "algebra",
    group: "미분",
    insert: "\\Delta",
    label: "\\Delta",
    command: "Delta",
  }),
  key({
    id: "int",
    tab: "algebra",
    group: "적분",
    insert: "\\int",
    label: "\\int",
    command: "int",
  }),
  key({
    id: "int-bound",
    tab: "algebra",
    group: "적분",
    insert: "\\int_{#?}^{#?}",
    label: "\\int_{\\square}^{\\square}",
    command: "int",
  }),
  "bracket-bound",
  "pi",
  "degree",
  key({
    id: "infty",
    tab: "algebra",
    group: "기호",
    insert: "\\infty",
    label: "\\infty",
    command: "infty",
  }),
);

/** 3) 기하 — 중등 선·관계·도형·각 + 벡터 */
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
    command: "vec",
  }),
  key({
    id: "vec-ab",
    tab: "geometry",
    group: "벡터",
    insert: "\\overrightarrow{#?#?}",
    label: "\\overrightarrow{\\square\\square}",
    command: "overrightarrow",
  }),
);

/** 4) 집합·행렬 — 집합(원소·부분집합·연산) + 행렬(pmatrix) */
export const HIGH_SCHOOL_SET_MATRIX_KEYS: readonly MathKey[] = [
  key({
    id: "set-vert",
    tab: "setMatrix",
    group: "집합",
    insert: "\\vert",
    label: "\\vert",
    command: "vert",
  }),
  key({
    id: "set-varnothing",
    tab: "setMatrix",
    group: "집합",
    insert: "\\varnothing",
    label: "\\varnothing",
    command: "varnothing",
  }),
  key({
    id: "set-in",
    tab: "setMatrix",
    group: "집합",
    insert: "\\in",
    label: "\\in",
    command: "in",
  }),
  key({
    id: "set-notin",
    tab: "setMatrix",
    group: "집합",
    insert: "\\notin",
    label: "\\notin",
    command: "notin",
  }),
  key({
    id: "set-subset",
    tab: "setMatrix",
    group: "집합",
    insert: "\\subset",
    label: "\\subset",
    command: "subset",
  }),
  key({
    id: "set-notsubset",
    tab: "setMatrix",
    group: "집합",
    insert: "\\not\\subset",
    label: "\\not\\subset",
    command: "not",
  }),
  key({
    id: "set-cap",
    tab: "setMatrix",
    group: "집합",
    insert: "\\cap",
    label: "\\cap",
    command: "cap",
  }),
  key({
    id: "set-cup",
    tab: "setMatrix",
    group: "집합",
    insert: "\\cup",
    label: "\\cup",
    command: "cup",
  }),
  key({
    id: "mat-2x2",
    tab: "setMatrix",
    group: "행렬",
    insert: "\\begin{pmatrix}#? & #?\\\\#? & #?\\end{pmatrix}",
    label:
      "\\begin{pmatrix}\\square & \\square\\\\\\square & \\square\\end{pmatrix}",
    command: "begin",
    cols: 2,
  }),
  key({
    id: "mat-1x2",
    tab: "setMatrix",
    group: "행렬",
    insert: "\\begin{pmatrix}#? & #?\\end{pmatrix}",
    label: "\\begin{pmatrix}\\square & \\square\\end{pmatrix}",
    command: "begin",
    cols: 2,
  }),
  key({
    id: "mat-1x3",
    tab: "setMatrix",
    group: "행렬",
    insert: "\\begin{pmatrix}#? & #? & #?\\end{pmatrix}",
    label: "\\begin{pmatrix}\\square & \\square & \\square\\end{pmatrix}",
    command: "begin",
    cols: 2,
  }),
  key({
    id: "mat-2x3",
    tab: "setMatrix",
    group: "행렬",
    insert: "\\begin{pmatrix}#? & #? & #?\\\\#? & #? & #?\\end{pmatrix}",
    label:
      "\\begin{pmatrix}\\square & \\square & \\square\\\\\\square & \\square & \\square\\end{pmatrix}",
    command: "begin",
    cols: 2,
  }),
  key({
    id: "mat-3x3",
    tab: "setMatrix",
    group: "행렬",
    insert:
      "\\begin{pmatrix}#? & #? & #?\\\\#? & #? & #?\\\\#? & #? & #?\\end{pmatrix}",
    label:
      "\\begin{pmatrix}\\square & \\square & \\square\\\\\\square & \\square & \\square\\\\\\square & \\square & \\square\\end{pmatrix}",
    command: "begin",
    cols: 2,
  }),
];

/** 5) 통계 — 순열·조합·중복순열/조합·팩토리얼 */
export const HIGH_SCHOOL_STATISTICS_KEYS: readonly MathKey[] = [
  key({
    id: "nPr",
    tab: "statistics",
    group: "순열·조합",
    insert: "{#?}\\mathrm{P}_{#?}",
    label: "\\square\\mathrm{P}_{\\square}",
    command: "mathrm",
  }),
  key({
    id: "nCr",
    tab: "statistics",
    group: "순열·조합",
    insert: "{#?}\\mathrm{C}_{#?}",
    label: "\\square\\mathrm{C}_{\\square}",
    command: "mathrm",
  }),
  key({
    id: "nPir",
    tab: "statistics",
    group: "순열·조합",
    insert: "{#?}\\Pi_{#?}",
    label: "\\square\\Pi_{\\square}",
    command: "Pi",
  }),
  key({
    id: "nHr",
    tab: "statistics",
    group: "순열·조합",
    insert: "{#?}\\mathrm{H}_{#?}",
    label: "\\square\\mathrm{H}_{\\square}",
    command: "mathrm",
  }),
  key({
    id: "factorial",
    tab: "statistics",
    group: "순열·조합",
    insert: "!",
    label: "!",
    labelType: "text",
    command: "!",
  }),
];

export const HIGH_SCHOOL_MATH_KEYS: readonly MathKey[] = [
  ...HIGH_SCHOOL_BASIC_KEYS,
  ...HIGH_SCHOOL_ALGEBRA_KEYS,
  ...HIGH_SCHOOL_GEOMETRY_KEYS,
  ...HIGH_SCHOOL_SET_MATRIX_KEYS,
  ...HIGH_SCHOOL_STATISTICS_KEYS,
];

/** 고등 노출 탭(5장). */
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
  setMatrix: HIGH_SCHOOL_SET_MATRIX_KEYS,
  statistics: HIGH_SCHOOL_STATISTICS_KEYS,
};
