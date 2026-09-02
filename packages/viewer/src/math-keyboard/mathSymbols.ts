/**
 * 수식입력기 공용 타입·라벨.
 * 레벨별 키 "데이터"는 middleSchoolSymbols.ts / highSchoolSymbols.ts 에 분리되어 있고,
 * 두 파일이 함께 쓰는 탭 식별자·키 구조·탭 라벨만 여기(공용)에 둔다.
 */

/**
 * 전 레벨 공용 탭 식별자.
 * 중등은 basic/algebra/geometry 3장만 쓰고, 고등은 setMatrix/statistics를 더한다.
 */
export type MathTab =
  | "basic"
  | "algebra"
  | "geometry"
  | "setMatrix"
  | "statistics";

export interface MathKey {
  id: string;
  tab: MathTab;
  /** 탭 안 유사 수식 묶음. 한눈에 찾기 위한 소제목 */
  group?: string;
  /** MathLive insert용 LaTeX. `#?`는 플레이스홀더 */
  insert: string;
  /** 버튼 표시. latex면 MathLive로 렌더 */
  label: string;
  labelType: "text" | "latex";
  /** 정답 첫 명령어 판별용 (백슬래시 없는 이름, 또는 `^` / 문자) */
  command: string;
  /** 격자에서 차지하는 열 수. 행렬처럼 넓은 키는 2. 기본 1. */
  cols?: 1 | 2;
}

/** source에서 id로 키를 꺼내거나, 고등 전용 MathKey를 그대로 끼운다. */
export function takeKeys(
  source: readonly MathKey[],
  ...items: Array<string | MathKey>
): MathKey[] {
  const map = new Map(source.map((item) => [item.id, item]));
  return items.map((item) => {
    if (typeof item !== "string") return item;
    const found = map.get(item);
    if (!found) throw new Error(`Unknown math key id: ${item}`);
    return found;
  });
}

/** 탭 라벨(전 레벨 공용). */
export const MATH_TAB_LABEL: Record<MathTab, string> = {
  basic: "기본",
  algebra: "대수",
  geometry: "기하",
  setMatrix: "집합·행렬",
  statistics: "통계",
};
