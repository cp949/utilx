import { expect, INSECURE_ORIGIN, test } from "../fixtures.js";

const COPIED_TEXT = "복사한 텍스트";

test.describe("copyTextToClipboard: 보안 컨텍스트(localhost 계열)", () => {
  test.describe("권한 허용", () => {
    test.use({ permissionMode: "granted" });

    test("클릭으로 호출하면 true를 돌려주고 클립보드에 쓴다", async ({
      openHarness,
    }) => {
      const page = await openHarness();
      expect(await page.evaluate(() => isSecureContext)).toBe(true);

      await page.click("#copy");

      await expect(page.locator("#copy-result")).toHaveText("true");
      expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(
        COPIED_TEXT,
      );
    });
  });

  test.describe("권한 거부", () => {
    test.use({ permissionMode: "denied" });

    test("클릭으로 호출해도 false를 돌려주고 예외를 던지지 않는다", async ({
      openHarness,
    }) => {
      const page = await openHarness();
      expect(await page.evaluate(() => isSecureContext)).toBe(true);

      await page.click("#copy");

      await expect(page.locator("#copy-result")).toHaveText("false");
    });
  });
});

test.describe("copyTextToClipboard: 비보안 컨텍스트", () => {
  test.use({ permissionMode: "granted" });

  test("http 비-localhost origin에서는 navigator.clipboard가 없어 false를 돌려준다", async ({
    openHarness,
  }) => {
    const page = await openHarness(INSECURE_ORIGIN);
    expect(await page.evaluate(() => isSecureContext)).toBe(false);
    expect(await page.evaluate(() => typeof navigator.clipboard)).toBe(
      "undefined",
    );

    await page.click("#copy");

    await expect(page.locator("#copy-result")).toHaveText("false");
  });
});
