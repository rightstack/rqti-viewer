import type { MathLevel } from "../math-keyboard/mathLevels";

export function resolveMathKeyboardLevel(element: Element): MathLevel | null {
  if (element.getAttribute("data-is-math") !== "true") return null;
  const school = element.getAttribute("data-school-level");
  if (school === "m") return "middle";
  // TODO: 고등 추가 시 주석 제거 및 고등 키보드 구현 후 주석 제거
  // if (school === "h") return "high";
  return null;
}
