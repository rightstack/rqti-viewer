/**
 * MathJax 중첩 재조판 크래시 회귀 하네스.
 *
 * 실제 뷰어 코드 경로(MathJaxProviderWrapper + parseFeedbackContentToReact → renderLaTeX의
 * `<MathJax dynamic>`)로 수식을 렌더하고, 수업보드의 presence 리렌더를 모사해 부모를 N회
 * 리렌더한다. 각 사이클마다 수식 호스트의 DOM 깊이/노드 수를 측정해 `window.__crash`에 쌓는다.
 *
 * 핵심 조치(src=tex-chtml.js)가 적용돼 있으면 깊이가 고정된다. 설정이 유실돼 tex-mml-chtml가
 * 로드되면 깊이가 사이클마다 선형 증가하고, Playwright 스펙이 이를 잡아 실패시킨다.
 */
import { useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import "@rightstack/rqti-viewer/styles.css";
import { MathJaxProviderWrapper, parseFeedbackContentToReact } from "@rightstack/rqti-viewer";

const TOTAL_CYCLES = 24;
const SETTLE_MS = 350;

// 수식 여러 개(인라인 + 블록). 내용은 매 사이클 동일 — 그래도 dynamic이면 매번 재조판된다.
const LATEX_HTML = [
  "<p>인라인 $\\frac{a+b}{c^2}$ 와 $\\sqrt{x^2+1}$ 그리고 $\\sum_{k=1}^{n} k^2$</p>",
  "<p>블록 $$\\frac{1}{2}\\int_0^1 x^2\\,dx = \\frac{1}{6}$$</p>",
  "<p>행렬 $$\\begin{pmatrix} a & b \\\\ c & d \\end{pmatrix}$$</p>",
].join("");

type Sample = { cycle: number; depth: number; nodes: number };

declare global {
  interface Window {
    __crash?: { samples: Sample[]; done: boolean; total: number };
    MathJax?: { startup?: { promise?: Promise<unknown> } };
  }
}

const sleep = (ms: number) => new Promise<void>((r) => window.setTimeout(r, ms));

function measure(host: Element): { depth: number; nodes: number } {
  let max = 0;
  const walk = (node: Element, depth: number) => {
    if (depth > max) max = depth;
    for (const child of Array.from(node.children)) walk(child, depth + 1);
  };
  walk(host, 1);
  return { depth: max, nodes: host.querySelectorAll("*").length };
}

function Harness() {
  const [cycle, setCycle] = useState(0);
  const startedRef = useRef(false);

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;

    const state: NonNullable<Window["__crash"]> = {
      samples: [],
      done: false,
      total: TOTAL_CYCLES,
    };
    window.__crash = state;

    const run = async () => {
      // MathJax 로드 대기(provider가 window.MathJax를 세운다)
      for (let i = 0; i < 150 && !window.MathJax?.startup?.promise; i++) {
        await sleep(100);
      }
      if (window.MathJax?.startup?.promise) {
        await window.MathJax.startup.promise;
      }
      await sleep(800); // 최초 조판 안정화

      const host = document.getElementById("formula-host");
      if (!host) {
        state.done = true;
        return;
      }

      state.samples.push({ cycle: 0, ...measure(host) });
      for (let c = 1; c <= TOTAL_CYCLES; c++) {
        setCycle(c);
        await sleep(SETTLE_MS);
        state.samples.push({ cycle: c, ...measure(host) });
      }
      state.done = true;
    };

    void run();
  }, []);

  return (
    <MathJaxProviderWrapper>
      {/* data-cycle 변경으로 부모가 리렌더되고, parseFeedbackContentToReact가 매번 재호출되어
          dynamic MathJax가 재조판된다 (presence 5초 리렌더 모사). */}
      <div id="formula-host" className="rqti-viewer" data-cycle={cycle}>
        {parseFeedbackContentToReact(LATEX_HTML)}
      </div>
    </MathJaxProviderWrapper>
  );
}

// StrictMode 미사용: 측정 루프가 이펙트에서 한 번만 돌도록 보장(이중 호출 방지).
createRoot(document.getElementById("root")!).render(<Harness />);
