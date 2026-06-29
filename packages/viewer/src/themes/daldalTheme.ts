import type { Theme } from "../types";

export const DALDAL_THEME: Theme = {
  id: "daldal",
  name: "달달독해",

  // 전역 레이아웃 설정
  containerConfig: {
    maxWidth: "740px",
    padding: "32px",
    backgroundColor: "#F8F9FA",
  },

  typography: {
    fontFamily: "https://fonts.googleapis.com/css2?family=Jua&display=swap",
    baseFontSize: "16px",
    baseLineHeight: "1.6",
    baseTextColor: "#2D3748",
  },

  questionOptionConfig: {
    common: {
      padding: "12px",
      borderWidth: "3px",
      borderRadius: "20px",
      backgroundColor: "#FAF5FF",
      borderColor: "#92400E",
    },
    state: {
      hover: {
        borderColor: "#A16207",
        backgroundColor: "",
      },
      selected: {
        backgroundColor: "#FEF9C3",
        borderColor: "#92400E",
        textColor: "#78350F",
      },
      correct: {
        backgroundColor: "#FEF9C3",
        borderColor: "#EAB308",
        textColor: "#78350F",
      },
      incorrect: {
        backgroundColor: "#FCE7F3",
        borderColor: "#EC4899",
        textColor: "#78350F",
      },
    },
  },
  submitButtonConfig: {
    common: {
      height: "56px",
      width: "100%",
      borderWidth: "3px",
      borderRadius: "30px",
      backgroundColor: "#9333EA",
      borderColor: "#78350F",
      textColor: "#FFFFFF",
    },
    state: {
      hover: {
        backgroundColor: "#7E22CE",
        borderColor: "#78350F",
        textColor: "#FFFFFF",
      },
      disabled: {
        backgroundColor: "#F3F4F6",
        borderColor: "#D1D5DB",
        textColor: "#6B7280",
      },
    },
  },
  feedbackConfig: {
    common: {
      buttonWidth: "100%",
      buttonHeight: "52px",
      title: {
        fontSize: "22px",
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
        backgroundColor: "#FEF9C3",
        textColor: "#78350F",
        button: {
          backgroundColor: "#EAB308",
          textColor: "#FFFFFF",
        },
        title: {
          text: "정답이에요!",
          textColor: "",
        },
        description: {
          textColor: "",
        },
      },
      incorrect: {
        backgroundColor: "#FCE7F3",
        textColor: "#78350F",
        button: {
          backgroundColor: "#EC4899",
          textColor: "#FFFFFF",
        },
        title: {
          text: "오답이에요!",
          textColor: "",
        },
        description: {
          textColor: "",
        },
      },
      explanation: {
        backgroundColor: "#EDE9FE",
        textColor: "#78350F",
        button: {
          backgroundColor: "#A78BFA",
          textColor: "#FFFFFF",
        },
        title: {
          text: "해설이에요!",
          textColor: "",
        },
        description: {
          textColor: "",
        },
      },
    },
  },
};
