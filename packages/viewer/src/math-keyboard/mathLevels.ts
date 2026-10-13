import { HIGH_SCHOOL_KEYS_BY_TAB, HIGH_SCHOOL_MATH_TABS } from "./highSchoolSymbols";
import { MATH_TAB_LABEL, type MathKey, type MathTab } from "./mathSymbols";
import { MIDDLE_SCHOOL_KEYS_BY_TAB, MIDDLE_SCHOOL_MATH_TABS } from "./middleSchoolSymbols";

export type MathLevel = "middle" | "high";

export interface MathLevelConfig {
  tabs: readonly MathTab[];
  tabLabel: Record<MathTab, string>;
  keysByTab: Partial<Record<MathTab, readonly MathKey[]>>;
}

export const MATH_LEVEL_CONFIG: Record<MathLevel, MathLevelConfig> = {
  middle: {
    tabs: MIDDLE_SCHOOL_MATH_TABS,
    tabLabel: {
      ...MATH_TAB_LABEL,
      algebra: "삼각비",
      geometry: "도형",
    },
    keysByTab: MIDDLE_SCHOOL_KEYS_BY_TAB,
  },
  high: {
    tabs: HIGH_SCHOOL_MATH_TABS,
    tabLabel: MATH_TAB_LABEL,
    keysByTab: HIGH_SCHOOL_KEYS_BY_TAB,
  },
};
