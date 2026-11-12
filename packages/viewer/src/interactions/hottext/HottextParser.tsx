import type { QTIParserOptions } from "../../types";
import { HottextInteraction } from "./HottextInteraction";

export const parseHottextInteraction = (
  element: Element,
  options: QTIParserOptions,
  index: number
) => <HottextInteraction element={element} options={options} index={index} />;
