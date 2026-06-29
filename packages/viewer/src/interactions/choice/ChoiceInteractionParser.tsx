import React from "react";
import type { QTIParserOptions } from "../../types";
import { ChoiceInteraction } from "./ChoiceInteraction";

export const parseChoiceInteraction = (
  element: Element,
  options: QTIParserOptions,
  index: number
): React.ReactElement => <ChoiceInteraction element={element} options={options} index={index} />;
