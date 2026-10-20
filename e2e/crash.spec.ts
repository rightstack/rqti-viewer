import { expect, test } from "@playwright/test";

type Sample = { cycle: number; depth: number; nodes: number };

declare global {
  interface Window {
    __crash?: { samples: Sample[]; done: boolean; total: number };
  }
}

/**
 * 재현 HTML의 #out 텍스트("RESULT\ncycleN {json}...")를 파싱해 사이클별 깊이/노드로 변환.
 */
function parseReproOutput(text: string): Sample[] {
  const samples: Sample[] = [];
  const re = /cycle(\d+)\s+(\{[^}]*\})/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) {
    const parsed = JSON.parse(m[2]) as { depth: number; nodes: number };
    samples.push({ cycle: Number(m[1]), depth: parsed.depth, nodes: parsed.nodes });
  }
  return samples;
}

test.describe("MathJax 중첩 재조판 크래시 회귀", () => {
  test("실제 뷰어 경로: 리렌더를 반복해도 DOM 깊이가 증가하지 않는다", async ({ page }) => {
    await page.goto("/crash-test.html");

    // 하네스가 사이클을 모두 돌 때까지 대기
    await page.waitForFunction(() => window.__crash?.done === true, undefined, {
      timeout: 90_000,
    });

    const samples = (await page.evaluate(() => window.__crash?.samples ?? [])) as Sample[];
    expect(samples.length).toBeGreaterThan(5);

    const depths = samples.map((s) => s.depth);
    const first = samples[0];
    const last = samples[samples.length - 1];

    // 실제로 수식이 렌더되었는지(얕은 빈 DOM이 아닌지) 확인
    expect(first.depth).toBeGreaterThan(4);

    // 핵심 단언: 깊이 변동 폭이 미미해야 한다. tex-mml-chtml로 회귀하면 사이클당 +2씩 선형 증가.
    const spread = Math.max(...depths) - Math.min(...depths);
    expect(
      spread,
      `깊이가 증가함(중첩 재조판 의심). samples=${JSON.stringify(samples)}`
    ).toBeLessThanOrEqual(2);

    // 노드 수도 폭증하지 않아야 한다.
    expect(last.nodes).toBeLessThan(first.nodes * 1.5);
  });

  test("골든 재현: 02-fix-tex-chtml 은 깊이 고정, 01-current-BROKEN 은 깊이 증가", async ({
    page,
  }) => {
    // 수정본: 깊이 고정
    await page.goto("/crash-repro/02-fix-tex-chtml-OK.html");
    await expect(page.locator("#out")).toContainText("RESULT", { timeout: 60_000 });
    const okText = (await page.locator("#out").textContent()) ?? "";
    const okSamples = parseReproOutput(okText);
    expect(okSamples.length).toBeGreaterThan(2);
    const okDepths = okSamples.map((s) => s.depth);
    expect(Math.max(...okDepths) - Math.min(...okDepths)).toBeLessThanOrEqual(1);

    // 현재(버그)본: 깊이 증가 — 버그 메커니즘이 유효함을 문서화/고정
    await page.goto("/crash-repro/01-current-BROKEN.html");
    await expect(page.locator("#out")).toContainText("RESULT", { timeout: 60_000 });
    const brokenText = (await page.locator("#out").textContent()) ?? "";
    const brokenSamples = parseReproOutput(brokenText);
    expect(brokenSamples.length).toBeGreaterThan(2);
    const brokenLast = brokenSamples[brokenSamples.length - 1];
    const brokenFirst = brokenSamples[0];
    expect(
      brokenLast.depth,
      `tex-mml-chtml는 깊이가 증가해야 함. samples=${JSON.stringify(brokenSamples)}`
    ).toBeGreaterThan(brokenFirst.depth);
  });
});
