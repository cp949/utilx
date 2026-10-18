import { describe, expect, it } from "vitest";
import {
  moveItem,
  rotateLeft,
  rotateRight,
  swapItems,
} from "../../src/array/index.js";
import {
  HOLE,
  asOptions,
  checkMove,
  checkMovePlacement,
  checkRotate,
  checkRotateInverse,
  checkSparseStructure,
  checkSwap,
  type Mode,
  type Slot,
} from "./support/arrayChecks.js";
import { forEachCase, sequencesOf, show } from "./support/enumerate.js";

// 길이 0~4 배열. 요소는 서로 다른 값 두 개와 실제 undefined, 빈 슬롯은 따로 센다.
const DENSE_SLOTS = [...sequencesOf<Slot>(["a", "b", undefined], 4)];
const SPARSE_SLOTS = [...sequencesOf<Slot>(["a", "b", undefined, HOLE], 4)];

// 정수 경계와 정수가 아닌 값. 길이 4 배열의 범위(-4..3)를 양쪽으로 넘는다.
const INDEXES = [
  ...Array.from({ length: 11 }, (_, index) => index - 5),
  Number.NaN,
  Number.POSITIVE_INFINITY,
  Number.NEGATIVE_INFINITY,
  0.5,
  -0.5,
];
const MODES: readonly Mode[] = [{ inplace: false }, { inplace: true }];

const modeName = (mode: Mode) => (mode.inplace ? "inplace" : "copy");

describe("moveItem 성질", () => {
  it("모든 길이 0~4 배열과 인덱스 조합에서 길이·요소·참조 계약을 지킨다", () => {
    const cases = SPARSE_SLOTS.flatMap((slots) =>
      INDEXES.flatMap((from) =>
        INDEXES.flatMap((to) =>
          MODES.map((mode) => ({ slots, from, to, mode })),
        ),
      ),
    );
    const count = forEachCase(
      cases,
      (c) =>
        `moveItem(${show(c.slots)}, ${show(c.from)}, ${show(c.to)}, ${modeName(c.mode)})`,
      (c) => checkMove(c.slots, c.from, c.to, c.mode),
    );
    expect(count).toBe(SPARSE_SLOTS.length * INDEXES.length ** 2 * 2);
  });

  it("서로 다른 항목에서 옮긴 항목은 한 번만 나타나고 나머지의 상대 순서가 유지된다", () => {
    const cases = [0, 1, 2, 3, 4, 5].flatMap((length) =>
      INDEXES.flatMap((from) =>
        INDEXES.flatMap((to) =>
          MODES.map((mode) => ({ length, from, to, mode })),
        ),
      ),
    );
    const count = forEachCase(
      cases,
      (c) =>
        `길이 ${c.length}: moveItem(0..n-1, ${show(c.from)}, ${show(c.to)}, ${modeName(c.mode)})`,
      (c) => checkMovePlacement(c.length, c.from, c.to, c.mode),
    );
    expect(count).toBe(6 * INDEXES.length ** 2 * 2);
  });
});

describe("rotateLeft·rotateRight 성질", () => {
  const COUNTS = [
    ...Array.from({ length: 13 }, (_, index) => index - 6),
    Number.NaN,
    Number.POSITIVE_INFINITY,
    Number.NEGATIVE_INFINITY,
    0.5,
    -0.5,
  ];

  it("모든 길이 0~4 배열과 count 조합에서 길이·요소·회전 위치를 지킨다", () => {
    const cases = SPARSE_SLOTS.flatMap((slots) =>
      COUNTS.flatMap((count) =>
        (["left", "right"] as const).flatMap((direction) =>
          MODES.map((mode) => ({ slots, count, direction, mode })),
        ),
      ),
    );
    const count = forEachCase(
      cases,
      (c) =>
        `${c.direction === "left" ? "rotateLeft" : "rotateRight"}(${show(c.slots)}, ${show(c.count)}, ${modeName(c.mode)})`,
      (c) => checkRotate(c.slots, c.count, c.direction, c.mode),
    );
    expect(count).toBe(SPARSE_SLOTS.length * COUNTS.length * 4);
  });

  it("반대 방향으로 같은 수만큼 돌리면 원래 값으로 돌아온다", () => {
    const integers = COUNTS.filter(Number.isInteger);
    const cases = DENSE_SLOTS.flatMap((slots) =>
      integers.map((count) => ({ slots, count })),
    );
    const count = forEachCase(
      cases,
      (c) => `rotate(${show(c.slots)}, ${show(c.count)})`,
      (c) => checkRotateInverse(c.slots, c.count),
    );
    expect(count).toBe(DENSE_SLOTS.length * integers.length);
  });
});

describe("swapItems 성질", () => {
  it("모든 길이 0~4 배열과 인덱스 조합에서 유효한 두 위치만 맞바꾼다", () => {
    const cases = SPARSE_SLOTS.flatMap((slots) =>
      INDEXES.flatMap((a) =>
        INDEXES.flatMap((b) => MODES.map((mode) => ({ slots, a, b, mode }))),
      ),
    );
    const count = forEachCase(
      cases,
      (c) =>
        `swapItems(${show(c.slots)}, ${show(c.a)}, ${show(c.b)}, ${modeName(c.mode)})`,
      (c) => checkSwap(c.slots, c.a, c.b, c.mode),
    );
    expect(count).toBe(SPARSE_SLOTS.length * INDEXES.length ** 2 * 2);
  });
});

describe("빈 슬롯 입력의 현재 동작(특성화)", () => {
  const operations: readonly [
    string,
    (array: Slot[], mode: Mode) => unknown[],
  ][] = [
    [
      "moveItem(0 → 최대)",
      (array, mode) => moveItem(array, 0, 3, asOptions(mode)),
    ],
    [
      "moveItem(잘못된 출발)",
      (array, mode) => moveItem(array, 9, 0, asOptions(mode)),
    ],
    ["rotateLeft(1)", (array, mode) => rotateLeft(array, 1, asOptions(mode))],
    ["rotateRight(1)", (array, mode) => rotateRight(array, 1, asOptions(mode))],
    [
      "swapItems(0, 1)",
      (array, mode) => swapItems(array, 0, 1, asOptions(mode)),
    ],
    [
      "swapItems(잘못된 인덱스)",
      (array, mode) => swapItems(array, 0, 9, asOptions(mode)),
    ],
  ];

  it("copy 모드는 빈 슬롯을 undefined 요소로 채우고 inplace 모드는 빈 슬롯을 늘리지 않는다", () => {
    const cases = SPARSE_SLOTS.flatMap((slots) =>
      operations.flatMap(([name, operation]) =>
        MODES.map((mode) => ({ slots, name, operation, mode })),
      ),
    );
    const count = forEachCase(
      cases,
      (c) => `${c.name}: ${show(c.slots)}, ${modeName(c.mode)}`,
      (c) =>
        checkSparseStructure(
          c.slots,
          c.operation as Parameters<typeof checkSparseStructure>[1],
          c.mode,
        ),
    );
    expect(count).toBe(SPARSE_SLOTS.length * operations.length * 2);
  });

  it("실제 undefined 요소는 어느 모드에서도 빈 슬롯이 되지 않는다", () => {
    const input = [undefined, "a", undefined];
    for (const mode of MODES) {
      for (const result of [
        moveItem([...input], 0, 2, asOptions(mode)),
        rotateLeft([...input], 1, asOptions(mode)),
        swapItems([...input], 0, 1, asOptions(mode)),
      ]) {
        expect(Object.keys(result)).toHaveLength(3);
      }
    }
  });
});
