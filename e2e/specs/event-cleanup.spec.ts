import type { Page } from "@playwright/test";
import { expect, test } from "../fixtures.js";

/** 이벤트 단계 상수. `Event.CAPTURING_PHASE`, `Event.BUBBLING_PHASE`. */
const CAPTURING_PHASE = 1;
const BUBBLING_PHASE = 3;

/** 페이지 안 `__scratch`에서 값을 읽는다. */
function scratch<T>(page: Page, key: string): Promise<T> {
  return page.evaluate((name) => window.__scratch[name], key);
}

test.describe("addEventListenerWithCleanup", () => {
  test("capture 등록 방식(true, false, 객체)과 무관하게 cleanup 뒤에는 호출되지 않는다", async ({
    openHarness,
  }) => {
    const page = await openHarness();

    await page.evaluate(() => {
      const parent = document.getElementById("parent") as HTMLElement;
      const calls: string[] = [];
      const registrations: [string, boolean | AddEventListenerOptions][] = [
        ["capture-true", true],
        ["capture-false", false],
        ["capture-object", { capture: true }],
      ];
      window.__scratch.calls = calls;
      window.__scratch.stops = registrations.map(([name, options]) =>
        window.__utilx.addEventListenerWithCleanup(
          parent,
          "click",
          () => calls.push(name),
          options,
        ),
      );
    });

    // capture 리스너가 등록 순서대로 먼저 호출되고, bubble 리스너(false)가 그 뒤에 호출된다.
    await page.click("#child");
    expect(await scratch<string[]>(page, "calls")).toEqual([
      "capture-true",
      "capture-object",
      "capture-false",
    ]);

    await page.evaluate(() => {
      for (const stop of window.__scratch.stops as (() => void)[]) stop();
    });
    await page.click("#child");
    expect(await scratch<string[]>(page, "calls")).toHaveLength(3);
  });

  test("같은 listener를 capture와 bubble로 등록하면 cleanup은 해당 단계만 해제한다", async ({
    openHarness,
  }) => {
    const page = await openHarness();

    await page.evaluate(() => {
      const parent = document.getElementById("parent") as HTMLElement;
      const phases: number[] = [];
      const listener = (event: Event) => phases.push(event.eventPhase);
      window.__scratch.phases = phases;
      window.__scratch.stopCapture = window.__utilx.addEventListenerWithCleanup(
        parent,
        "click",
        listener,
        true,
      );
      window.__utilx.addEventListenerWithCleanup(
        parent,
        "click",
        listener,
        false,
      );
    });

    // 대상이 자식이라 부모에서는 capture가 CAPTURING_PHASE, bubble이 BUBBLING_PHASE로 한 번씩 호출된다.
    await page.click("#child");
    expect(await scratch<number[]>(page, "phases")).toEqual([
      CAPTURING_PHASE,
      BUBBLING_PHASE,
    ]);

    await page.evaluate(() => {
      window.__scratch.phases.length = 0;
      window.__scratch.stopCapture();
    });
    await page.click("#child");
    expect(await scratch<number[]>(page, "phases")).toEqual([BUBBLING_PHASE]);
  });

  test("등록 뒤 옵션 객체의 capture를 바꿔도 등록 시점 값으로 해제한다", async ({
    openHarness,
  }) => {
    const page = await openHarness();

    await page.evaluate(() => {
      const parent = document.getElementById("parent") as HTMLElement;
      const calls: string[] = [];
      const options: AddEventListenerOptions = { capture: true };
      window.__scratch.calls = calls;
      window.__scratch.stop = window.__utilx.addEventListenerWithCleanup(
        parent,
        "click",
        () => calls.push("called"),
        options,
      );
      options.capture = false;
    });

    await page.click("#child");
    expect(await scratch<string[]>(page, "calls")).toEqual(["called"]);

    await page.evaluate(() => window.__scratch.stop());
    await page.click("#child");
    expect(await scratch<string[]>(page, "calls")).toEqual(["called"]);
  });

  test("호출 순서는 부모 capture, 대상, 부모 bubble이다", async ({
    openHarness,
  }) => {
    const page = await openHarness();

    await page.evaluate(() => {
      const parent = document.getElementById("parent") as HTMLElement;
      const child = document.getElementById("child") as HTMLElement;
      const order: string[] = [];
      window.__scratch.order = order;
      // 등록 순서를 일부러 뒤섞어, 호출 순서가 등록 순서가 아니라 이벤트 단계에서 나오게 한다.
      window.__utilx.addEventListenerWithCleanup(
        parent,
        "click",
        () => order.push("parent-bubble"),
        false,
      );
      window.__utilx.addEventListenerWithCleanup(
        child,
        "click",
        () => order.push("child"),
        false,
      );
      window.__utilx.addEventListenerWithCleanup(
        parent,
        "click",
        () => order.push("parent-capture"),
        true,
      );
    });

    await page.click("#child");
    expect(await scratch<string[]>(page, "order")).toEqual([
      "parent-capture",
      "child",
      "parent-bubble",
    ]);
  });
});
