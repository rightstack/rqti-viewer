import type { MatchingPairType } from "../../../types";

/** 저장된 응답을 MatchingPairType[]로 파싱 */
export const parsePairs = (raw: unknown): MatchingPairType[] => {
  if (!Array.isArray(raw) || raw.length === 0) return [];
  if (typeof raw[0] === "string")
    return raw.map((s: string) => {
      const [leftId, rightId] = s.split(" ");
      return { leftId, rightId };
    });
  if (Array.isArray(raw[0]))
    return (raw as Array<[string, string]>).map(([leftId, rightId]) => ({ leftId, rightId }));
  return [];
};
