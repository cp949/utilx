import { expect, test } from "../fixtures.js";

test.describe("nextAnimationFrame", () => {
  test("먼저 등록한 requestAnimationFrame 콜백 뒤에, 동기 코드 이후에 완료한다", async ({
    openHarness,
  }) => {
    const page = await openHarness();

    const order = await page.evaluate(async () => {
      const log: string[] = [];
      requestAnimationFrame(() => log.push("raf-before"));
      const frame = window.__utilx
        .nextAnimationFrame()
        .then(() => log.push("resolved"));
      log.push("sync");
      await frame;
      return log;
    });

    expect(order).toEqual(["sync", "raf-before", "resolved"]);
  });

  test("await 한 번마다 최소 한 프레임이 지난다", async ({ openHarness }) => {
    const page = await openHarness();

    const frames = await page.evaluate(async () => {
      let count = 0;
      let running = true;
      const tick = () => {
        count += 1;
        if (running) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
      // 프레임 카운터가 돌기 시작할 때까지 한 프레임 기다린다.
      await window.__utilx.nextAnimationFrame();
      const start = count;
      await window.__utilx.nextAnimationFrame();
      const afterFirst = count - start;
      await window.__utilx.nextAnimationFrame();
      const afterSecond = count - start;
      running = false;
      return { afterFirst, afterSecond };
    });

    expect(frames.afterFirst).toBeGreaterThanOrEqual(1);
    expect(frames.afterSecond).toBeGreaterThanOrEqual(frames.afterFirst + 1);
  });
});
