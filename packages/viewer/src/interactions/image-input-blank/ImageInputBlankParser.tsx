import type { QTIParserOptions } from "../../types";
import { ImageInputBlankInteraction } from "./ImageInputBlankInteraction";
import { isImageInputBlankPci } from "./utils";

export const parseImageInputBlankInteraction = (
  element: Element,
  options: QTIParserOptions,
  index: number
) => {
  if (!isImageInputBlankPci(element)) return null;

  return <ImageInputBlankInteraction element={element} options={options} index={index} />;
};
