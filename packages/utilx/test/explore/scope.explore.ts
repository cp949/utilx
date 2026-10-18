import fc from "fast-check";
import { afterEach, beforeEach, describe, it, vi } from "vitest";
import {
  SCOPE_OPS,
  checkScopeSequence,
  type Clock,
} from "../property/support/scopeChecks.js";

const clock: Clock = {
  advance: (ms) => vi.advanceTimersByTime(ms),
  pendingTimers: () => vi.getTimerCount(),
};

describe("DisposableScope 탐색", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("길이 40 이하의 임의 연산 시퀀스에서 정리 횟수·순서·signal·타이머 계약을 지킨다", () => {
    fc.assert(
      fc.property(
        fc.array(fc.constantFrom(...SCOPE_OPS), { maxLength: 40 }),
        (ops) => {
          vi.clearAllTimers();
          checkScopeSequence(ops, clock);
        },
      ),
    );
  });
});
