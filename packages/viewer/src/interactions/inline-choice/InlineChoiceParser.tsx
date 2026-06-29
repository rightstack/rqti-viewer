import React from "react";
import type { QTIParserOptions } from "../../types";
import { InlineChoiceInteraction } from "./InlineChoiceInteraction";

export const parseInlineChoiceInteraction = (
  element: Element,
  options: QTIParserOptions,
  index: number
): React.ReactElement => (
  <InlineChoiceInteraction element={element} options={options} index={index} />
);
