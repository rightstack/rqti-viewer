import React from "react";
import type { QTIParserOptions } from "../../types";
import { TextEntryInteraction } from "./TextEntryInteraction";

export const parseTextEntryInteraction = (
  element: Element,
  options: QTIParserOptions,
  index: number
): React.ReactElement => <TextEntryInteraction element={element} options={options} index={index} />;
