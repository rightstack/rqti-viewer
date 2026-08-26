/**
 * 고등 수식입력기 기호 세트.
 * 중등 3개 탭(기본/대수/기하)에 고등 전용 2개 탭(집합·행렬, 통계)을 더한 5개 탭 구조.
 * - 기본: 중등 연산·수 표현·괄호 + n제곱근 + 구간(반개/폐구간)
 * - 대수: 삼각비(sec/csc/cot 포함)·로그·시그마·극한·미분·적분
 * - 기하: 선/관계/도형/각 + 벡터
 * - 집합·행렬: 집합(원소·부분집합·연산) + 행렬(pmatrix)
 * - 통계: 순열·조합(P/C/Π/H)·팩토리얼
 * 배치 규칙(그룹 최대 행 수·폭)은 `mathLevels.ts`의 MATH_LEVEL_CONFIG.high에서 관리한다.
 */
import type { MathKey, MathTab } from "./mathSymbols";

const key = (
  partial: Omit<MathKey, "labelType"> & {
    labelType?: MathKey["labelType"];
  },
): MathKey => ({
  labelType: "latex",
  ...partial,
});

/** 1) 기본 — 연산·수 표현·괄호·구간·연립 */
export const HIGH_SCHOOL_BASIC_KEYS: readonly MathKey[] = [
  key({ id: "pm", tab: "basic", group: "연산", insert: "\\pm", label: "\\pm", command: "pm" }),
  key({ id: "cdot", tab: "basic", group: "연산", insert: "\\cdot", label: "\\cdot", command: "cdot" }),
  key({ id: "percent", tab: "basic", group: "연산", insert: "\\%", label: "\\%", command: "%" }),
  key({ id: "eq", tab: "basic", group: "연산", insert: "=", label: "=", labelType: "text", command: "=" }),
  key({ id: "neq", tab: "basic", group: "연산", insert: "\\neq", label: "\\neq", command: "neq" }),
  key({ id: "lt", tab: "basic", group: "연산", insert: "<", label: "<", labelType: "text", command: "<" }),
  key({ id: "leq", tab: "basic", group: "연산", insert: "\\leq", label: "\\leq", command: "leq" }),
  key({ id: "gt", tab: "basic", group: "연산", insert: ">", label: ">", labelType: "text", command: ">" }),
  key({ id: "geq", tab: "basic", group: "연산", insert: "\\geq", label: "\\geq", command: "geq" }),
  key({ id: "dfrac", tab: "basic", group: "수 표현", insert: "\\dfrac{#?}{#?}", label: "\\dfrac{\\square}{\\square}", command: "dfrac" }),
  key({ id: "dot", tab: "basic", group: "수 표현", insert: "\\dot{#?}", label: "\\dot{\\square}", command: "dot" }),
  key({ id: "sup", tab: "basic", group: "수 표현", insert: "{#?}^{#?}", label: "\\square^{\\square}", command: "^" }),
  key({ id: "sub", tab: "basic", group: "수 표현", insert: "{#?}_{#?}", label: "\\square_{\\square}", command: "_" }),
  key({ id: "sqrt", tab: "basic", group: "수 표현", insert: "\\sqrt{#?}", label: "\\sqrt{\\square}", command: "sqrt" }),
  key({ id: "sqrt-n", tab: "basic", group: "수 표현", insert: "\\sqrt[#?]{#?}", label: "\\sqrt[\\square]{\\square}", command: "sqrt" }),
  key({ id: "paren", tab: "basic", group: "괄호1", insert: "\\left(#?\\right)", label: "\\left(\\square\\right)", command: "left" }),
  key({ id: "abs", tab: "basic", group: "괄호1", insert: "\\left|#?\\right|", label: "\\left|\\square\\right|", command: "left" }),
  key({ id: "brace", tab: "basic", group: "괄호1", insert: "\\left\\{#?\\right\\}", label: "\\left\\{\\square\\right\\}", command: "left" }),
  key({ id: "bracket", tab: "basic", group: "괄호1", insert: "\\left[#?\\right]", label: "\\left[\\square\\right]", command: "left" }),
  // 괄호2 — 순서쌍/좌표 + 구간(반개구간·폐구간)
  key({ id: "ordered-pair", tab: "basic", group: "괄호2", insert: "\\left(#?, #?\\right)", label: "\\left(\\square, \\square\\right)", command: "left" }),
  key({ id: "interval-oo", tab: "basic", group: "괄호2", insert: "\\left(#?, #?\\right)", label: "\\left(\\square, \\square\\right)", command: "left" }),
  key({ id: "interval-oc", tab: "basic", group: "괄호2", insert: "\\left(#?, #?\\right]", label: "\\left(\\square, \\square\\right]", command: "left" }),
  key({ id: "interval-co", tab: "basic", group: "괄호2", insert: "\\left[#?, #?\\right)", label: "\\left[\\square, \\square\\right)", command: "left" }),
  key({ id: "interval-cc", tab: "basic", group: "괄호2", insert: "\\left[#?, #?\\right]", label: "\\left[\\square, \\square\\right]", command: "left" }),
  key({ id: "cases", tab: "basic", group: "연립", insert: "\\begin{cases}#?\\\\#?\\end{cases}", label: "\\begin{cases}\\square\\\\\\square\\end{cases}", command: "cases" }),
];

/** 2) 대수 — 삼각비·로그·시그마·극한·미분·적분·기호 */
export const HIGH_SCHOOL_ALGEBRA_KEYS: readonly MathKey[] = [
  key({ id: "sin", tab: "algebra", group: "삼각비", insert: "\\sin{#?}", label: "\\sin", command: "sin" }),
  key({ id: "cos", tab: "algebra", group: "삼각비", insert: "\\cos{#?}", label: "\\cos", command: "cos" }),
  key({ id: "tan", tab: "algebra", group: "삼각비", insert: "\\tan{#?}", label: "\\tan", command: "tan" }),
  key({ id: "sec", tab: "algebra", group: "삼각비", insert: "\\sec{#?}", label: "\\sec", command: "sec" }),
  key({ id: "csc", tab: "algebra", group: "삼각비", insert: "\\csc{#?}", label: "\\csc", command: "csc" }),
  key({ id: "cot", tab: "algebra", group: "삼각비", insert: "\\cot{#?}", label: "\\cot", command: "cot" }),
  key({ id: "log", tab: "algebra", group: "로그", insert: "\\log{#?}", label: "\\log", command: "log" }),
  key({ id: "log-base", tab: "algebra", group: "로그", insert: "\\log_{#?}{#?}", label: "\\log_{\\square}\\square", command: "log" }),
  key({ id: "ln", tab: "algebra", group: "로그", insert: "\\ln{#?}", label: "\\ln", command: "ln" }),
  key({ id: "sum", tab: "algebra", group: "시그마", insert: "\\sum", label: "\\sum", command: "sum" }),
  key({ id: "sum-bound", tab: "algebra", group: "시그마", insert: "\\sum_{#?}^{#?}", label: "\\sum_{\\square}^{\\square}", command: "sum" }),
  key({ id: "lim", tab: "algebra", group: "극한", insert: "\\lim", label: "\\lim", command: "lim" }),
  key({ id: "lim-to", tab: "algebra", group: "극한", insert: "\\lim_{#?\\to#?}", label: "\\lim_{\\square\\to\\square}", command: "lim" }),
  key({ id: "prime", tab: "algebra", group: "미분", insert: "{#?}^{\\prime}", label: "\\square^{\\prime}", command: "prime" }),
  key({ id: "prime2", tab: "algebra", group: "미분", insert: "{#?}^{\\prime\\prime}", label: "\\square^{\\prime\\prime}", command: "prime" }),
  key({ id: "dydx", tab: "algebra", group: "미분", insert: "\\dfrac{dy}{dx}", label: "\\dfrac{dy}{dx}", command: "dfrac" }),
  key({ id: "delta", tab: "algebra", group: "미분", insert: "\\Delta", label: "\\Delta", command: "Delta" }),
  key({ id: "int", tab: "algebra", group: "적분", insert: "\\int", label: "\\int", command: "int" }),
  key({ id: "int-bound", tab: "algebra", group: "적분", insert: "\\int_{#?}^{#?}", label: "\\int_{\\square}^{\\square}", command: "int" }),
  key({ id: "bracket-bound", tab: "algebra", group: "적분", insert: "\\left[#?\\right]_{#?}^{#?}", label: "\\left[\\square\\right]_{\\square}^{\\square}", command: "left" }),
  key({ id: "pi", tab: "algebra", group: "기호", insert: "\\pi", label: "\\pi", command: "pi" }),
  key({ id: "degree", tab: "algebra", group: "기호", insert: "{#?}^{\\circ}", label: "\\square^{\\circ}", command: "circ" }),
  key({ id: "infty", tab: "algebra", group: "기호", insert: "\\infty", label: "\\infty", command: "infty" }),
];

/** 3) 기하 — 선·관계·도형·각·벡터 */
export const HIGH_SCHOOL_GEOMETRY_KEYS: readonly MathKey[] = [
  key({ id: "segment", tab: "geometry", group: "선", insert: "\\overline{#?}", label: "\\overline{\\square}", command: "overline" }),
  key({ id: "ray-right", tab: "geometry", group: "선", insert: "\\overrightarrow{#?}", label: "\\overrightarrow{\\square}", command: "overrightarrow" }),
  key({ id: "ray-left", tab: "geometry", group: "선", insert: "\\overleftarrow{#?}", label: "\\overleftarrow{\\square}", command: "overleftarrow" }),
  key({ id: "line", tab: "geometry", group: "선", insert: "\\overleftrightarrow{#?}", label: "\\overleftrightarrow{\\square}", command: "overleftrightarrow" }),
  key({ id: "arc", tab: "geometry", group: "선", insert: "\\overset{\\huge\\frown}{#?}", label: "\\overset{\\frown}{\\square}", command: "overset" }),
  key({ id: "equiv", tab: "geometry", group: "관계", insert: "\\equiv", label: "\\equiv", command: "equiv" }),
  key({ id: "sim", tab: "geometry", group: "관계", insert: "\\sim", label: "\\sim", command: "sim" }),
  key({ id: "sslash", tab: "geometry", group: "관계", insert: "\\sslash", label: "\\sslash", command: "sslash" }),
  key({ id: "perp", tab: "geometry", group: "관계", insert: "\\perp", label: "\\perp", command: "perp" }),
  key({ id: "triangle", tab: "geometry", group: "도형", insert: "\\triangle", label: "\\triangle", command: "triangle" }),
  key({ id: "square", tab: "geometry", group: "도형", insert: "\\Box", label: "\\Box", command: "Box" }),
  key({ id: "angle", tab: "geometry", group: "각", insert: "\\angle", label: "\\angle", command: "angle" }),
  key({ id: "geo-degree", tab: "geometry", group: "각", insert: "{#?}^{\\circ}", label: "\\square^{\\circ}", command: "circ" }),
  key({ id: "vec", tab: "geometry", group: "벡터", insert: "\\vec{#?}", label: "\\vec{\\square}", command: "vec" }),
  key({ id: "vec-ab", tab: "geometry", group: "벡터", insert: "\\overrightarrow{#?#?}", label: "\\overrightarrow{\\square\\square}", command: "overrightarrow" }),
];

/** 4) 집합·행렬 — 집합(원소·부분집합·연산) + 행렬(pmatrix) */
export const HIGH_SCHOOL_SET_MATRIX_KEYS: readonly MathKey[] = [
  key({ id: "set-vert", tab: "setMatrix", group: "집합", insert: "\\vert", label: "\\vert", command: "vert" }),
  key({ id: "set-varnothing", tab: "setMatrix", group: "집합", insert: "\\varnothing", label: "\\varnothing", command: "varnothing" }),
  key({ id: "set-in", tab: "setMatrix", group: "집합", insert: "\\in", label: "\\in", command: "in" }),
  key({ id: "set-notin", tab: "setMatrix", group: "집합", insert: "\\notin", label: "\\notin", command: "notin" }),
  key({ id: "set-subset", tab: "setMatrix", group: "집합", insert: "\\subset", label: "\\subset", command: "subset" }),
  key({ id: "set-notsubset", tab: "setMatrix", group: "집합", insert: "\\not\\subset", label: "\\not\\subset", command: "not" }),
  key({ id: "set-cap", tab: "setMatrix", group: "집합", insert: "\\cap", label: "\\cap", command: "cap" }),
  key({ id: "set-cup", tab: "setMatrix", group: "집합", insert: "\\cup", label: "\\cup", command: "cup" }),
  key({ id: "mat-2x2", tab: "setMatrix", group: "행렬", insert: "\\begin{pmatrix}#? & #?\\\\#? & #?\\end{pmatrix}", label: "\\begin{pmatrix}\\square & \\square\\\\\\square & \\square\\end{pmatrix}", command: "begin" }),
  key({ id: "mat-1x2", tab: "setMatrix", group: "행렬", insert: "\\begin{pmatrix}#? & #?\\end{pmatrix}", label: "\\begin{pmatrix}\\square & \\square\\end{pmatrix}", command: "begin" }),
  key({ id: "mat-1x3", tab: "setMatrix", group: "행렬", insert: "\\begin{pmatrix}#? & #? & #?\\end{pmatrix}", label: "\\begin{pmatrix}\\square & \\square & \\square\\end{pmatrix}", command: "begin" }),
  key({ id: "mat-2x3", tab: "setMatrix", group: "행렬", insert: "\\begin{pmatrix}#? & #? & #?\\\\#? & #? & #?\\end{pmatrix}", label: "\\begin{pmatrix}\\square & \\square & \\square\\\\\\square & \\square & \\square\\end{pmatrix}", command: "begin" }),
  key({ id: "mat-3x3", tab: "setMatrix", group: "행렬", insert: "\\begin{pmatrix}#? & #? & #?\\\\#? & #? & #?\\\\#? & #? & #?\\end{pmatrix}", label: "\\begin{pmatrix}\\square & \\square & \\square\\\\\\square & \\square & \\square\\\\\\square & \\square & \\square\\end{pmatrix}", command: "begin" }),
];

/** 5) 통계 — 순열·조합·중복순열/조합·팩토리얼 */
export const HIGH_SCHOOL_STATISTICS_KEYS: readonly MathKey[] = [
  key({ id: "nPr", tab: "statistics", group: "순열·조합", insert: "{#?}\\mathrm{P}_{#?}", label: "\\square\\mathrm{P}_{\\square}", command: "mathrm" }),
  key({ id: "nCr", tab: "statistics", group: "순열·조합", insert: "{#?}\\mathrm{C}_{#?}", label: "\\square\\mathrm{C}_{\\square}", command: "mathrm" }),
  key({ id: "nPir", tab: "statistics", group: "순열·조합", insert: "{#?}\\Pi_{#?}", label: "\\square\\Pi_{\\square}", command: "Pi" }),
  key({ id: "nHr", tab: "statistics", group: "순열·조합", insert: "{#?}\\mathrm{H}_{#?}", label: "\\square\\mathrm{H}_{\\square}", command: "mathrm" }),
  key({ id: "factorial", tab: "statistics", group: "순열·조합", insert: "!", label: "!", labelType: "text", command: "!" }),
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

export const HIGH_SCHOOL_KEYS_BY_TAB: Record<
  MathTab,
  readonly MathKey[]
> = {
  basic: HIGH_SCHOOL_BASIC_KEYS,
  algebra: HIGH_SCHOOL_ALGEBRA_KEYS,
  geometry: HIGH_SCHOOL_GEOMETRY_KEYS,
  setMatrix: HIGH_SCHOOL_SET_MATRIX_KEYS,
  statistics: HIGH_SCHOOL_STATISTICS_KEYS,
};
