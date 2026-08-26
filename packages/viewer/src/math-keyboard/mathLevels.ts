/**
 * 수식입력기 레벨(중등/고등)별 설정.
 * 레벨마다 "심볼 세트 + 배치 규칙(그룹 최대 행 수·고정 폭)"을 한곳에서 관리한다.
 * 컴포넌트는 이 설정만 읽어 렌더하므로, 중등/고등 키캡 배치를 서로 독립적으로 바꿀 수 있다.
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
  /** 그룹당 세로 최대 행 수(열 우선 채움 기준). 중등 2행, 고등 3행 등 */
  maxGroupRows: number;
  /**
   * 탭별 그룹 최대 행 수 오버라이드. 지정 안 하면 maxGroupRows를 쓴다.
   * 1로 두면 그룹 내 키캡이 한 행에 가로로 나열된다.
   */
  maxGroupRowsByTab?: Partial<Record<MathTab, number>>;
  /** 그룹 내 최대 열 수. 지정 안 하면 4. */
  maxGroupCols?: number;
  /** 좌측 수식 영역 고정 폭(px) */
  width: number;
}

export const MATH_LEVEL_CONFIG: Record<MathLevel, MathLevelConfig> = {
  middle: {
    tabs: MIDDLE_SCHOOL_MATH_TABS,
    tabLabel: MATH_TAB_LABEL,
    keysByTab: MIDDLE_SCHOOL_KEYS_BY_TAB,
    maxGroupRows: 2,
    // 대수는 키캡이 적어 그룹 내 키캡을 가로 1행으로 나열한다.
    // 기하는 키캡이 많아(선/관계 등) 460px를 넘어 2행 유지.
    maxGroupRowsByTab: { algebra: 1 },
    width: 460,
  },
  high: {
    // 고등은 기본/대수/기하 + 집합·행렬 + 통계 5개 탭.
    tabs: HIGH_SCHOOL_MATH_TABS,
    tabLabel: MATH_TAB_LABEL,
    keysByTab: HIGH_SCHOOL_KEYS_BY_TAB,
    // 고등은 그룹·키가 많아 그룹당 3행까지 세로로 쌓아 폭을 아낀다.
    maxGroupRows: 3,
    // 통계·행렬(각 5개)은 2행으로 낮춰 3열로 펼친다. (집합 8개는 maxGroupCols=3에서 3열×3행)
    maxGroupRowsByTab: { statistics: 2, setMatrix: 2 },
    // 고등 그룹은 최대 3열까지만 채운다(집합 8개도 3열 유지).
    maxGroupCols: 3,
    // 좌측 수식 영역 고정 폭. 중등과 동일하게 맞춘다(대수 ≈429px라 여유 있음).
    width: 460,
  },
};
