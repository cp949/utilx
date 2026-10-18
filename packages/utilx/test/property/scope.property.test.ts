import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  SCOPE_OPS,
  checkScopeSequence,
  describeOp,
  type Clock,
} from "./support/scopeChecks.js";
import { forEachCase, sequencesOf } from "./support/enumerate.js";

const clock: Clock = {
  advance: (ms) => vi.advanceTimersByTime(ms),
  pendingTimers: () => vi.getTimerCount(),
};

describe("DisposableScope 상태 전이 성질", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("길이 4 이하의 모든 연산 시퀀스에서 정리 횟수·순서·signal·타이머 계약을 지킨다", () => {
    const sequences = [...sequencesOf(SCOPE_OPS, 4)];
    const count = forEachCase(
      sequences,
      (ops) =>
        ops.length === 0 ? "(빈 시퀀스)" : ops.map(describeOp).join(" → "),
      (ops) => {
        vi.clearAllTimers();
        checkScopeSequence(ops, clock);
      },
    );
    expect(count).toBe(1 + 10 + 100 + 1000 + 10000);
  });
});
