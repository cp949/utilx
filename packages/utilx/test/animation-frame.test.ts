import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { nextAnimationFrame } from "../src/async/index.js";

describe("nextAnimationFrame", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("requestAnimationFrame이 있으면 다음 프레임에 완료한다", async () => {
    const callbacks: (() => void)[] = [];
    vi.stubGlobal("requestAnimationFrame", (callback: () => void) => {
      callbacks.push(callback);
      return callbacks.length;
    });
    const done = vi.fn();
    const promise = nextAnimationFrame().then(done);

    await vi.advanceTimersByTimeAsync(1000);
    expect(done).not.toHaveBeenCalled();

    callbacks[0]?.();
    await promise;
    expect(done).toHaveBeenCalledOnce();
  });

  it("requestAnimationFrame이 없으면 setTimeout 0 뒤에 완료한다", async () => {
    vi.stubGlobal("requestAnimationFrame", undefined);
    const done = vi.fn();
    const promise = nextAnimationFrame().then(done);

    expect(done).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(0);
    await promise;
    expect(done).toHaveBeenCalledOnce();
  });
});
