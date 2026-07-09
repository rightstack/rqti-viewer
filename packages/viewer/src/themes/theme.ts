import type { Theme } from "../types";
import { DALDAL_THEME } from "./daldalTheme";
import { DEFAULT_THEME } from "./defaultTheme";
import { DUOLINGO_THEME } from "./duolingoTheme";

export { DEFAULT_THEME, DUOLINGO_THEME, DALDAL_THEME };

export const ALL_THEMES: Theme[] = [DEFAULT_THEME, DUOLINGO_THEME, DALDAL_THEME];

export const THEMES = ALL_THEMES;

export const DEFAULT_THEME_ID = "default";

export const THEME_MAP = {
  default: DEFAULT_THEME,
  duolingo: DUOLINGO_THEME,
  daldal: DALDAL_THEME,
} as const;
