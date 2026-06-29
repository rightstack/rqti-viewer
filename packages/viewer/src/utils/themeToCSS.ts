/**
 * ==========================================
 * Theme to CSS Variables Converter
 * ==========================================
 *
 * JSON 형태의 테마를 CSS 변수로 변환합니다.
 * 컨테이너 스코프로 적용되어 전역 오염이 없습니다.
 */
import { DEFAULT_THEME } from "../themes";
import type { ButtonStyleType, Theme } from "../types";
import { FONT_PRESETS } from "./fontLoader";

export type CSSVariables = Record<string, string>;

/**
 * URL에서 폰트 패밀리 이름 추출
 * - FONT_PRESETS에 있는 URL이면 해당 폰트 패밀리 이름 반환
 * - Google Fonts URL이면 family 파라미터에서 추출
 * - 그 외에는 그대로 반환 (이미 폰트 패밀리 이름인 경우)
 */
function extractFontFamilyName(fontFamily?: string): string | undefined {
  if (!fontFamily) return undefined;

  // FONT_PRESETS에서 URL로 찾기
  for (const config of Object.values(FONT_PRESETS)) {
    if (config.url === fontFamily) {
      return `'${config.family}', system-ui, sans-serif`;
    }
  }

  // Google Fonts URL인 경우 family 파라미터 추출
  if (fontFamily.startsWith("http")) {
    try {
      const url = new URL(fontFamily);
      const familyParam = url.searchParams.get("family");
      if (familyParam) {
        // "Noto+Sans+KR:wght@400" -> "Noto Sans KR"
        const familyName = familyParam.split(":")[0].replace(/\+/g, " ");
        return `'${familyName}', system-ui, sans-serif`;
      }
    } catch {
      // URL 파싱 실패 시 그대로 반환
    }
  }

  // 이미 폰트 패밀리 이름인 경우 그대로 반환
  return fontFamily;
}

/**
 * 테마 객체를 CSS 변수 객체로 변환
 * React 컴포넌트의 style prop에 사용
 *
 * @example
 * ```tsx
 * <div style={getThemeCSSVariables(theme) as React.CSSProperties}>
 *   {children}
 * </div>
 * ```
 */
export function getThemeCSSVariables(theme: Theme): CSSVariables {
  const variables: CSSVariables = {};

  // Container - 값이 없으면 DEFAULT_THEME에서 가져옴
  const defaultContainer = DEFAULT_THEME.containerConfig;
  const container = theme.containerConfig;
  addIfExists(
    variables,
    "--qti-container-max-width",
    container?.maxWidth ?? defaultContainer?.maxWidth
  );
  addIfExists(
    variables,
    "--qti-container-padding",
    container?.padding ?? defaultContainer?.padding
  );
  addIfExists(
    variables,
    "--qti-container-bg",
    container?.backgroundColor ?? defaultContainer?.backgroundColor
  );

  // Typography - 값이 없으면 DEFAULT_THEME에서 가져옴
  const defaultTypography = DEFAULT_THEME.typography;
  const typography = theme.typography;
  const fontFamily = typography?.fontFamily ?? defaultTypography?.fontFamily;
  // fontFamily가 URL인 경우 폰트 패밀리 이름으로 변환
  const fontFamilyValue = extractFontFamilyName(fontFamily);
  addIfExists(variables, "--qti-font-family", fontFamilyValue);
  addIfExists(
    variables,
    "--qti-font-size-base",
    typography?.baseFontSize ?? defaultTypography?.baseFontSize
  );
  addIfExists(
    variables,
    "--qti-line-height-base",
    typography?.baseLineHeight ?? defaultTypography?.baseLineHeight
  );
  addIfExists(
    variables,
    "--qti-base-text-color",
    typography?.baseTextColor ?? defaultTypography?.baseTextColor
  );
  // 공통 글자 굵기 (빈 문자열이면 기본 400). 항상 문자열로 설정해 CSS에 확실히 적용
  const baseFontWeight = String(
    typography?.baseFontWeight || defaultTypography?.baseFontWeight || "400"
  );
  variables["--qti-font-weight-base"] = baseFontWeight;
  variables["--font-weight-normal"] = baseFontWeight;

  // 발문/지문·보기/선택지 텍스트 스타일 (없거나 비우면 공통값)
  const baseFontSize = typography?.baseFontSize ?? defaultTypography?.baseFontSize;
  const opt = (v: string | undefined) => (v && String(v).trim() !== "" ? String(v) : undefined);
  addIfExists(
    variables,
    "--qti-prompt-font-size",
    opt(typography?.prompt?.fontSize) ?? baseFontSize
  );
  variables["--qti-prompt-font-weight"] = opt(typography?.prompt?.fontWeight) ?? baseFontWeight;
  addIfExists(
    variables,
    "--qti-example-stimulus-font-size",
    opt(typography?.exampleStimulus?.fontSize) ?? baseFontSize
  );
  variables["--qti-example-stimulus-font-weight"] =
    opt(typography?.exampleStimulus?.fontWeight) ?? baseFontWeight;
  variables["--qti-example-stimulus-border-color"] =
    opt(typography?.exampleStimulus?.borderColor) || "var(--qti-option-border)";
  variables["--qti-example-stimulus-border-width"] =
    opt(typography?.exampleStimulus?.borderWidth) || "1px";
  addIfExists(
    variables,
    "--qti-option-font-size",
    opt(typography?.optionBase?.fontSize) ??
      opt(theme.questionOptionConfig?.common?.fontSize) ??
      baseFontSize
  );
  variables["--qti-option-font-weight"] =
    opt(typography?.optionBase?.fontWeight) ??
    opt(theme.questionOptionConfig?.common?.fontWeight) ??
    baseFontWeight;

  // Question Option - config가 없어도 DEFAULT_THEME 사용
  addOptionVariables(variables, theme.questionOptionConfig);

  // Submit Button - config가 없어도 DEFAULT_THEME 사용
  addButtonVariables(variables, theme.submitButtonConfig, "button");

  // Feedback - config가 없어도 DEFAULT_THEME 사용
  addFeedbackVariables(variables, theme.feedbackConfig, theme);

  // Blank - 테마에서 .qti-ext-blank 형태(밑줄/박스) 제어
  addBlankVariables(variables, theme.blankConfig);

  // 문항 번호 - questionNumberConfig (폰트/색상만 변수로, position은 JSX에서 분기)
  const qn = theme.questionNumberConfig;
  const promptFontSize = opt(typography?.prompt?.fontSize) ?? baseFontSize;
  addIfExists(variables, "--qti-question-number-font-size", opt(qn?.fontSize) ?? promptFontSize);
  addIfExists(
    variables,
    "--qti-question-number-font-weight",
    opt(qn?.fontWeight) ?? baseFontWeight
  );
  addIfExists(
    variables,
    "--qti-question-number-color",
    opt(qn?.textColor) ?? "var(--qti-base-text-color, #1a1a1a)"
  );

  return variables;
}

/**
 * Blank 변수 추가 (.qti-ext-blank 형태: underline | box, 컬러·선 굵기)
 */
function addBlankVariables(variables: CSSVariables, config: Theme["blankConfig"]): void {
  const style = config?.style ?? "underline";
  const borderColor = config?.borderColor || "var(--qti-option-border)";
  const borderWidth = config?.borderWidth || "1px";
  const borderValue = `${borderWidth} solid ${borderColor}`;

  variables["--qti-blank-border-color"] = borderColor;
  variables["--qti-blank-border-width"] = borderWidth;

  if (style === "underline") {
    variables["--qti-blank-border"] = "none";
    variables["--qti-blank-border-bottom"] = "none";
    variables["--qti-blank-underline-line"] = borderValue;
    variables["--qti-blank-underline-shift"] = "0.1em";
    variables["--qti-blank-border-radius"] = "0";
    variables["--qti-blank-padding"] = "0 5px";
    variables["--qti-blank-min-height"] = "0";
  } else {
    variables["--qti-blank-border"] = borderValue;
    variables["--qti-blank-border-bottom"] = borderValue;
    variables["--qti-blank-underline-line"] = "none";
    variables["--qti-blank-underline-shift"] = "0";
    variables["--qti-blank-border-radius"] = "4px";
    variables["--qti-blank-padding"] = "2px 8px";
    variables["--qti-blank-min-height"] = "1.5em";
  }
}

/**
 * Option 변수 추가
 */
function addOptionVariables(variables: CSSVariables, config: Theme["questionOptionConfig"]): void {
  // Common - 값이 없으면 DEFAULT_THEME에서 가져옴
  const defaultCommon = DEFAULT_THEME.questionOptionConfig?.common;
  const common = config?.common;
  addIfExists(variables, "--qti-option-padding", common?.padding ?? defaultCommon?.padding);
  // fontSize는 typography.baseFontSize를 사용
  addIfExists(
    variables,
    "--qti-option-border-width",
    common?.borderWidth ?? defaultCommon?.borderWidth
  );
  addIfExists(
    variables,
    "--qti-option-border-radius",
    common?.borderRadius ?? defaultCommon?.borderRadius
  );
  addIfExists(
    variables,
    "--qti-option-bg",
    common?.backgroundColor ?? defaultCommon?.backgroundColor
  );
  addIfExists(variables, "--qti-option-border", common?.borderColor ?? defaultCommon?.borderColor);

  // States - 값이 없으면 DEFAULT_THEME에서 가져옴
  const defaultState = DEFAULT_THEME.questionOptionConfig?.state;
  const state = config?.state;

  // Hover
  addIfExists(
    variables,
    "--qti-option-bg-hover",
    state?.hover?.backgroundColor ?? defaultState?.hover?.backgroundColor
  );
  addIfExists(
    variables,
    "--qti-option-border-hover",
    state?.hover?.borderColor ?? defaultState?.hover?.borderColor
  );

  // Selected
  addIfExists(
    variables,
    "--qti-option-bg-selected",
    state?.selected?.backgroundColor ?? defaultState?.selected?.backgroundColor
  );
  addIfExists(
    variables,
    "--qti-option-border-selected",
    state?.selected?.borderColor ?? defaultState?.selected?.borderColor
  );
  addIfExists(
    variables,
    "--qti-option-text-selected",
    state?.selected?.textColor ?? defaultState?.selected?.textColor
  );

  // Correct
  addIfExists(
    variables,
    "--qti-option-bg-correct",
    state?.correct?.backgroundColor ?? defaultState?.correct?.backgroundColor
  );
  addIfExists(
    variables,
    "--qti-option-border-correct",
    state?.correct?.borderColor ?? defaultState?.correct?.borderColor
  );
  addIfExists(
    variables,
    "--qti-option-text-correct",
    state?.correct?.textColor ?? defaultState?.correct?.textColor
  );

  // Incorrect
  addIfExists(
    variables,
    "--qti-option-bg-incorrect",
    state?.incorrect?.backgroundColor ?? defaultState?.incorrect?.backgroundColor
  );
  addIfExists(
    variables,
    "--qti-option-border-incorrect",
    state?.incorrect?.borderColor ?? defaultState?.incorrect?.borderColor
  );
  addIfExists(
    variables,
    "--qti-option-text-incorrect",
    state?.incorrect?.textColor ?? defaultState?.incorrect?.textColor
  );
}

/**
 * Button 변수 추가
 */
function addButtonVariables(
  variables: CSSVariables,
  config: Theme["submitButtonConfig"],
  prefix: string
): void {
  // Common - 값이 없으면 DEFAULT_THEME에서 가져옴
  const defaultCommon = DEFAULT_THEME.submitButtonConfig?.common;
  const common = config?.common;
  addIfExists(variables, `--qti-${prefix}-height`, common?.height ?? defaultCommon?.height);
  addIfExists(variables, `--qti-${prefix}-width`, common?.width ?? defaultCommon?.width);
  addIfExists(
    variables,
    `--qti-${prefix}-border-width`,
    common?.borderWidth ?? defaultCommon?.borderWidth
  );
  addIfExists(
    variables,
    `--qti-${prefix}-border-radius`,
    common?.borderRadius ?? defaultCommon?.borderRadius
  );
  addIfExists(
    variables,
    `--qti-${prefix}-bg`,
    common?.backgroundColor ?? defaultCommon?.backgroundColor
  );
  addIfExists(
    variables,
    `--qti-${prefix}-border`,
    common?.borderColor ?? defaultCommon?.borderColor
  );
  addIfExists(variables, `--qti-${prefix}-text`, common?.textColor ?? defaultCommon?.textColor);

  // States - 값이 없으면 DEFAULT_THEME에서 가져옴
  const defaultState = DEFAULT_THEME.submitButtonConfig?.state;
  const state = config?.state;

  // Hover
  addIfExists(
    variables,
    `--qti-${prefix}-bg-hover`,
    state?.hover?.backgroundColor ?? defaultState?.hover?.backgroundColor
  );
  addIfExists(
    variables,
    `--qti-${prefix}-border-hover`,
    state?.hover?.borderColor ?? defaultState?.hover?.borderColor
  );
  addIfExists(
    variables,
    `--qti-${prefix}-text-hover`,
    state?.hover?.textColor ?? defaultState?.hover?.textColor
  );

  // Disabled
  addIfExists(
    variables,
    `--qti-${prefix}-bg-disabled`,
    state?.disabled?.backgroundColor ?? defaultState?.disabled?.backgroundColor
  );
  addIfExists(
    variables,
    `--qti-${prefix}-border-disabled`,
    state?.disabled?.borderColor ?? defaultState?.disabled?.borderColor
  );
  addIfExists(
    variables,
    `--qti-${prefix}-text-disabled`,
    state?.disabled?.textColor ?? defaultState?.disabled?.textColor
  );
}

/**
 * Feedback 변수 추가
 */
function addFeedbackVariables(
  variables: CSSVariables,
  config: Theme["feedbackConfig"],
  theme: Theme
): void {
  // Common - 값이 없으면 DEFAULT_THEME에서 가져옴
  const defaultCommon = DEFAULT_THEME.feedbackConfig?.common;
  const common = config?.common;
  addIfExists(variables, "--qti-feedback-padding", common?.padding ?? defaultCommon?.padding);
  addIfExists(variables, "--qti-feedback-font-size", common?.fontSize ?? defaultCommon?.fontSize);
  addIfExists(
    variables,
    "--qti-feedback-border-radius",
    common?.borderRadius ?? defaultCommon?.borderRadius
  );

  // Button 스타일
  addIfExists(
    variables,
    "--qti-feedback-button-width",
    common?.buttonWidth ?? defaultCommon?.buttonWidth
  );
  addIfExists(
    variables,
    "--qti-feedback-button-height",
    common?.buttonHeight ?? defaultCommon?.buttonHeight
  );

  // Title 스타일
  const defaultTitle = defaultCommon?.title;
  const title = common?.title;
  addIfExists(
    variables,
    "--qti-feedback-title-font-size",
    title?.fontSize ?? defaultTitle?.fontSize
  );
  addIfExists(
    variables,
    "--qti-feedback-title-font-weight",
    title?.fontWeight ?? defaultTitle?.fontWeight
  );
  addIfExists(variables, "--qti-feedback-title-color", title?.color ?? defaultTitle?.color);

  // Description 스타일
  const defaultDescription = defaultCommon?.description;
  const description = common?.description;
  addIfExists(
    variables,
    "--qti-feedback-description-font-size",
    description?.fontSize ?? defaultDescription?.fontSize
  );
  addIfExists(
    variables,
    "--qti-feedback-description-font-weight",
    description?.fontWeight ?? defaultDescription?.fontWeight
  );
  addIfExists(
    variables,
    "--qti-feedback-description-color",
    description?.color ?? defaultDescription?.color
  );

  // States - 값이 없으면 DEFAULT_THEME에서 가져옴
  const defaultState = DEFAULT_THEME.feedbackConfig?.state;
  const state = config?.state;

  // Default
  const defaultFeedback = defaultState?.default;

  addIfExists(
    variables,
    "--qti-feedback-button-bg-default",
    state?.default?.button?.backgroundColor ?? defaultFeedback?.button?.backgroundColor
  );
  addIfExists(
    variables,
    "--qti-feedback-button-text-default",
    state?.default?.button?.textColor ?? defaultFeedback?.button?.textColor
  );

  // Correct
  const correct = state?.correct;
  const defaultCorrect = defaultState?.correct;
  addIfExists(
    variables,
    "--qti-feedback-bg-correct",
    correct?.backgroundColor ?? defaultCorrect?.backgroundColor
  );
  addIfExists(
    variables,
    "--qti-feedback-text-correct",
    correct?.textColor ?? defaultCorrect?.textColor
  );
  addIfExists(
    variables,
    "--qti-feedback-button-bg-correct",
    correct?.button?.backgroundColor ?? defaultCorrect?.button?.backgroundColor
  );
  addIfExists(
    variables,
    "--qti-feedback-button-text-correct",
    correct?.button?.textColor ?? defaultCorrect?.button?.textColor
  );

  // Correct Title (상태별 색상만 설정 가능, empty string이면 변수 생성 안 함)
  const correctTitleColor = correct?.title?.textColor ?? defaultCorrect?.title?.textColor;
  if (correctTitleColor && correctTitleColor.trim() !== "") {
    addIfExists(variables, "--qti-feedback-title-color-correct", correctTitleColor);
  }

  // Correct Description (상태별 색상만 설정 가능, empty string이면 변수 생성 안 함)
  const correctDescColor =
    correct?.description?.textColor ?? defaultCorrect?.description?.textColor;
  if (correctDescColor && correctDescColor.trim() !== "") {
    addIfExists(variables, "--qti-feedback-description-color-correct", correctDescColor);
  }

  // Correct Buttons
  if (correct?.buttons && correct.buttons.length > 0) {
    addFeedbackButtonVariables(variables, correct.buttons, "correct");
  } else {
    // 버튼이 없으면 피드백 타입별 색상 사용
    addFeedbackButtonFallback(
      variables,
      theme.submitButtonConfig ?? DEFAULT_THEME.submitButtonConfig,
      "correct",
      {
        buttonBackgroundColor:
          correct?.button?.backgroundColor ?? defaultCorrect?.button?.backgroundColor,
        buttonTextColor: correct?.button?.textColor ?? defaultCorrect?.button?.textColor,
      }
    );
  }

  // Incorrect
  const incorrect = state?.incorrect;
  const defaultIncorrect = defaultState?.incorrect;
  addIfExists(
    variables,
    "--qti-feedback-bg-incorrect",
    incorrect?.backgroundColor ?? defaultIncorrect?.backgroundColor
  );
  addIfExists(
    variables,
    "--qti-feedback-text-incorrect",
    incorrect?.textColor ?? defaultIncorrect?.textColor
  );
  addIfExists(
    variables,
    "--qti-feedback-button-bg-incorrect",
    incorrect?.button?.backgroundColor ?? defaultIncorrect?.button?.backgroundColor
  );
  addIfExists(
    variables,
    "--qti-feedback-button-text-incorrect",
    incorrect?.button?.textColor ?? defaultIncorrect?.button?.textColor
  );

  // Incorrect Title (상태별 색상만 설정 가능, empty string이면 변수 생성 안 함)
  const incorrectTitleColor = incorrect?.title?.textColor ?? defaultIncorrect?.title?.textColor;
  if (incorrectTitleColor && incorrectTitleColor.trim() !== "") {
    addIfExists(variables, "--qti-feedback-title-color-incorrect", incorrectTitleColor);
  }

  // Incorrect Description (상태별 색상만 설정 가능, empty string이면 변수 생성 안 함)
  const incorrectDescColor =
    incorrect?.description?.textColor ?? defaultIncorrect?.description?.textColor;
  if (incorrectDescColor && incorrectDescColor.trim() !== "") {
    addIfExists(variables, "--qti-feedback-description-color-incorrect", incorrectDescColor);
  }

  // Wrong Buttons
  if (incorrect?.buttons && incorrect.buttons.length > 0) {
    addFeedbackButtonVariables(variables, incorrect.buttons, "incorrect");
  } else {
    // 버튼이 없으면 피드백 타입별 색상 사용
    addFeedbackButtonFallback(
      variables,
      theme.submitButtonConfig ?? DEFAULT_THEME.submitButtonConfig,
      "incorrect",
      {
        buttonBackgroundColor:
          incorrect?.button?.backgroundColor ?? defaultIncorrect?.button?.backgroundColor,
        buttonTextColor: incorrect?.button?.textColor ?? defaultIncorrect?.button?.textColor,
      }
    );
  }

  // Explanation
  const explanation = state?.explanation;
  const defaultExplanation = defaultState?.explanation;
  addIfExists(
    variables,
    "--qti-feedback-bg-explanation",
    explanation?.backgroundColor ?? defaultExplanation?.backgroundColor
  );
  addIfExists(
    variables,
    "--qti-feedback-text-explanation",
    explanation?.textColor ?? defaultExplanation?.textColor
  );
  addIfExists(
    variables,
    "--qti-feedback-button-bg-explanation",
    explanation?.button?.backgroundColor ?? defaultExplanation?.button?.backgroundColor
  );
  addIfExists(
    variables,
    "--qti-feedback-button-text-explanation",
    explanation?.button?.textColor ?? defaultExplanation?.button?.textColor
  );

  // Explanation Title (상태별 색상만 설정 가능, empty string이면 변수 생성 안 함)
  const explanationTitleColor =
    explanation?.title?.textColor ?? defaultExplanation?.title?.textColor;
  if (explanationTitleColor && explanationTitleColor.trim() !== "") {
    addIfExists(variables, "--qti-feedback-title-color-explanation", explanationTitleColor);
  }

  // Explanation Description (상태별 색상만 설정 가능, empty string이면 변수 생성 안 함)
  const explanationDescColor =
    explanation?.description?.textColor ?? defaultExplanation?.description?.textColor;
  if (explanationDescColor && explanationDescColor.trim() !== "") {
    addIfExists(variables, "--qti-feedback-description-color-explanation", explanationDescColor);
  }

  // Explanation Buttons
  if (explanation?.buttons && explanation.buttons.length > 0) {
    addFeedbackButtonVariables(variables, explanation.buttons, "explanation");
  } else {
    // 버튼이 없으면 피드백 타입별 색상 사용
    addFeedbackButtonFallback(
      variables,
      theme.submitButtonConfig ?? DEFAULT_THEME.submitButtonConfig,
      "explanation",
      {
        buttonBackgroundColor:
          explanation?.button?.backgroundColor ?? defaultExplanation?.button?.backgroundColor,
        buttonTextColor: explanation?.button?.textColor ?? defaultExplanation?.button?.textColor,
      }
    );
  }
}

/**
 * Feedback 버튼 변수 추가
 */
function addFeedbackButtonVariables(
  variables: CSSVariables,
  buttons: ButtonStyleType[] | undefined,
  feedbackType: "correct" | "incorrect" | "explanation"
): void {
  if (!buttons || buttons.length === 0) return;

  // Primary Button (첫 번째)
  const primary = buttons[0];
  if (primary) {
    const prefix = `--qti-feedback-${feedbackType}-btn-primary`;
    const defaultCommon = DEFAULT_THEME.submitButtonConfig?.common;
    const common = primary.common ?? defaultCommon;

    // common에서 기본값 사용 (default 상태는 이제 common에 있음)
    if (common) {
      addIfExists(variables, `${prefix}-bg`, common.backgroundColor);
      addIfExists(variables, `${prefix}-border`, common.borderColor);
      addIfExists(variables, `${prefix}-text`, common.textColor);
    }
    // Hover
    const defaultHover = DEFAULT_THEME.submitButtonConfig?.state?.hover;
    const hover = primary.state?.hover ?? defaultHover;
    if (hover) {
      addIfExists(variables, `${prefix}-bg-hover`, hover.backgroundColor);
      addIfExists(variables, `${prefix}-border-hover`, hover.borderColor);
    }
  }

  // Secondary Button (두 번째)
  const secondary = buttons[1];
  if (secondary) {
    const prefix = `--qti-feedback-${feedbackType}-btn-secondary`;
    const defaultCommon = DEFAULT_THEME.submitButtonConfig?.common;
    const common = secondary.common ?? defaultCommon;

    // common에서 기본값 사용 (default 상태는 이제 common에 있음)
    if (common) {
      addIfExists(variables, `${prefix}-bg`, common.backgroundColor);
      addIfExists(variables, `${prefix}-border`, common.borderColor);
      addIfExists(variables, `${prefix}-text`, common.textColor);
    }
    // Hover
    const defaultHover = DEFAULT_THEME.submitButtonConfig?.state?.hover;
    const hover = secondary.state?.hover ?? defaultHover;
    if (hover) {
      addIfExists(variables, `${prefix}-bg-hover`, hover.backgroundColor);
      addIfExists(variables, `${prefix}-border-hover`, hover.borderColor);
    }
  }
}

/**
 * Feedback 버튼이 없을 때 피드백 타입별 색상을 사용
 */
function addFeedbackButtonFallback(
  variables: CSSVariables,
  submitButtonConfig: Theme["submitButtonConfig"] | undefined,
  feedbackType: "correct" | "incorrect" | "explanation",
  feedbackState:
    | {
        buttonBackgroundColor?: string;
        buttonTextColor?: string;
      }
    | undefined
): void {
  // submitButtonConfig가 없으면 DEFAULT_THEME 사용
  const buttonConfig = submitButtonConfig ?? DEFAULT_THEME.submitButtonConfig;
  if (!buttonConfig) return;

  const prefix = `--qti-feedback-${feedbackType}-btn-primary`;

  // 피드백 타입별 buttonBackgroundColor와 buttonTextColor 사용
  const buttonBg = feedbackState?.buttonBackgroundColor;
  const buttonText = feedbackState?.buttonTextColor || "#FFFFFF";

  if (buttonBg) {
    // Primary Button: 피드백 buttonBackgroundColor를 배경색으로 사용
    addIfExists(variables, `${prefix}-bg`, buttonBg);
    addIfExists(variables, `${prefix}-border`, buttonBg);
    addIfExists(variables, `${prefix}-text`, buttonText);

    // Hover: 색상은 그대로 유지 (CSS에서 font-weight나 scale로 효과 처리)
    // hover 색상 변수는 설정하지 않아서 CSS에서 fallback으로 동일 색상 사용
  } else {
    // borderColor가 없으면 submitButtonConfig의 common 사용 (default 상태는 이제 common에 있음)
    const defaultCommon = DEFAULT_THEME.submitButtonConfig?.common;
    const common = buttonConfig.common ?? defaultCommon;
    if (common) {
      addIfExists(variables, `${prefix}-bg`, common.backgroundColor);
      addIfExists(variables, `${prefix}-border`, common.borderColor);
      addIfExists(variables, `${prefix}-text`, common.textColor);
    }
    // Hover
    const defaultHover = DEFAULT_THEME.submitButtonConfig?.state?.hover;
    const hover = buttonConfig.state?.hover ?? defaultHover;
    if (hover) {
      addIfExists(variables, `${prefix}-bg-hover`, hover.backgroundColor);
      addIfExists(variables, `${prefix}-border-hover`, hover.borderColor);
    }
  }
}

/**
 * 값이 존재하면 변수 추가
 */
function addIfExists(variables: CSSVariables, key: string, value: string | undefined): void {
  if (value !== undefined && value !== "") {
    variables[key] = value;
  }
}
