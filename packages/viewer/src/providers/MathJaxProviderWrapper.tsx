import { type ComponentProps, createContext, useContext, useEffect, useState } from "react";
import { MathJax, MathJaxContext } from "better-react-mathjax";

const MATHJAX_TEXT_FONT = '400 1em "Noto Serif KR"';
const MathJaxTextFontReadyContext = createContext(false);

const commonOutputOptions = {
  scale: 1,
  minScale: 0.5,
  mtextInheritFont: false,
  merrorInheritFont: true,
  mtextFont: '"Noto Serif KR", serif',
  unknownFamily: '"Noto Serif KR", serif',
  mathmlSpacing: false,
  displayAlign: "center",
};

const mathJaxConfig = {
  loader: {
    load: ["input/tex", "output/chtml", "[tex]/cancel", "[tex]/ams", "[tex]/html", "[tex]/unicode"],
  },
  tex: {
    packages: { "[+]": ["base", "ams", "cancel", "html", "unicode"] },
    inlineMath: [["\\(", "\\)"]],
    displayMath: [["\\[", "\\]"]],
    macros: {
      sim: "\\unicode{x223D}", // ∽ 둥근 닮음 기호
      neg: "\\unicode{xFF5E}", // ～ (전각 틸드)
    },
  },
  chtml: {
    ...commonOutputOptions,
    matchFontHeight: false,
  },
  svg: {
    ...commonOutputOptions,
  },
  options: {
    enableMenu: false,
  },
};

export function MathJaxWithTextFont(props: ComponentProps<typeof MathJax>) {
  const isTextFontReady = useContext(MathJaxTextFontReadyContext);
  if (!isTextFontReady) return null;
  return <MathJax {...props} />;
}

export function MathJaxProviderWrapper({ children }: { children: React.ReactNode }) {
  const [isTextFontReady, setIsTextFontReady] = useState(false);

  useEffect(() => {
    let active = true;

    const waitForTextFont = async () => {
      if (document.fonts) {
        await document.fonts.load(MATHJAX_TEXT_FONT);
        await document.fonts.ready;
      }
    };

    void waitForTextFont().finally(() => {
      if (active) setIsTextFontReady(true);
    });

    return () => {
      active = false;
    };
  }, []);

  return (
    <MathJaxContext version={3} config={mathJaxConfig}>
      <MathJaxTextFontReadyContext.Provider value={isTextFontReady}>
        {children}
      </MathJaxTextFontReadyContext.Provider>
    </MathJaxContext>
  );
}
