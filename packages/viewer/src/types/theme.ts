/**
 * ==========================================
 * Theme Types
 * ==========================================
 *
 * 테마 관련 타입 정의
 */

/**
 * 피드백 타입
 */
export type FeedbackType =
  | "CORRECT"
  | "INCORRECT"
  | "SOLUTION"
  | "HINT"
  | "TRANSLATION"
  | "SAMPLE_ANSWER"
  | "SCRIPT";

/**
 * 공통 스타일 타입
 */
export interface CommonStyleType {
  /** 높이 */
  height?: string;
  /** 너비 */
  width?: string;
  /** 패딩 */
  padding?: string;
  /** 폰트 크기 */
  fontSize?: string;
  /** 폰트 두께 */
  fontWeight?: string;
  /** 테두리 두께 */
  borderWidth?: string;
  /** 테두리 둥글기 */
  borderRadius?: string;
  /** 배경색 */
  backgroundColor?: string;
  /** 테두리 색상 */
  borderColor?: string;
  /** 텍스트 색상 */
  textColor?: string;
}

/**
 * 상태별 스타일 타입
 */
export interface StateStyleType {
  /** 배경색 */
  backgroundColor?: string;
  /** 테두리 색상 */
  borderColor?: string;
  /** 텍스트 색상 */
  textColor?: string;
}

/**
 * 버튼 상태 타입
 */
export interface ButtonStateType {
  /** 호버 상태 */
  hover?: StateStyleType;
  /** 비활성 상태 */
  disabled?: StateStyleType;
}

/**
 * 버튼 스타일 타입
 */
export interface ButtonStyleType {
  /** 공통 스타일 */
  common?: CommonStyleType;
  /** 상태별 스타일 */
  state?: ButtonStateType;
}

/**
 * 옵션 상태 타입
 */
export interface QuestionOptionStateType {
  /** 호버 상태 */
  hover?: StateStyleType;
  /** 선택된 상태 */
  selected?: StateStyleType;
  /** 정답 상태 */
  correct?: StateStyleType;
  /** 오답 상태 */
  incorrect?: StateStyleType;
}

/**
 * 옵션 스타일 타입
 */
export interface QuestionOptionStyleType {
  /** 공통 스타일 */
  common?: CommonStyleType;
  /** 상태별 스타일 */
  state?: QuestionOptionStateType;
}

/**
 * 피드백 텍스트 스타일 타입
 */
export interface FeedbackTextStyleType {
  /** 폰트 크기 */
  fontSize?: string;
  /** 폰트 두께 */
  fontWeight?: string;
  /** 텍스트 색상 */
  color?: string;
}

/**
 * 피드백 상태 타입
 */
export interface FeedbackStateType {
  /** 배경색 */
  backgroundColor?: string;
  /** 텍스트 색상 */
  textColor?: string;
  /** 버튼 스타일 */
  button?: {
    /** 배경색 */
    backgroundColor?: string;
    /** 텍스트 색상 */
    textColor?: string;
  };
  /** 제목 스타일 (선택적, 없으면 common의 title.textColor 사용) */
  title?: {
    /** 제목 텍스트 */
    text?: string;
    /** 텍스트 색상 */
    textColor?: string;
  };
  /** 설명 스타일 (선택적, 없으면 common의 description.textColor 사용) */
  description?: {
    /** 설명 텍스트 */
    text?: string;
    /** 텍스트 색상 */
    textColor?: string;
  };
  /** 버튼 스타일 배열 (최대 2개: primary, secondary) */
  buttons?: ButtonStyleType[];
}

/**
 * 피드백 스타일 타입
 */
export interface FeedbackStyleType {
  /** 공통 스타일 */
  common?: CommonStyleType & {
    /** 버튼 너비 */
    buttonWidth?: string;
    /** 버튼 높이 */
    buttonHeight?: string;
    /** 제목 스타일 */
    title?: FeedbackTextStyleType;
    /** 설명 스타일 */
    description?: FeedbackTextStyleType;
    /** 정답 시 좌상단 뱃지 아이콘 이미지 (업로드 시 data URL 저장, 없으면 기본 O SVG) */
    correctIconUrl?: string;
    /** 오답 시 좌상단 뱃지 아이콘 이미지 (업로드 시 data URL 저장, 없으면 기본 X SVG) */
    incorrectIconUrl?: string;
  };
  /** 상태별 스타일 */
  state?: {
    /** 기본 피드백 */
    default?: FeedbackStateType;
    /** 정답 피드백 */
    correct?: FeedbackStateType;
    /** 오답 피드백 */
    incorrect?: FeedbackStateType;
    /** 해설 피드백 */
    explanation?: FeedbackStateType;
  };
}

/**
 * 컨테이너 설정 타입
 */
export interface ContainerConfigType {
  /** 최대 너비 */
  maxWidth?: string;
  /** 패딩 */
  padding?: string;
  /** 배경 색상 */
  backgroundColor?: string;
}

/**
 * 빈칸(blank) 표시 형태
 * - underline: 밑줄만 (기본)
 * - box: 테두리 박스
 */
export type BlankStyleType = "underline" | "box";

/**
 * 빈칸(blank) 스타일 설정 타입
 */
export interface BlankConfigType {
  /** 형태 (underline | box). 테마에서 설정하면 .qti-ext-blank에 적용됨 */
  style?: BlankStyleType;
  /** 선/테두리 색상 (없으면 --qti-option-border 사용) */
  borderColor?: string;
  /** 선 굵기 (없으면 1px) */
  borderWidth?: string;
}

/** 발문/지문/보기/선택지 등 텍스트 스타일 (설정 없으면 공통값 사용) */
export interface TextStyleType {
  /** 글자 크기 */
  fontSize?: string;
  /** 글자 굵기 */
  fontWeight?: string;
}

/** 지문·보기 영역: 텍스트 스타일 + 테두리(선) 스타일 */
export interface ExampleStimulusStyleType extends TextStyleType {
  /** 테두리(선) 색상 (없으면 --qti-option-border) */
  borderColor?: string;
  /** 테두리(선) 굵기 (없으면 1px) */
  borderWidth?: string;
}

/**
 * 타이포그래피 설정 타입
 */
export interface TypographyConfigType {
  /** 폰트 패밀리 (CSS 파일 또는 Google Fonts URL) */
  fontFamily?: string;
  /** 기본 폰트 크기 (공통) */
  baseFontSize?: string;
  /** 기본 글자 굵기 (공통) */
  baseFontWeight?: string;
  /** 기본 줄 간격 */
  baseLineHeight?: string;
  /** 기본 텍스트 색상 */
  baseTextColor?: string;
  /** 발문(.qti-ext-prompt) 글자크기·굵기 (없으면 공통값) */
  prompt?: TextStyleType;
  /** 지문·보기(.qti-ext-example, .qti-ext-stimulus) 글자크기·굵기·선 색상·선 굵기 (없으면 공통/option-border) */
  exampleStimulus?: ExampleStimulusStyleType;
  /** 선택지(.qti-ext-option-base) 글자크기·굵기 (없으면 questionOptionConfig.common 또는 공통값) */
  optionBase?: TextStyleType;
}

/**
 * 문제 번호 설정 타입
 */
export interface QuestionNumberConfigType {
  /** 사용 여부 */
  enabled?: boolean;
  /** 자릿수 */
  digits?: number;
  /** 접두사 */
  prefix?: string;
  /** 접미사 */
  suffix?: string;
  /** 폰트 크기 */
  fontSize?: string;
  /** 폰트 두께 */
  fontWeight?: string;
  /** 텍스트 색상 */
  textColor?: string;
  /** 위치 */
  position?: "top" | "inline";
}

/**
 * 테마 타입
 */
export interface Theme {
  /** 테마 ID */
  id: string;
  /** 테마 이름 */
  name: string;
  /** 컨테이너 설정 */
  containerConfig?: ContainerConfigType;
  /** 타이포그래피 설정 */
  typography?: TypographyConfigType;
  /** 옵션 스타일 설정 */
  questionOptionConfig?: QuestionOptionStyleType;
  /** 제출 버튼 스타일 설정 */
  submitButtonConfig?: ButtonStyleType;
  /** 피드백 스타일 설정 */
  feedbackConfig?: FeedbackStyleType;
  /** 빈칸(blank) 스타일 설정. .qti-ext-blank 형태(밑줄/박스) 제어 */
  blankConfig?: BlankConfigType;
  /** 문제 번호 설정 */
  questionNumberConfig?: QuestionNumberConfigType;
}
