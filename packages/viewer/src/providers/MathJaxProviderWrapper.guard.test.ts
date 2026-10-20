import { describe, expect, it } from "vitest";
import { MATHJAX_SRC } from "./MathJaxProviderWrapper";

/**
 * 크래시 재발 방지 가드.
 *
 * MathJaxContext가 `tex-mml-chtml.js`(MathML 입력 포함) 번들을 로드하면 dynamic 재조판 시
 * 출력이 중첩되어 1시간 내 STATUS_STACK_OVERFLOW로 탭이 죽는다. 반드시 `tex-chtml.js`를
 * 명시해야 한다. mqti-frontend → rqti-viewer 수동 sync 등으로 이 설정이 유실되면
 * 이 테스트가 CI에서 즉시 실패해 재발을 막는다.
 */
describe("MATHJAX_SRC (crash regression guard)", () => {
  it("tex-chtml.js 번들을 가리킨다", () => {
    expect(MATHJAX_SRC).toMatch(/\/tex-chtml\.js$/);
  });

  it("MathML 입력 처리기를 포함하는 tex-mml-chtml 번들을 쓰지 않는다", () => {
    expect(MATHJAX_SRC).not.toContain("tex-mml-chtml");
  });

  it("better-react-mathjax 기본값과 동일한 cdnjs MathJax 3.2.2 경로를 쓴다(호스트/버전 드리프트 방지)", () => {
    expect(MATHJAX_SRC).toBe(
      "https://cdnjs.cloudflare.com/ajax/libs/mathjax/3.2.2/es5/tex-chtml.js"
    );
  });
});
