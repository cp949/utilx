import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  DisposableScope,
  DisposeError,
  addEventListenerWithCleanup,
} from "../src/disposable/index.js";

describe("DisposableScope", () => {
  it("dispose는 등록의 역순으로 cleanup을 실행한다", () => {
    const scope = new DisposableScope();
    const order: number[] = [];
    scope.defer(() => order.push(1));
    scope.defer(() => order.push(2));
    scope.defer(() => order.push(3));

    scope.dispose();

    expect(order).toEqual([3, 2, 1]);
    expect(scope.disposed).toBe(true);
    expect(scope.size).toBe(0);
  });

  it("dispose를 여러 번 호출해도 한 번만 실행한다", () => {
    const scope = new DisposableScope();
    const cleanup = vi.fn();
    scope.defer(cleanup);

    scope.dispose();
    scope.dispose();

    expect(cleanup).toHaveBeenCalledOnce();
  });

  it("defer가 돌려준 함수는 cleanup을 한 번만 실행하고 scope에서 뺀다", () => {
    const scope = new DisposableScope();
    const cleanup = vi.fn();
    const release = scope.defer(cleanup);

    expect(scope.size).toBe(1);
    release();
    release();
    scope.dispose();

    expect(cleanup).toHaveBeenCalledOnce();
    expect(scope.size).toBe(0);
  });

  it("use는 함수와 dispose()를 가진 객체를 받고 대상을 그대로 돌려준다", () => {
    const scope = new DisposableScope();
    const fn = vi.fn();
    const resource = { dispose: vi.fn() };

    expect(scope.use(fn)).toBe(fn);
    expect(scope.use(resource)).toBe(resource);
    scope.dispose();

    expect(fn).toHaveBeenCalledOnce();
    expect(resource.dispose).toHaveBeenCalledOnce();
  });

  it("use는 함수도 dispose()도 없으면 TypeError다", () => {
    const scope = new DisposableScope();

    expect(() => scope.use({} as unknown as { dispose: () => void })).toThrow(
      TypeError,
    );
  });

  it("같은 대상을 두 번 use하면 cleanup도 두 번 실행한다", () => {
    const scope = new DisposableScope();
    const cleanup = vi.fn();
    scope.use(cleanup);
    scope.use(cleanup);

    scope.dispose();

    expect(cleanup).toHaveBeenCalledTimes(2);
  });

  it("cleanup이 던져도 나머지를 실행하고 DisposeError로 모아서 던진다", () => {
    const scope = new DisposableScope();
    const last = vi.fn();
    const first = new Error("첫 번째 실패");
    const second = new Error("두 번째 실패");
    scope.defer(last);
    scope.defer(() => {
      throw first;
    });
    scope.defer(() => {
      throw second;
    });

    let thrown: unknown;
    try {
      scope.dispose();
    } catch (error) {
      thrown = error;
    }

    expect(thrown).toBeInstanceOf(DisposeError);
    // 등록의 역순으로 실행하므로 second가 먼저 실패한다.
    expect((thrown as DisposeError).errors).toEqual([second, first]);
    expect(last).toHaveBeenCalledOnce();
    expect(scope.disposed).toBe(true);
  });

  it("dispose된 scope에 등록하면 대상을 즉시 정리하고 예외를 던진다", () => {
    const scope = new DisposableScope();
    scope.dispose();
    const cleanup = vi.fn();

    expect(() => scope.defer(cleanup)).toThrow(Error);
    expect(cleanup).toHaveBeenCalledOnce();
    expect(scope.size).toBe(0);
  });

  describe("signal", () => {
    it("dispose하면 abort된다", () => {
      const scope = new DisposableScope();
      const { signal } = scope;

      expect(signal.aborted).toBe(false);
      scope.dispose();
      expect(signal.aborted).toBe(true);
    });

    it("같은 scope에서는 같은 시그널을 돌려준다", () => {
      const scope = new DisposableScope();

      expect(scope.signal).toBe(scope.signal);
    });

    it("dispose 뒤에 읽으면 이미 abort된 시그널이다", () => {
      const scope = new DisposableScope();
      scope.dispose();

      expect(scope.signal.aborted).toBe(true);
    });

    it("cleanup이 실패해도 abort한다", () => {
      const scope = new DisposableScope();
      const { signal } = scope;
      scope.defer(() => {
        throw new Error("실패");
      });

      expect(() => {
        scope.dispose();
      }).toThrow(DisposeError);
      expect(signal.aborted).toBe(true);
    });
  });

  describe("setTimeout", () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it("시간이 지나면 콜백을 실행하고 scope에서 빠진다", () => {
      const scope = new DisposableScope();
      const callback = vi.fn();
      scope.setTimeout(callback, 100);

      expect(scope.size).toBe(1);
      vi.advanceTimersByTime(100);

      expect(callback).toHaveBeenCalledOnce();
      expect(scope.size).toBe(0);
    });

    it("dispose하면 타이머를 취소한다", () => {
      const scope = new DisposableScope();
      const callback = vi.fn();
      scope.setTimeout(callback, 100);

      scope.dispose();
      vi.advanceTimersByTime(1000);

      expect(callback).not.toHaveBeenCalled();
    });

    it("돌려준 함수로 즉시 취소할 수 있다", () => {
      const scope = new DisposableScope();
      const callback = vi.fn();
      const cancel = scope.setTimeout(callback, 100);

      cancel();
      vi.advanceTimersByTime(1000);

      expect(callback).not.toHaveBeenCalled();
      expect(scope.size).toBe(0);
    });

    it("dispose된 scope에서는 타이머를 만들지 않고 예외를 던진다", () => {
      const scope = new DisposableScope();
      scope.dispose();
      const callback = vi.fn();

      expect(() => scope.setTimeout(callback, 100)).toThrow(Error);
      vi.advanceTimersByTime(1000);
      expect(callback).not.toHaveBeenCalled();
    });
  });
});

describe("addEventListenerWithCleanup", () => {
  it("리스너를 등록하고 cleanup으로 해제한다", () => {
    const target = new EventTarget();
    const listener = vi.fn();

    const stop = addEventListenerWithCleanup(target, "ping", listener);
    target.dispatchEvent(new Event("ping"));
    stop();
    target.dispatchEvent(new Event("ping"));

    expect(listener).toHaveBeenCalledOnce();
  });

  it("옵션을 등록과 해제에 같이 넘긴다", () => {
    const target = new EventTarget();
    const add = vi.spyOn(target, "addEventListener");
    const remove = vi.spyOn(target, "removeEventListener");
    const listener = vi.fn();
    const options = { capture: true };

    addEventListenerWithCleanup(target, "ping", listener, options)();

    expect(add).toHaveBeenCalledWith("ping", listener, options);
    expect(remove).toHaveBeenCalledWith("ping", listener, options);
  });

  it("scope에 등록하면 dispose 때 해제된다", () => {
    const target = new EventTarget();
    const listener = vi.fn();
    const scope = new DisposableScope();
    scope.use(addEventListenerWithCleanup(target, "ping", listener));

    scope.dispose();
    target.dispatchEvent(new Event("ping"));

    expect(listener).not.toHaveBeenCalled();
  });
});
