# Changelog

## Unreleased

<!-- 다음 버전 릴리스 시 다른 변경사항과 함께 버전 번호를 부여한다. -->

### Fixed

- MathJax 수식 중첩 재조판으로 인한 브라우저 크래시(`STATUS_STACK_OVERFLOW`) 수정.
  - `MathJaxContext`에 `src`가 지정되지 않아 기본 번들 `tex-mml-chtml.js`(MathML 입력 처리기 포함)가
    로드되던 문제. `dynamic` 재조판 시 이전 출력의 `<mjx-assistive-mml>` 안 MathML을 새 입력으로
    재인식해 출력이 중첩되고, DOM 깊이가 선형 증가하다 Blink 렌더러 스택을 넘겨 탭이 크래시했다.
    (수업보드처럼 presence로 5초마다 리렌더되는 화면에서 약 1시간 후 발생)
  - 뷰어는 TeX 입력만 사용하므로 `src`를 `tex-chtml.js`(cdnjs 3.2.2)로 고정. MathML 입력만 빠지고
    기능 손실은 없으며, 스크린리더용 보조 MathML 출력(assistive-mml)은 그대로 유지된다.
  - 재발 방지: `MATHJAX_SRC` 상수를 검증하는 가드 단위 테스트(vitest)와 리렌더 반복 시 DOM 깊이가
    증가하지 않는지 확인하는 E2E 크래시 회귀 테스트(Playwright)를 추가.

### Note

- 내용이 바뀌지 않는 수식의 `dynamic` 비활성화(불필요 재조판 감소)는 사이징 회귀 리스크가 있어
  별도 작업으로 분리한다. 본 릴리스에는 포함하지 않는다.
