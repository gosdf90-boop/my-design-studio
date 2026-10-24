import { test, expect } from "@playwright/test";
test("18개 형식 분류·검색 및 별도 프로젝트 생성·저장·복원", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  await page.getByRole("button", { name: "템플릿 서랍", exact: true }).click();
  await expect(page.locator(".template-card")).toHaveCount(18);
  await page.getByRole("button", { name: "홍보물", exact: true }).click();
  await expect(page.locator(".template-card")).toHaveCount(6);
  await page.getByRole("button", { name: "블로그", exact: true }).click();
  await expect(page.locator(".template-card")).toHaveCount(5);
  await page.getByRole("button", { name: "전체", exact: true }).click();
  await page.getByLabel("템플릿 검색").fill("휴진");
  await expect(page.locator(".template-card")).toHaveCount(1);
  await page.getByRole("button", { name: "한의원 휴진 안내 사용하기" }).click();
  await expect(page.locator(".layer")).toHaveCount(6);
  await page.getByRole("button", { name: "작품 저장", exact: true }).click();
  await expect(page.getByRole("status")).toContainText("저장했습니다");
  await page.reload();
  await page
    .getByRole("button", { name: "한의원 휴진 안내", exact: true })
    .click();
  await expect(page.locator(".layer")).toHaveCount(6);
  await page.getByRole("button", { name: "작업실로 돌아가기" }).click();
  await page.getByRole("button", { name: "템플릿 서랍", exact: true }).click();
  await page.getByRole("button", { name: "한의원 휴진 안내 사용하기" }).click();
  await page.getByRole("button", { name: "작품 저장", exact: true }).click();
  await expect(page.getByRole("status")).toContainText("저장했습니다");
  await page.getByRole("button", { name: "작업실로 돌아가기" }).click();
  await expect(page.locator(".project-card")).toHaveCount(2);
  expect(errors).toEqual([]);
});
test("모든 템플릿이 실제 레이어로 열리고 PNG로 내보내진다", async ({
  page,
}) => {
  test.setTimeout(90000);
  await page.goto("/");
  await page.getByRole("button", { name: "템플릿 서랍", exact: true }).click();
  const names = await page.locator(".template-card h2").allTextContents();
  for (const name of names) {
    await page
      .getByRole("button", { name: `${name} 사용하기`, exact: true })
      .click();
    await expect(page.locator(".layer").first()).toBeVisible();
    const dl = page.waitForEvent("download");
    await page.getByRole("button", { name: "PNG 내보내기" }).click();
    const d = await dl;
    expect(d.suggestedFilename()).toBe(name + ".png");
    await page
      .getByRole("button", { name: "템플릿 서랍", exact: true })
      .click();
  }
  await expect(page.locator(".template-card")).toHaveCount(18);
});
