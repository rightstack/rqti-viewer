import React from "react";
import type { QTIParserOptions } from "../../types";
import { GapMatchInteraction } from "./GapMatchInteraction";

/**
 * GapMatchParser
 * 역할: qti-gap-match-interaction 파싱
 * - SAX 방식으로 HTML과 gap을 섞어서 처리
 * - element의 자식 노드를 순회하면서 HTML 요소와 qti-gap을 섞어서 처리
 */
export const parseGapMatchInteraction = (
  element: Element,
  options: QTIParserOptions,
  index: number
): React.ReactElement => <GapMatchInteraction element={element} options={options} index={index} />;
