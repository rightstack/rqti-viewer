import { defineConfig, devices } from "@playwright/test";

/**
 * MathJax 크래시 회귀 E2E.
 *
 * webServer는 viewer를 먼저 빌드(dist에 src 수정 반영)한 뒤 playground dev 서버를 띄운다.
 * (playground vite는 viewer를 optimizeDeps에서 제외하고 dist를 직접 서빙하므로 선빌드 필요)
 */
export default defineConfig({
  testDir: "./e2e",
  timeout: 120_000,
  expect: { timeout: 60_000 },
  fullyParallel: false,
  reporter: [["list"]],
  use: {
    baseURL: "http://localhost:5173",
    headless: true,
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    command: "pnpm --filter @rightstack/rqti-viewer build && pnpm --filter playground dev",
    url: "http://localhost:5173/crash-test.html",
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
});
