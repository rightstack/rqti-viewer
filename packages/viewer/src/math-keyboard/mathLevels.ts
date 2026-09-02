/**
 * 수식입력기 레벨(중등/고등)별 설정.
 * 레벨마다 심볼 세트와 좌측 서랍 폭을 한곳에서 관리한다.
 */
import {
  MIDDLE_SCHOOL_KEYS_BY_TAB,
  MIDDLE_SCHOOL_MATH_TABS,
} from "./middleSchoolSymbols";
import {
  HIGH_SCHOOL_KEYS_BY_TAB,
  HIGH_SCHOOL_MATH_TABS,
} from "./highSchoolSymbols";
import { MATH_TAB_LABEL, type MathKey, type MathTab } from "./mathSymbols";

export type MathLevel = "middle" | "high";

export interface MathLevelConfig {
  /** 노출 탭 순서 */
  tabs: readonly MathTab[];
  /** 탭 라벨 */
  tabLabel: Record<MathTab, string>;
  /** 탭별 키 목록. tabs에 나열된 탭만 채우면 된다. */
  keysByTab: Partial<Record<MathTab, readonly MathKey[]>>;
  /** 좌측 수식 영역 고정 폭(px). 4열 격자 + OS 스크롤바 여유. 높이는 우측 5행과 같다. */
  width: number;
}

/** 좌측 심화 키 열 수. 우측 숫자 패드와 맞춘다. */
export const LEFT_KEY_COLS = 4;

/** 4×3rem + 3×0.25rem + 스크롤바 여유 16px (16px 루트 기준). */
export const LEFT_DRAWER_WIDTH = 220;

export const MATH_LEVEL_CONFIG: Record<MathLevel, MathLevelConfig> = {
  middle: {
    tabs: MIDDLE_SCHOOL_MATH_TABS,
    tabLabel: MATH_TAB_LABEL,
    keysByTab: MIDDLE_SCHOOL_KEYS_BY_TAB,
    width: LEFT_DRAWER_WIDTH,
  },
  high: {
    tabs: HIGH_SCHOOL_MATH_TABS,
    tabLabel: MATH_TAB_LABEL,
    keysByTab: HIGH_SCHOOL_KEYS_BY_TAB,
    width: LEFT_DRAWER_WIDTH,
  },
};
