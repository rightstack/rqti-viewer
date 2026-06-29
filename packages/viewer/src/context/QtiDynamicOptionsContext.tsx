import { createContext, useContext, useMemo } from "react";
import type { QTIParserOptions } from "../types";

/** 파싱 결과(element)와 분리해 매 렌더 갱신되는 인터랙션 상태(응답·제출·콜백 등) */
export type QtiDynamicParserSlice = Partial<
  Pick<
    QTIParserOptions,
    | "responses"
    | "correctAnswers"
    | "isSubmit"
    | "submitResponse"
    | "onResponseChange"
    | "gapSelections"
    | "focusedGapIndex"
    | "usedChoices"
    | "onGapOptionClick"
    | "onGapClick"
    | "submitAnswers"
  >
>;

const QtiDynamicOptionsContext = createContext<QtiDynamicParserSlice | null>(null);

export const QtiDynamicOptionsProvider = QtiDynamicOptionsContext.Provider;

export function useMergedQtiOptions<O extends QTIParserOptions>(staticPart: O): O {
  const dynamic = useContext(QtiDynamicOptionsContext);
  return useMemo(() => {
    if (!dynamic) return staticPart;
    return { ...staticPart, ...dynamic } as O;
  }, [staticPart, dynamic]);
}
