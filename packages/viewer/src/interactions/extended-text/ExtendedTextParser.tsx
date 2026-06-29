import React from "react";
import type { QTIParserOptions } from "../../types";
import { ExtendedTextInteraction } from "./ExtendedTextInteraction";

export const parseExtendedTextInteraction = (
  element: Element,
  options: QTIParserOptions,
  index: number
): React.ReactElement => (
  <ExtendedTextInteraction element={element} options={options} index={index} />
);
