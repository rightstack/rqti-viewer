import { createContext, useContext } from "react";

export const MathJaxTextFontReadyContext = createContext(false);

export function useMathJaxTextFontReady(): boolean {
  return useContext(MathJaxTextFontReadyContext);
}
