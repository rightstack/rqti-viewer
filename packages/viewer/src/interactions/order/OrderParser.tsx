import React from "react";
import type { QTIParserOptions } from "../../types";
import { OrderInteraction } from "./OrderInteraction";

export const parseOrderInteraction = (
  element: Element,
  options: QTIParserOptions,
  index: number
): React.ReactElement => <OrderInteraction element={element} options={options} index={index} />;
