import type { Page } from "@playwright/test";
import { expect, test } from "../fixtures.js";

/** `downloadBlob`이 object URL을 해제하기까지 기다리는 시간(ms). 소스의 `REVOKE_DELAY_MS`와 같다. */
const REVOKE_DELAY_MS = 40000;

/** blob URL을 실제로 읽을 수 있는지 확인한다. 해제된 URL은 fetch가 거부된다. */
function isAlive(page: Page, url: string): Promise<boolean> {
  return page.evaluate(async (target) => {
    try {
      await (await fetch(target)).blob();
      return true;
    } catch {
      return false;
    }
  }, url);
}

test.describe("downloadBlob의 object URL 수명", () => {
  test("40000ms 직전까지 유지되고 40000ms에 해제된다", async ({
    page,
    openHarness,
    captureDownload,
  }) => {
    // 호출 기록만 남기는 래퍼다. 원본을 그대로 호출하므로 URL 수명은 브라우저가 정한다.
    await page.addInitScript(() => {
      const created: string[] = [];
      const revoked: string[] = [];
      const create = URL.createObjectURL.bind(URL);
      const revoke = URL.revokeObjectURL.bind(URL);
      URL.createObjectURL = (obj) => {
        const url = create(obj);
        created.push(url);
        return url;
      };
      URL.revokeObjectURL = (url) => {
        revoked.push(url);
        revoke(url);
      };
      window.__scratch = { created, revoked };
    });
    await page.clock.install({ time: 0 });
    await openHarness();
    await page.clock.pauseAt(1000);

    const saved = await captureDownload(() => page.click("#dl-blob-ascii"));
    expect(saved.fileName).toBe("hello.txt");

    const created: string[] = await page.evaluate(
      () => window.__scratch.created,
    );
    expect(created).toHaveLength(1);
    const url = created[0] as string;
    const revokedNow = (): Promise<string[]> =>
      page.evaluate(() => window.__scratch.revoked);

    expect(await isAlive(page, url)).toBe(true);

    await page.clock.fastForward(REVOKE_DELAY_MS - 1);
    expect(await revokedNow()).toEqual([]);
    expect(await isAlive(page, url)).toBe(true);

    await page.clock.fastForward(1);
    expect(await revokedNow()).toEqual([url]);
    expect(await isAlive(page, url)).toBe(false);
  });
});

test.describe("ObjectUrlRegistry의 object URL 수명", () => {
  test("acquire는 같은 Blob의 URL을 재사용하고 참조가 0이 될 때 해제한다", async ({
    openHarness,
  }) => {
    const page = await openHarness();

    const url = await page.evaluate(() => {
      const registry = new window.__utilx.ObjectUrlRegistry();
      const blob = new Blob(["a"]);
      const first = registry.acquire(blob);
      const second = registry.acquire(blob);
      window.__scratch.registry = registry;
      window.__scratch.blob = blob;
      return first === second ? first : "";
    });
    expect(url).not.toBe("");
    expect(await isAlive(page, url)).toBe(true);

    await page.evaluate(() =>
      window.__scratch.registry.release(window.__scratch.blob),
    );
    expect(await isAlive(page, url)).toBe(true);

    await page.evaluate(() =>
      window.__scratch.registry.release(window.__scratch.blob),
    );
    expect(await isAlive(page, url)).toBe(false);
  });

  test("revoke와 revokeAll은 참조 횟수와 무관하게 즉시 해제한다", async ({
    openHarness,
  }) => {
    const page = await openHarness();

    const urls = await page.evaluate(() => {
      const registry = new window.__utilx.ObjectUrlRegistry();
      const a = new Blob(["a"]);
      const b = new Blob(["b"]);
      const c = new Blob(["c"]);
      registry.acquire(a);
      const urlA = registry.acquire(a);
      const urlB = registry.acquire(b);
      const urlC = registry.acquire(c);
      window.__scratch.registry = registry;
      window.__scratch.a = a;
      return { urlA, urlB, urlC };
    });

    await page.evaluate(() =>
      window.__scratch.registry.revoke(window.__scratch.a),
    );
    expect(await isAlive(page, urls.urlA)).toBe(false);
    expect(await isAlive(page, urls.urlB)).toBe(true);

    const count = await page.evaluate(() =>
      window.__scratch.registry.revokeAll(),
    );
    expect(count).toBe(2);
    expect(await isAlive(page, urls.urlB)).toBe(false);
    expect(await isAlive(page, urls.urlC)).toBe(false);
  });

  test("close는 남은 URL을 해제하고 이후 acquire를 거부한다", async ({
    openHarness,
  }) => {
    const page = await openHarness();

    const url = await page.evaluate(() => {
      const registry = new window.__utilx.ObjectUrlRegistry();
      window.__scratch.registry = registry;
      return registry.acquire(new Blob(["a"]));
    });
    expect(await isAlive(page, url)).toBe(true);

    await page.evaluate(() => window.__scratch.registry.close());
    expect(await isAlive(page, url)).toBe(false);

    const rejected = await page.evaluate(() => {
      try {
        window.__scratch.registry.acquire(new Blob(["b"]));
        return false;
      } catch {
        return true;
      }
    });
    expect(rejected).toBe(true);
  });
});
