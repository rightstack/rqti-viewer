import type { QTIParserOptions } from "../../types";
import { HotspotInteraction } from "./HotspotInteraction";

export const parseHotspotInteraction = (
  element: Element,
  options: QTIParserOptions,
  index: number
) => <HotspotInteraction element={element} options={options} index={index} />;
