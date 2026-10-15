import type { MathLevel } from "../math-keyboard/mathLevels";

/** `data-school-level`. `m`만 중학교 키보드. */
export function resolveSchoolLevel(element: Element): MathLevel | null {
  const school = element.getAttribute("data-school-level");
  if (school === "m") return "middle";
  // TODO: 고등 추가 시 주석 제거 및 고등 키보드 구현 후 주석 제거
  // if (school === "h") return "high";
  return null;
}

/** 단답·수식 빈칸. interaction 자신의 `data-is-math`와 학교급을 함께 본다. */
export function resolveMathKeyboardLevel(element: Element): MathLevel | null {
  if (element.getAttribute("data-is-math") !== "true") return null;
  return resolveSchoolLevel(element);
}
