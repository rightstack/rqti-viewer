import { expect, test, type Page } from "@playwright/test";

async function callCount(page: Page) {
  return page.evaluate(() => window.__onResponse?.count ?? -1);
}

test.describe("답 복원 onResponse", () => {
  test("저장된 답을 넘기거나 미리보기로 바꿔도 콜백이 반복 호출되지 않는다", async ({ page }) => {
    await page.goto("/on-response.html");

    const field = page.getByRole("textbox", { name: "ANSWER 입력" });
    await expect(field).toHaveValue("3");
    expect(await callCount(page)).toBe(0);

    await page.waitForTimeout(800);
    expect(await callCount(page)).toBe(0);

    await page.locator("#rerender").click();
    await page.locator("#to-preview").click();
    await expect(field).toHaveValue("3");
    await page.locator("#rerender").click();
    await page.waitForTimeout(400);
    expect(await callCount(page)).toBe(0);

    await page.locator("#to-practice").click();
    await field.fill("4");
    await expect.poll(() => callCount(page)).toBe(1);
    await page.waitForTimeout(400);
    expect(await callCount(page)).toBe(1);

    await page.locator("#to-preview").click();
    await page.locator("#rerender").click();
    await expect(field).toHaveValue("4");
    await page.waitForTimeout(400);
    expect(await callCount(page)).toBe(1);
  });
});
