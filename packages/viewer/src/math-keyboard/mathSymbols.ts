export type MathTab = "basic" | "algebra" | "geometry" | "characters" | "setMatrix" | "statistics";

export interface MathKey {
  id: string;
  tab: MathTab;
  group?: string;
  insert: string;
  label: string;
  labelType: "text" | "latex";
  cols?: 1 | 2;
}

export function takeKeys(source: readonly MathKey[], ...items: Array<string | MathKey>): MathKey[] {
  const map = new Map(source.map((item) => [item.id, item]));
  return items.map((item) => {
    if (typeof item !== "string") return item;
    const found = map.get(item);
    if (!found) throw new Error(`Unknown math key id: ${item}`);
    return found;
  });
}

export const MATH_TAB_LABEL: Record<MathTab, string> = {
  basic: "기본",
  algebra: "대수",
  geometry: "기하",
  characters: "문자",
  setMatrix: "집합·행렬",
  statistics: "통계",
};
