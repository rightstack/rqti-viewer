import { type ComponentProps, createContext, useContext, useEffect, useState } from "react";
import { MathJax, MathJaxContext } from "better-react-mathjax";

/**
 * MathJax 번들 소스. `src`를 지정하지 않으면 better-react-mathjax 기본값인
 * `tex-mml-chtml.js`(MathML 입력 처리기 포함)가 로드된다. 이 경우 dynamic 재조판 시
 * 이전 출력의 `<mjx-assistive-mml>` 안 MathML을 새 입력으로 재인식해 출력이 중첩되고,
 * DOM 깊이가 선형 증가하다 Blink 스택을 넘겨 탭이 STATUS_STACK_OVERFLOW로 크래시한다.
 * 뷰어는 TeX 입력만 쓰므로 `tex-chtml.js`로 고정한다(MathML 입력만 빠지고 기능 손실 없음,
 * 스크린리더용 보조 MathML 출력은 유지). 호스트/버전은 기존 기본값과 동일한 cdnjs 3.2.2.
 * 주의: 이 설정이 빠지면 크래시가 재발하므로 가드 테스트로 보호한다.
 */
export const MATHJAX_SRC =
  "https://cdnjs.cloudflare.com/ajax/libs/mathjax/3.2.2/es5/tex-chtml.js";

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
    load: [
      "input/tex",
      "output/chtml",
      "[tex]/cancel",
      "[tex]/ams",
      "[tex]/color",
      "[tex]/html",
      "[tex]/unicode",
    ],
  },
  tex: {
    packages: { "[+]": ["base", "ams", "cancel", "color", "html", "unicode"] },
    inlineMath: [["\\(", "\\)"]],
    displayMath: [["\\[", "\\]"]],
    macros: {
      sim: "\\mathrel{\\unicode{x223D}}",
      neg: "\\unicode{xFF5E}",
      // MathLive 키와 같은 평행 기호. ams에는 \sslash가 없어 키 라벨이 명령 그대로 남는다.
      sslash: "\\mathord{\\mkern0mu\\raise{0.1em}\\hbox{$/\\mkern-6mu/$}\\mkern0mu}",
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
    <MathJaxContext version={3} config={mathJaxConfig} src={MATHJAX_SRC}>
      <MathJaxTextFontReadyContext.Provider value={isTextFontReady}>
        {children}
      </MathJaxTextFontReadyContext.Provider>
    </MathJaxContext>
  );
}
