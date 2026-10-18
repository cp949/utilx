import assert from "node:assert/strict";
import {
  DisposableScope,
  DisposeError,
} from "../../../src/disposable/index.js";

/** 등록할 cleanup의 동작. */
export type CleanupBehavior =
  | "plain"
  | "throws"
  /** 실행되면 `scope.dispose()`를 다시 호출한다. */
  | "reenterDispose"
  /** 실행되면 `scope.defer()`로 cleanup을 새로 등록한다. */
  | "reenterDefer";

export type ScopeOp =
  | { readonly kind: "defer"; readonly behavior: CleanupBehavior }
  | { readonly kind: "use" }
  | { readonly kind: "timer" }
  /** 가장 최근에 받은 취소 함수(`defer`·`setTimeout`)를 두 번 호출한다. */
  | { readonly kind: "cancel" }
  | { readonly kind: "advance" }
  | { readonly kind: "signal" }
  | { readonly kind: "dispose" };

/** 시퀀스 열거에 쓰는 연산 전체. */
export const SCOPE_OPS: readonly ScopeOp[] = [
  { kind: "defer", behavior: "plain" },
  { kind: "defer", behavior: "throws" },
  { kind: "defer", behavior: "reenterDispose" },
  { kind: "defer", behavior: "reenterDefer" },
  { kind: "use" },
  { kind: "timer" },
  { kind: "cancel" },
  { kind: "advance" },
  { kind: "signal" },
  { kind: "dispose" },
];

export function describeOp(op: ScopeOp): string {
  return op.kind === "defer" ? `defer(${op.behavior})` : op.kind;
}

/** 가짜 타이머 제어. 테스트 러너에 의존하지 않도록 주입한다. */
export interface Clock {
  /** 시간을 `ms`만큼 진행해 도래한 타이머를 실행한다. */
  advance(ms: number): void;
  /** 아직 실행하지 않은 타이머 수. */
  pendingTimers(): number;
}

/** 타이머 지연. `advance`가 한 번에 이만큼 진행하므로 대기 중인 타이머는 모두 실행된다. */
const TIMER_DELAY_MS = 10;

interface CleanupLog {
  readonly type: "cleanup";
  readonly id: number;
  /** 실행을 시작할 때 `scope.disposed`였는지. */
  readonly disposed: boolean;
  /** `disposed`일 때 실행 시작 시점의 `signal.aborted`. 아니면 `null`. */
  readonly aborted: boolean | null;
  threw: boolean;
  /** cleanup이 던진 예외. 던지지 않았으면 `undefined`. */
  error: unknown;
}

interface TimerLog {
  readonly type: "timer";
  readonly id: number;
  readonly disposed: boolean;
}

type LogEntry = CleanupLog | TimerLog | { readonly type: "abort" };

const isCleanupLog = (item: LogEntry): item is CleanupLog =>
  item.type === "cleanup";
const isTimerLog = (item: LogEntry): item is TimerLog => item.type === "timer";

interface Entry {
  readonly id: number;
  readonly kind: "cleanup" | "timer";
  cancelled: boolean;
  fired: boolean;
}

interface Handle {
  readonly entry: Entry;
  readonly cancel: () => void;
}

/**
 * 연산 시퀀스를 실제 `DisposableScope`에 적용하고 JSDoc 계약에서 나온 성질을 확인한다.
 * 연산 사이마다 `size`와 대기 타이머 수를, 끝에서 정리 횟수·순서·시그널·타이머를 확인한다.
 * 기대 결과를 구현처럼 계산하지 않고, 실행 기록(log)이 계약을 지키는지만 본다.
 */
export function checkScopeSequence(
  ops: readonly ScopeOp[],
  clock: Clock,
): void {
  const scope = new DisposableScope();
  const log: LogEntry[] = [];
  /** 등록에 성공한 항목. 등록 순서대로다. */
  const entries: Entry[] = [];
  /** dispose 뒤 등록을 시도해 즉시 정리된 cleanup의 id. */
  const immediate: number[] = [];
  let nextId = 0;
  let lastHandle: Handle | undefined;
  let listening = false;

  const logsOf = (id: number) =>
    log.filter(isCleanupLog).filter((item) => item.id === id);

  function makeCleanup(id: number, behavior: CleanupBehavior): () => void {
    return () => {
      const disposed = scope.disposed;
      const item: LogEntry = {
        type: "cleanup",
        id,
        disposed,
        aborted: disposed ? scope.signal.aborted : null,
        threw: false,
        error: undefined,
      };
      log.push(item);
      try {
        if (behavior === "throws") throw new Error(`cleanup ${id} 실패`);
        if (behavior === "reenterDispose") scope.dispose();
        if (behavior === "reenterDefer") register("defer", "plain");
      } catch (error) {
        item.threw = true;
        item.error = error;
        throw error;
      }
    };
  }

  /** cleanup 등록을 시도한다. 성공하면 등록 순서에 남기고, 실패하면 즉시 정리된 것으로 센다. */
  function register(
    via: "defer" | "use",
    behavior: CleanupBehavior,
  ): { ok: boolean; error?: unknown } {
    const id = nextId;
    nextId += 1;
    const cleanup = makeCleanup(id, behavior);
    const entry: Entry = {
      id,
      kind: "cleanup",
      cancelled: false,
      fired: false,
    };
    try {
      if (via === "use") {
        scope.use({ dispose: cleanup });
      } else {
        const cancel = scope.defer(cleanup);
        lastHandle = { entry, cancel };
      }
    } catch (error) {
      immediate.push(id);
      return { ok: false, error };
    }
    entries.push(entry);
    return { ok: true };
  }

  const isPending = (entry: Entry): boolean =>
    entry.kind === "cleanup"
      ? logsOf(entry.id).length === 0
      : !entry.fired && !entry.cancelled && !scope.disposed;

  function checkCounts(): void {
    const pending = entries.filter(isPending);
    assert.equal(
      scope.size,
      pending.length,
      "size는 아직 실행하지 않은 등록 수다",
    );
    assert.equal(
      clock.pendingTimers(),
      pending.filter((entry) => entry.kind === "timer").length,
      "대기 중인 타이머 수",
    );
  }

  function apply(op: ScopeOp): void {
    switch (op.kind) {
      case "defer":
      case "use": {
        const wasDisposed = scope.disposed;
        const behavior = op.kind === "defer" ? op.behavior : "plain";
        const result = register(op.kind, behavior);
        assert.equal(
          result.ok,
          !wasDisposed,
          "dispose된 scope에만 등록이 실패한다",
        );
        if (!result.ok) {
          assert.ok(result.error instanceof Error);
          assert.ok(!(result.error instanceof DisposeError));
          const id = immediate[immediate.length - 1] as number;
          assert.equal(
            logsOf(id).length,
            1,
            "실패한 등록의 cleanup은 먼저 한 번 실행한다",
          );
        }
        return;
      }
      case "timer": {
        const wasDisposed = scope.disposed;
        const id = nextId;
        nextId += 1;
        const entry: Entry = {
          id,
          kind: "timer",
          cancelled: false,
          fired: false,
        };
        try {
          const cancel = scope.setTimeout(() => {
            entry.fired = true;
            log.push({ type: "timer", id, disposed: scope.disposed });
          }, TIMER_DELAY_MS);
          lastHandle = { entry, cancel };
        } catch (error) {
          assert.ok(
            wasDisposed,
            "dispose 전에는 타이머 등록이 실패하지 않는다",
          );
          assert.ok(error instanceof Error);
          return;
        }
        assert.ok(!wasDisposed, "dispose 뒤 타이머 등록은 예외를 던진다");
        entries.push(entry);
        return;
      }
      case "cancel": {
        if (!lastHandle) return;
        const { entry, cancel } = lastHandle;
        const wasPending = isPending(entry);
        try {
          cancel();
        } catch {
          // cleanup이 던진 예외는 호출자에게 전달된다. 횟수는 아래에서 로그로 확인한다.
        }
        if (entry.kind === "timer" && wasPending) entry.cancelled = true;
        const before = log.length;
        try {
          cancel();
        } catch (error) {
          assert.fail(
            `취소 함수를 다시 호출해도 아무 일이 없어야 한다: ${String(error)}`,
          );
        }
        assert.equal(log.length, before, "취소 함수를 다시 호출하면 무시한다");
        return;
      }
      case "advance":
        clock.advance(TIMER_DELAY_MS);
        return;
      case "signal": {
        const { signal } = scope;
        // dispose 뒤에 만든 listener는 이미 지난 abort를 받지 못하므로 세지 않는다.
        if (!listening && !scope.disposed) {
          listening = true;
          signal.addEventListener("abort", () => log.push({ type: "abort" }));
        }
        assert.equal(
          signal.aborted,
          scope.disposed,
          "signal은 dispose 뒤에만 abort 상태다",
        );
        return;
      }
      case "dispose": {
        const wasDisposed = scope.disposed;
        const start = log.length;
        let error: unknown;
        try {
          scope.dispose();
        } catch (caught) {
          error = caught;
        }
        assert.equal(scope.disposed, true);
        assert.equal(scope.size, 0, "dispose 뒤 size는 0이다");
        assert.equal(
          clock.pendingTimers(),
          0,
          "dispose가 타이머를 모두 취소한다",
        );
        if (wasDisposed) {
          assert.equal(error, undefined, "dispose를 다시 호출하면 무시한다");
          assert.equal(log.length, start);
          return;
        }
        const thrown = log
          .slice(start)
          .filter(isCleanupLog)
          .filter((item) => item.disposed && item.threw)
          .map((item) => item.error);
        const failed = thrown.length;
        if (failed === 0) {
          assert.equal(
            error,
            undefined,
            "실패한 cleanup이 없으면 던지지 않는다",
          );
        } else {
          assert.ok(
            error instanceof DisposeError,
            "실패한 cleanup이 있으면 DisposeError를 던진다",
          );
          assert.equal(
            error.errors.length,
            failed,
            "실패한 cleanup을 모두 모은다",
          );
          for (const cause of thrown) {
            assert.ok(
              error.errors.includes(cause),
              "cleanup이 던진 예외 객체를 그대로 모은다",
            );
          }
        }
      }
    }
  }

  for (const op of ops) {
    apply(op);
    checkCounts();
  }
  // 시퀀스가 dispose로 끝나지 않아도 마지막에 정리해 전체 성질을 확인한다.
  if (!scope.disposed) apply({ kind: "dispose" });
  checkFinal();

  function checkFinal(): void {
    for (const entry of entries) {
      if (entry.kind === "cleanup") {
        assert.equal(
          logsOf(entry.id).length,
          1,
          `cleanup ${entry.id}는 정확히 한 번 실행한다`,
        );
      }
    }
    // dispose가 시작된 뒤 타이머 콜백은 실행되지 않고, 취소한 타이머도 실행되지 않는다.
    const timerLogs = log.filter(isTimerLog);
    for (const item of timerLogs) {
      assert.equal(
        item.disposed,
        false,
        "dispose 뒤에는 타이머 콜백이 실행되지 않는다",
      );
      const entry = entries.find((candidate) => candidate.id === item.id);
      assert.equal(entry?.cancelled, false, "취소한 타이머는 실행되지 않는다");
      assert.equal(
        timerLogs.filter((other) => other.id === item.id).length,
        1,
        "타이머는 한 번만 실행한다",
      );
    }

    // dispose 중 실행된 cleanup: 등록의 역순이고, 실행할 때 signal은 이미 abort 상태다.
    const duringDispose = log
      .filter(isCleanupLog)
      .filter((item) => item.disposed);
    const registeredIds = entries.map((entry) => entry.id);
    const order = duringDispose
      .map((item) => registeredIds.indexOf(item.id))
      .filter((index) => index >= 0);
    for (let index = 1; index < order.length; index += 1) {
      assert.ok(
        (order[index] as number) < (order[index - 1] as number),
        `dispose 중 cleanup은 등록의 역순으로 실행한다: ${JSON.stringify(order)}`,
      );
    }
    for (const item of duringDispose) {
      assert.equal(
        item.aborted,
        true,
        "dispose 중 cleanup이 실행될 때 signal은 abort 상태다",
      );
    }

    // abort 이벤트는 한 번이고 모든 dispose 중 cleanup보다 먼저 일어난다.
    const aborts = log.flatMap((item, index) =>
      item.type === "abort" ? [index] : [],
    );
    assert.equal(
      aborts.length,
      listening ? 1 : 0,
      "abort 이벤트는 listener가 있으면 한 번 일어난다",
    );
    const firstDisposeCleanup = log.findIndex(
      (item) => item.type === "cleanup" && item.disposed,
    );
    if (aborts.length === 1 && firstDisposeCleanup >= 0) {
      assert.ok(
        (aborts[0] as number) < firstDisposeCleanup,
        "abort는 cleanup보다 먼저 일어난다",
      );
    }
  }
}
