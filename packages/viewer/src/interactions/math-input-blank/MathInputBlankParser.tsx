import type { QTIParserOptions } from "../../types";
import { MathInputBlankInteraction } from "./MathInputBlankInteraction";
import { MATH_INPUT_BLANK_TYPE } from "./utils";

export const parseMathInputBlankInteraction = (
  element: Element,
  options: QTIParserOptions,
  index: number
) => {
  const typeId = element.getAttribute("custom-interaction-type-identifier") ?? "";
  if (typeId !== MATH_INPUT_BLANK_TYPE) return null;

  return <MathInputBlankInteraction element={element} options={options} index={index} />;
};
