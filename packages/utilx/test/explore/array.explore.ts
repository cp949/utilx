import fc from "fast-check";
import { describe, it } from "vitest";
import {
  HOLE,
  checkMove,
  checkMovePlacement,
  checkRotate,
  checkRotateInverse,
  checkSwap,
  type Slot,
} from "../property/support/arrayChecks.js";

const slot = fc.constantFrom<Slot>("a", "b", "c", 1, 2, undefined, HOLE);
const slots = fc.array(slot, { maxLength: 30 });
const mode = fc.boolean().map((inplace) => ({ inplace }));

const index = fc.oneof(
  { weight: 6, arbitrary: fc.integer({ min: -40, max: 40 }) },
  {
    weight: 2,
    arbitrary: fc.constantFrom(
      Number.NaN,
      Number.POSITIVE_INFINITY,
      Number.NEGATIVE_INFINITY,
      0.5,
      -0.5,
      -0,
      Number.MAX_SAFE_INTEGER,
      Number.MIN_SAFE_INTEGER,
    ),
  },
  { weight: 1, arbitrary: fc.double() },
);

// 큰 정수 count는 부동소수 덧셈 오차가 검사 쪽 계산에 생기므로 범위를 제한한다.
const rotateCount = fc.oneof(
  { weight: 6, arbitrary: fc.integer({ min: -1000, max: 1000 }) },
  {
    weight: 2,
    arbitrary: fc.constantFrom(
      Number.NaN,
      Number.POSITIVE_INFINITY,
      Number.NEGATIVE_INFINITY,
      0.5,
      -0.5,
    ),
  },
  {
    weight: 1,
    arbitrary: fc.double().filter((value) => !Number.isInteger(value)),
  },
);

describe("배열 함수 탐색", () => {
  it("moveItem은 임의 배열·인덱스에서 길이·요소·참조 계약을 지킨다", () => {
    fc.assert(
      fc.property(slots, index, index, mode, (items, from, to, m) => {
        checkMove(items, from, to, m);
      }),
    );
  });

  it("moveItem은 서로 다른 항목에서 옮긴 항목의 위치와 나머지 순서를 지킨다", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 30 }),
        index,
        index,
        mode,
        (length, from, to, m) => {
          checkMovePlacement(length, from, to, m);
        },
      ),
    );
  });

  it("rotateLeft·rotateRight는 임의 배열·count에서 회전 위치와 참조 계약을 지킨다", () => {
    fc.assert(
      fc.property(
        slots,
        rotateCount,
        fc.constantFrom("left", "right"),
        mode,
        (items, count, direction, m) => {
          checkRotate(items, count, direction, m);
        },
      ),
    );
  });

  it("반대 방향으로 같은 수만큼 돌리면 원래 값이다", () => {
    fc.assert(
      fc.property(
        slots,
        fc.integer({ min: -1000, max: 1000 }),
        (items, count) => {
          checkRotateInverse(items, count);
        },
      ),
    );
  });

  it("swapItems는 임의 배열·인덱스에서 유효한 두 위치만 맞바꾼다", () => {
    fc.assert(
      fc.property(slots, index, index, mode, (items, a, b, m) => {
        checkSwap(items, a, b, m);
      }),
    );
  });
});
