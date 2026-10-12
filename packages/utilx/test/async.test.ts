import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { delay } from "../src/async/index.js";

describe("delay", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("지정한 시간이 지나면 완료한다", async () => {
    const done = vi.fn();
    const promise = delay(100).then(done);

    await vi.advanceTimersByTimeAsync(99);
    expect(done).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(1);
    await promise;
    expect(done).toHaveBeenCalledOnce();
  });

  it("abort되면 AbortError로 거부한다", async () => {
    const controller = new AbortController();
    const promise = delay(1000, controller.signal);
    const assertion = expect(promise).rejects.toMatchObject({
      name: "AbortError",
    });

    controller.abort();
    await assertion;
    expect(vi.getTimerCount()).toBe(0);
  });

  it("이미 abort된 시그널이면 즉시 거부하고 타이머를 만들지 않는다", async () => {
    const controller = new AbortController();
    controller.abort();

    await expect(delay(1000, controller.signal)).rejects.toMatchObject({
      name: "AbortError",
    });
    expect(vi.getTimerCount()).toBe(0);
  });

  it("정상 완료하면 abort 리스너를 정리한다", async () => {
    const controller = new AbortController();
    const remove = vi.spyOn(controller.signal, "removeEventListener");
    const promise = delay(10, controller.signal);

    await vi.advanceTimersByTimeAsync(10);
    await promise;

    expect(remove).toHaveBeenCalledWith("abort", expect.any(Function));
  });
});
