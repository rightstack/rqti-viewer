import React from "react";
import type { QTIParserOptions } from "../../types";
import { UploadInteraction } from "./UploadInteraction";

export const parseUploadInteraction = (
  element: Element,
  options: QTIParserOptions,
  index: number
): React.ReactElement => <UploadInteraction element={element} options={options} index={index} />;
