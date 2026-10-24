import { test, expect } from "@playwright/test";
test("작품 생성, 레이어 편집, 저장 복원 및 PNG 내보내기", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "오늘은 어떤 영감을 담아볼까요?" }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "새 작품 만들기", exact: true })
    .click();
  await page.getByPlaceholder("이름 없는 작품").fill("나의 첫 작품");
  await page.getByRole("button", { name: "캔버스 열기" }).click();
  await page.getByRole("button", { name: "텍스트 추가" }).click();
  await expect(page.getByLabel("글자 크기")).toBeVisible();
  await page.getByLabel("글자 크기").fill("64");
  await page.getByRole("button", { name: "도형 추가" }).click();
  await expect(page.locator(".layer")).toHaveCount(2);
  await page.getByRole("button", { name: "실행 취소" }).click();
  await expect(page.locator(".layer")).toHaveCount(1);
  await page.getByRole("button", { name: "다시 실행" }).click();
  await expect(page.locator(".layer")).toHaveCount(2);
  const png = Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aOuoAAAAASUVORK5CYII=",
    "base64",
  );
  await page
    .locator(".tool-panel input[type=file]")
    .setInputFiles({ name: "logo.png", mimeType: "image/png", buffer: png });
  await expect(page.locator(".layer")).toHaveCount(3);
  await page.getByRole("button", { name: "작품 저장", exact: true }).click();
  await expect(page.getByRole("status")).toContainText("저장했습니다");
  await page.reload();
  await page.getByRole("button", { name: "나의 첫 작품", exact: true }).click();
  await expect(page.locator(".layer")).toHaveCount(3);
  const dl = page.waitForEvent("download");
  await page.getByRole("button", { name: "PNG 내보내기" }).click();
  const download = await dl;
  expect(download.suggestedFilename()).toBe("나의 첫 작품.png");
  const path = await download.path();
  const fs = await import("node:fs/promises");
  const buffer = await fs.readFile(path!);
  expect(buffer.readUInt32BE(16)).toBe(1200);
  expect(buffer.readUInt32BE(20)).toBe(630);
  expect(errors).toEqual([]);
});
test("메모 유지, 갤러리 즐겨찾기·복제와 백업 복원", async ({ page }) => {
  await page.goto("/");
  await page.getByLabel("영감 노트").fill("빛과 나무의 온기");
  await page.reload();
  await expect(page.getByLabel("영감 노트")).toHaveValue("빛과 나무의 온기");
  await page
    .getByRole("button", { name: "새 작품 만들기", exact: true })
    .click();
  await page.getByPlaceholder("이름 없는 작품").fill("봄 포스터");
  await page.getByRole("button", { name: /A4 세로/ }).click();
  await page.getByRole("button", { name: "캔버스 열기" }).click();
  await page.getByRole("button", { name: "텍스트 추가" }).click();
  await page.getByRole("button", { name: "작품 저장", exact: true }).click();
  await expect(page.getByRole("status")).toContainText("저장했습니다");
  await page.getByRole("button", { name: "작업실로 돌아가기" }).click();
  await page.getByRole("button", { name: "나의 갤러리", exact: true }).click();
  await page.getByRole("button", { name: "봄 포스터 즐겨찾기" }).click();
  await page.getByRole("button", { name: "즐겨찾기만 보기" }).click();
  await expect(page.locator(".project-card")).toHaveCount(1);
  await page.getByRole("button", { name: "봄 포스터 복제" }).click();
  await expect(page.locator(".project-card")).toHaveCount(2);
  const dl = page.waitForEvent("download");
  await page.getByRole("button", { name: "작업실 백업", exact: true }).click();
  const path = await (await dl).path();
  page.on("dialog", (d) => d.accept());
  await page
    .getByRole("button", { name: "봄 포스터 · 사본 삭제", exact: true })
    .click();
  await expect(page.locator(".project-card")).toHaveCount(1);
  await page.locator(".sidebar input[type=file]").setInputFiles(path!);
  await expect(page.locator(".project-card")).toHaveCount(2);
});
test("작업실은 작은 화면에서도 사용 가능", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "오늘은 어떤 영감을 담아볼까요?" }),
  ).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(
    390,
  );
  await page.getByRole("button", { name: "메뉴", exact: true }).click();
  await page.getByRole("button", { name: "나의 갤러리", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "나의 갤러리", exact: true }),
  ).toBeVisible();
});

test("텍스트 속성만 수정해도 도형·배경의 원본 속성은 보존된다", async ({
  page,
}) => {
  await page.goto("/");
  await page
    .getByRole("button", { name: "새 작품 만들기", exact: true })
    .click();
  await page.getByRole("button", { name: "캔버스 열기" }).click();
  await page.getByRole("button", { name: "도형 추가" }).click();
  await page.getByRole("button", { name: "텍스트 추가" }).click();
  await page.getByRole("button", { name: "작품 저장", exact: true }).click();
  await expect(page.getByRole("status")).toContainText("저장했습니다");
  const read = () =>
    page.evaluate(async () => {
      const request = indexedDB.open("my-atelier", 1);
      const db = await new Promise<IDBDatabase>((resolve, reject) => {
        request.onsuccess = () => resolve(request.result);
        request.onerror = reject;
      });
      const req = db.transaction("projects").objectStore("projects").getAll();
      return new Promise<any[]>((resolve, reject) => {
        req.onsuccess = () => resolve(req.result);
        req.onerror = reject;
      });
    });
  const before = (await read())[0];
  await page.getByLabel("글자 크기").fill("72");
  await page.getByLabel("자간").fill("100");
  await page.getByLabel("요소 색상").fill("#445533");
  await page.getByRole("button", { name: "작품 저장", exact: true }).click();
  await expect(page.getByRole("status")).toContainText("저장했습니다");
  const after = (await read())[0];
  expect(after.canvas.objects[0]).toEqual(before.canvas.objects[0]);
  expect(after.background).toBe(before.background);
  expect(after.canvas.objects[1].fontSize).toBe(72);
  expect(after.canvas.objects[1].charSpacing).toBe(100);
  expect(after.canvas.objects[1].fill).toBe("#445533");
});

test("저장 전 메뉴 이동에는 확인이 필요하다", async ({ page }) => {
  await page.goto("/");
  await page
    .getByRole("button", { name: "새 작품 만들기", exact: true })
    .click();
  await page.getByRole("button", { name: "캔버스 열기" }).click();
  await page.getByRole("button", { name: "텍스트 추가" }).click();
  page.once("dialog", (d) => d.dismiss());
  await page.getByRole("button", { name: "나의 갤러리", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "작품 저장", exact: true }),
  ).toBeVisible();
  await expect(page.locator(".layer")).toHaveCount(1);
});
