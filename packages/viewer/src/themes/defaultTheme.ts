import type { Theme } from "../types";
import { FONT_PRESETS } from "../utils/fontLoader";

export const DEFAULT_THEME: Theme = {
  id: "default",
  name: "기본 테마",

  // 전역 레이아웃 설정
  containerConfig: {
    maxWidth: "520px",
    padding: "20px",
    backgroundColor: "#FFFFFF",
  },
  /** 빈칸 형태: underline(밑줄) | box(박스). 기본은 underline */
  blankConfig: { style: "box", borderColor: "#1A1A1A" },

  // 전역 타이포그래피
  typography: {
    fontFamily: FONT_PRESETS["noto-sans-kr"].url!,
    baseFontSize: "16px",
    baseFontWeight: "400",
    baseLineHeight: "1.5",
    baseTextColor: "#1A1A1A",
  },
  // 컴포넌트별 설정
  questionOptionConfig: {
    common: {
      padding: "16px",
      borderWidth: "2px",
      borderRadius: "8px",
      backgroundColor: "#FFFFFF",
      borderColor: "#E5E7EB",
    },
    state: {
      hover: {
        borderColor: "#D1D5DB",
        backgroundColor: "#F3F4F6",
      },
      selected: {
        backgroundColor: "#EEF2FF",
        borderColor: "#6366F1",
        textColor: "#1A1A1A",
      },
      correct: {
        backgroundColor: "#ECFDF5",
        borderColor: "#10B981",
        textColor: "#065F46",
      },
      incorrect: {
        backgroundColor: "#FEF2F2",
        borderColor: "#EF4444",
        textColor: "#991B1B",
      },
    },
  },
  submitButtonConfig: {
    common: {
      height: "56px",
      width: "100%",
      borderWidth: "2px",
      borderRadius: "6px",
      backgroundColor: "#1F2937",
      borderColor: "#1F2937",
      textColor: "#F9FAFB",
    },
    state: {
      hover: {
        backgroundColor: "#374151",
        borderColor: "#374151",
        textColor: "#F9FAFB",
      },
      disabled: {
        backgroundColor: "#F3F4F6",
        borderColor: "#E5E7EB",
        textColor: "#9CA3AF",
      },
    },
  },
  feedbackConfig: {
    state: {
      correct: {
        title: {
          text: "정답입니다!",
          textColor: "",
        },
        button: {
          textColor: "#FFFFFF",
          backgroundColor: "#10B981",
        },
        textColor: "#065F46",
        description: {
          text: "정답입니다!",
          textColor: "",
        },
        backgroundColor: "#ECFDF5",
      },
      default: {
        button: {
          textColor: "#ffffff",
          backgroundColor: "#919397",
        },
      },
      incorrect: {
        title: {
          text: "다시 생각해보세요.",
          textColor: "",
        },
        button: {
          textColor: "#FFFFFF",
          backgroundColor: "#EF4444",
        },
        textColor: "#991B1B",
        description: {
          textColor: "",
        },
        backgroundColor: "#FEF2F2",
      },
      explanation: {
        title: {
          text: "해설",
          textColor: "",
        },
        button: {
          textColor: "#ffffff",
          backgroundColor: "#919397",
        },
        textColor: "#1A1A1A",
        description: {
          textColor: "",
        },
        backgroundColor: "#F3F4F6",
      },
    },
    common: {
      title: {
        fontSize: "20px",
      },
      buttonWidth: "100%",
      description: {
        fontSize: "14px",
      },
      buttonHeight: "44px",
    },
  },

  // 문제 번호 설정
  questionNumberConfig: {
    enabled: true,
    digits: 2,
    prefix: "문제 ",
    suffix: ".  ",
    fontSize: "16px",
    fontWeight: "500",
  },
};
