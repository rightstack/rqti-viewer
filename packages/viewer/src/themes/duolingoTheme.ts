import type { Theme } from "../types";

export const DUOLINGO_THEME: Theme = {
  id: "duolingo",
  name: "Duolingo Style",

  // 전역 레이아웃 설정
  containerConfig: {
    maxWidth: "800px",
    padding: "20px",
    backgroundColor: "#FFFFFF",
  },

  // 전역 타이포그래피
  typography: {
    fontFamily: "https://fonts.cdnfonts.com/css/din-round",
    baseFontSize: "15px",
    baseLineHeight: "1.5",
    baseTextColor: "#3C3C3C",
  },

  // 컴포넌트별 설정
  questionOptionConfig: {
    common: {
      padding: "14px",
      borderWidth: "3px",
      borderRadius: "16px",
      backgroundColor: "#FFFFFF",
      borderColor: "#D1D5DB",
    },
    state: {
      hover: {
        borderColor: "#9CA3AF",
        backgroundColor: "#FFFFFF",
      },
      selected: {
        backgroundColor: "#ECFDF5",
        borderColor: "#58CC02",
        textColor: "#111827",
      },
      correct: {
        backgroundColor: "#DBEAFE",
        borderColor: "#3B82F6",
        textColor: "#111827",
      },
      incorrect: {
        backgroundColor: "#FEE2E2",
        borderColor: "#EF4444",
        textColor: "#111827",
      },
    },
  },
  submitButtonConfig: {
    common: {
      height: "56px",
      width: "100%",
      borderWidth: "2px",
      borderRadius: "16px",
      backgroundColor: "#58CC02",
      borderColor: "#58CC02",
      textColor: "#FFFFFF",
    },
    state: {
      hover: {
        backgroundColor: "#4CAF00",
        borderColor: "#4CAF00",
        textColor: "#FFFFFF",
      },
      disabled: {
        backgroundColor: "#D1D5DB",
        borderColor: "#D1D5DB",
        textColor: "#9CA3AF",
      },
    },
  },
  feedbackConfig: {
    common: {
      buttonWidth: "100%",
      buttonHeight: "44px",
      title: {
        fontSize: "21px",
      },
      description: {
        fontSize: "15px",
      },
    },
    state: {
      default: {
        button: {
          backgroundColor: "#919397",
          textColor: "#ffffff",
        },
      },
      correct: {
        backgroundColor: "#DBEAFE",
        textColor: "#111827",
        button: {
          backgroundColor: "#3B82F6",
          textColor: "#FFFFFF",
        },
        title: {
          text: "정답",
          textColor: "",
        },
        description: {
          textColor: "",
        },
      },
      incorrect: {
        backgroundColor: "#FEE2E2",
        textColor: "#111827",
        button: {
          backgroundColor: "#EF4444",
          textColor: "#FFFFFF",
        },
        title: {
          text: "오답",
          textColor: "",
        },
        description: {
          textColor: "",
        },
      },
      explanation: {
        backgroundColor: "#D1FAE5",
        textColor: "#111827",
        button: {
          backgroundColor: "#10B981",
          textColor: "#FFFFFF",
        },
        title: {
          text: "풀이",
          textColor: "",
        },
        description: {
          textColor: "",
        },
      },
    },
  },
};
