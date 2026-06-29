import React from "react";
import type { QTIParserOptions } from "../../types";
import { MatchInteraction } from "./MatchInteraction";

export const parseMatchInteraction = (
  element: Element,
  options: QTIParserOptions,
  index: number
): React.ReactElement => <MatchInteraction element={element} options={options} index={index} />;
