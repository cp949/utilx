import type { CleanupFn } from "./CleanupFn.js";
import { DisposeError } from "./DisposeError.js";

/** `DisposableScope.use`가 받는 정리 대상. 함수이거나 `dispose()`를 가진 객체다. */
export type DisposableLike = CleanupFn | { dispose: () => unknown };

/** 정리 대상을 하나의 정리 함수로 바꾼다. */
function toCleanup(resource: DisposableLike): CleanupFn {
  if (typeof resource === "function") return resource;
  if (typeof resource.dispose === "function") {
    return () => {
      resource.dispose();
    };
  }
  throw new TypeError("함수이거나 dispose()를 가진 객체여야 한다");
}

/**
 * 여러 cleanup을 등록해 두었다가 `dispose()`에서 등록의 역순(LIFO)으로 한 번에 실행한다.
 *
 * - `dispose()`는 `signal`을 먼저 abort한 뒤 cleanup을 실행한다. cleanup 중에는 `signal.aborted`가 항상 `true`다.
 * - cleanup이 던져도 나머지는 끝까지 실행하고, 마지막에 `DisposeError`로 모아서 던진다.
 * - `dispose()`는 여러 번 호출해도 한 번만 실행한다. abort 리스너나 cleanup 안에서 다시 호출해도 무시한다.
 * - 같은 대상을 `use`로 두 번 등록하면 cleanup도 두 번 실행한다.
 * - `dispose()`된 scope에 등록하면 대상을 즉시 정리한 뒤 예외를 던진다. `dispose()`가 시작된 뒤에는 abort 리스너와 cleanup 안에서 등록해도 같다.
 *
 * @example
 * const scope = new DisposableScope();
 * scope.use(addEventListenerWithCleanup(window, 'resize', onResize));
 * scope.setTimeout(() => console.log('1초 뒤'), 1000);
 * fetch(url, { signal: scope.signal });
 *
 * // 언마운트 시: 리스너 해제, 타이머 취소, 진행 중 요청 abort
 * scope.dispose();
 */
export class DisposableScope {
  private entries = new Set<CleanupFn>();
  private isDisposed = false;
  private controller: AbortController | undefined;

  /** 아직 실행하지 않은 cleanup의 개수. */
  get size(): number {
    return this.entries.size;
  }

  /** `dispose()`가 호출되었는지 여부. */
  get disposed(): boolean {
    return this.isDisposed;
  }

  /**
   * scope가 `dispose()`될 때 abort되는 시그널이다. `fetch` 등 취소 가능한 작업에 넘긴다.
   * abort는 cleanup보다 먼저 일어난다. `dispose()`가 시작된 뒤에 읽으면, cleanup 안에서 처음 읽어도 이미 abort된 시그널을 돌려준다.
   *
   * abort 리스너는 아직 정리되지 않은 자원을 볼 수 있다. 리스너가 던지는 예외는 `DisposeError`에 모이지 않고 `AbortSignal`의 규칙대로 전역에 보고된다.
   */
  get signal(): AbortSignal {
    if (!this.controller) {
      this.controller = new AbortController();
      if (this.isDisposed) this.controller.abort();
    }
    return this.controller.signal;
  }

  /**
   * cleanup 함수를 등록하고, 그 cleanup을 지금 실행하는 함수를 돌려준다.
   * 돌려준 함수를 호출하면 cleanup을 한 번 실행하고 scope에서도 뺀다. 이후 호출은 무시한다.
   *
   * @throws {Error} 이미 `dispose()`된 scope일 때. 이 경우 `cleanup`은 먼저 실행한다
   */
  defer(cleanup: CleanupFn): CleanupFn {
    let done = false;
    const run = () => {
      if (done) return;
      done = true;
      this.entries.delete(run);
      cleanup();
    };

    if (this.isDisposed) {
      run();
      throw new Error("DisposableScope는 이미 dispose되었다");
    }
    this.entries.add(run);
    return run;
  }

  /**
   * 정리 대상을 등록하고 그대로 돌려준다. 함수이거나 `dispose()`를 가진 객체를 받는다.
   * `close()`처럼 다른 이름의 메서드는 `scope.use(() => socket.close())`로 감싼다.
   *
   * @throws {Error} 이미 `dispose()`된 scope일 때. 이 경우 대상은 먼저 정리한다
   * @throws {TypeError} 함수도 `dispose()`를 가진 객체도 아닐 때
   */
  use<T extends DisposableLike>(resource: T): T {
    this.defer(toCleanup(resource));
    return resource;
  }

  /**
   * `setTimeout`을 시작하고, scope가 `dispose()`되면 취소한다.
   * 돌려준 함수를 호출하면 타이머를 즉시 취소한다. 타이머가 실행된 뒤에는 scope에서 빠진다.
   */
  setTimeout(callback: () => void, delayMs: number): CleanupFn {
    // 이미 dispose된 scope이면 defer가 먼저 던지므로, 핸들은 defer 뒤에 채운다.
    const timer: { handle?: ReturnType<typeof setTimeout> } = {};
    const cancel = this.defer(() => {
      clearTimeout(timer.handle);
    });
    timer.handle = setTimeout(() => {
      cancel();
      callback();
    }, delayMs);
    return cancel;
  }

  /**
   * `signal`을 abort한 뒤, 등록된 cleanup을 등록의 역순으로 실행하고 scope를 닫는다.
   *
   * @throws {DisposeError} abort 또는 하나 이상의 cleanup이 던졌을 때. `abort()` 자체가 던지면 `errors`의 맨 앞에 담는다. 나머지는 모두 실행한 뒤에 던진다
   */
  dispose(): void {
    if (this.isDisposed) return;
    this.isDisposed = true;

    const cleanups = [...this.entries].reverse();
    this.entries.clear();

    const errors: unknown[] = [];
    // abort를 먼저 한다. cleanup이 읽는 signal 상태를 사전 조회 여부와 무관하게 같게 하기 위해서다.
    // 규격상 abort()는 리스너 예외를 던지지 않지만, 던지는 구현이어도 cleanup은 건너뛰지 않는다.
    try {
      this.controller?.abort();
    } catch (error) {
      errors.push(error);
    }
    for (const cleanup of cleanups) {
      try {
        cleanup();
      } catch (error) {
        errors.push(error);
      }
    }

    if (errors.length > 0) throw new DisposeError(errors);
  }
}
