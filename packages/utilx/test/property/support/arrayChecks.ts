import assert from "node:assert/strict";
import {
  type ArrayInPlaceOptions,
  moveItem,
  rotateLeft,
  rotateRight,
  swapItems,
} from "../../../src/array/index.js";
import { show } from "./enumerate.js";

/** 입력 배열에서 빈 슬롯을 나타내는 표식. */
export const HOLE = Symbol("빈 슬롯");

export type Slot = string | number | undefined | typeof HOLE;
/** 빈 슬롯이 없는 배열을 읽은 값. 빈 슬롯은 `undefined`로 읽힌다. */
type Plain = Exclude<Slot, typeof HOLE>;

export interface Mode {
  readonly inplace: boolean;
}
const COPY = { inplace: false } as const;

/**
 * 오버로드는 `inplace`가 `true`·`false` 리터럴일 때만 받으므로, boolean 값은 한 번 단언해 넘긴다.
 * 구현은 값만 읽으므로 두 모드 모두 올바르게 동작한다.
 */
export const asOptions = (mode: Mode): ArrayInPlaceOptions =>
  mode as ArrayInPlaceOptions;

/** 표식 배열을 실제 배열로 만든다. `HOLE` 위치는 비워 둔다. */
export function build(slots: readonly Slot[]): Plain[] {
  const array = new Array<Plain>(slots.length);
  slots.forEach((slot, index) => {
    if (slot !== HOLE) array[index] = slot;
  });
  return array;
}

/** 빈 슬롯과 `undefined` 요소를 구분하는 표식 배열로 되돌린다. */
export function snapshot(array: readonly unknown[]): Slot[] {
  const slots: Slot[] = [];
  for (let index = 0; index < array.length; index += 1) {
    slots.push(index in array ? (array[index] as Plain) : HOLE);
  }
  return slots;
}

/** 빈 슬롯을 `undefined`로 읽은 값 배열. */
function plain(array: readonly unknown[]): Plain[] {
  return Array.from(array) as Plain[];
}

function holeCount(array: readonly unknown[]): number {
  return snapshot(array).filter((slot) => slot === HOLE).length;
}

/** 값의 등장 횟수. `show`는 `-0`과 `0`, `undefined`와 문자열 `"undefined"`를 구분하므로 `Object.is` 기준으로 센다. */
function tally(values: readonly Plain[]): string[] {
  const counts = new Map<string, number>();
  for (const value of values) {
    const key = show(value);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return [...counts].map(([key, count]) => `${key}×${count}`).sort();
}

/** 정수이고 `-length <= index < length`이면 음수를 환산한 위치를, 아니면 `-1`을 돌려준다. */
export function validIndex(length: number, index: number): number {
  if (!Number.isInteger(index) || index < -length || index >= length) {
    return -1;
  }
  return index < 0 ? length + index : index;
}

/** 두 `inplace` 모드가 공유하는 계약: 참조, 원본 보존, 길이, 값의 다중집합. */
function checkCommon(
  input: Plain[],
  before: Slot[],
  result: Plain[],
  mode: Mode,
): void {
  if (mode.inplace) {
    assert.equal(result, input, "inplace: true는 같은 배열을 돌려준다");
  } else {
    assert.notEqual(result, input, "inplace: false는 새 배열을 돌려준다");
    assert.deepEqual(
      snapshot(input),
      before,
      "inplace: false는 원본을 바꾸지 않는다",
    );
  }
  assert.equal(result.length, before.length, "길이가 보존된다");
  assert.deepEqual(
    tally(plain(result)),
    tally(before.map((slot) => (slot === HOLE ? undefined : slot))),
    "요소의 다중집합이 보존된다",
  );
  if (!before.includes(HOLE)) {
    assert.equal(
      holeCount(result),
      0,
      "빈 슬롯이 없는 입력에서 빈 슬롯이 생기지 않는다",
    );
  }
}

/** 빈 슬롯을 `undefined`로 읽은 배열에 같은 연산을 한 결과와 값이 같다. */
function checkSparseReadsAsUndefined(
  before: Slot[],
  result: Plain[],
  run: (array: Plain[]) => Plain[],
): void {
  if (!before.includes(HOLE)) return;
  const dense = before.map((slot) => (slot === HOLE ? undefined : slot));
  assert.deepEqual(
    plain(result),
    plain(run(dense)),
    "빈 슬롯은 undefined로 읽은 배열과 같은 값 결과를 낸다",
  );
}

export function checkMove(
  slots: readonly Slot[],
  fromIndex: number,
  toIndex: number,
  mode: Mode,
): void {
  const input = build(slots);
  const before = snapshot(input);
  const result = moveItem(input, fromIndex, toIndex, asOptions(mode));
  checkCommon(input, before, result, mode);
  if (validIndex(before.length, fromIndex) < 0) {
    assert.deepEqual(
      plain(result),
      plain(before.map((s) => (s === HOLE ? undefined : s))),
      "잘못된 출발 인덱스는 항목을 옮기지 않는다",
    );
  }
  checkSparseReadsAsUndefined(before, result, (array) =>
    moveItem(array, fromIndex, toIndex, COPY),
  );
}

/** 서로 다른 항목(`0..length-1`)으로 이동한 항목의 위치와 나머지의 상대 순서를 확인한다. */
export function checkMovePlacement(
  length: number,
  fromIndex: number,
  toIndex: number,
  mode: Mode,
): void {
  const identity = Array.from({ length }, (_, index) => index);
  const input = [...identity];
  const result = moveItem(input, fromIndex, toIndex, asOptions(mode));
  const from = validIndex(length, fromIndex);
  if (from < 0) {
    assert.deepEqual(result, identity, "잘못된 출발 인덱스는 그대로 둔다");
    return;
  }
  const item = identity[from] as number;
  assert.equal(result.filter((value) => value === item).length, 1);
  assert.deepEqual(
    result.filter((value) => value !== item),
    identity.filter((value) => value !== item),
    "옮기지 않은 항목의 상대 순서가 유지된다",
  );
  assert.equal(
    result.indexOf(item),
    insertPosition(length - 1, toIndex),
    "항목을 뺀 배열에서 splice의 시작 위치 규칙대로 놓인다",
  );
}

/**
 * 길이 `length` 배열에 `splice(start, 0, item)`으로 넣을 때 항목이 놓이는 위치.
 * ECMAScript의 splice 시작 위치 규칙이다: NaN은 0, 소수는 0 쪽으로 버리고, 음수는 뒤에서 세며, 양 끝으로 맞춘다.
 */
function insertPosition(length: number, start: number): number {
  // `|| 0`은 NaN과 -0을 0으로 맞춘다. -0을 남기면 strict assert가 0과 다르게 본다.
  const relative = Math.trunc(start) || 0;
  if (relative < 0) return Math.max(length + relative, 0);
  return Math.min(relative, length);
}

export function checkRotate(
  slots: readonly Slot[],
  count: number,
  direction: "left" | "right",
  mode: Mode,
): void {
  const rotate = direction === "left" ? rotateLeft : rotateRight;
  const input = build(slots);
  const before = snapshot(input);
  const length = before.length;
  if (!Number.isInteger(count)) {
    assert.throws(() => rotate(input, count, asOptions(mode)), RangeError);
    assert.deepEqual(
      snapshot(input),
      before,
      "예외가 나도 입력을 바꾸지 않는다",
    );
    return;
  }
  const result = rotate(input, count, asOptions(mode));
  checkCommon(input, before, result, mode);
  if (length > 0) {
    const shift = direction === "left" ? count : -count;
    const source = plain(before.map((s) => (s === HOLE ? undefined : s)));
    const expected = source.map(
      (_, index) => source[(((index + shift) % length) + length) % length],
    );
    assert.deepEqual(
      plain(result),
      expected,
      "result[i]는 원래 (i+count) 위치(rotateRight는 i-count)의 값이다",
    );
  }
  checkSparseReadsAsUndefined(before, result, (array) =>
    rotate(array, count, COPY),
  );
}

/** 반대 방향으로 같은 수만큼 돌리면 원래 값이다. `rotateRight(x, k)`는 `rotateLeft(x, -k)`와 같고, 길이만큼 돌리면 제자리다. */
export function checkRotateInverse(
  slots: readonly Slot[],
  count: number,
): void {
  const input = build(slots);
  const values = plain(input);
  assert.deepEqual(
    plain(rotateRight(rotateLeft(input, count, COPY), count, COPY)),
    values,
    "rotateRight(rotateLeft(x, k), k)는 x다",
  );
  assert.deepEqual(
    plain(rotateRight(input, count, COPY)),
    plain(rotateLeft(input, -count, COPY)),
    "rotateRight(x, k)는 rotateLeft(x, -k)와 같다",
  );
  assert.deepEqual(
    plain(rotateLeft(input, input.length, COPY)),
    values,
    "길이만큼 돌리면 제자리다",
  );
}

export function checkSwap(
  slots: readonly Slot[],
  indexA: number,
  indexB: number,
  mode: Mode,
): void {
  const input = build(slots);
  const before = snapshot(input);
  const length = before.length;
  const source = plain(before.map((s) => (s === HOLE ? undefined : s)));
  const result = swapItems(input, indexA, indexB, asOptions(mode));
  checkCommon(input, before, result, mode);

  const a = validIndex(length, indexA);
  const b = validIndex(length, indexB);
  const expected = [...source];
  if (a >= 0 && b >= 0) {
    expected[a] = source[b];
    expected[b] = source[a];
  }
  assert.deepEqual(
    plain(result),
    expected,
    "유효한 두 위치만 맞바꾸고 나머지는 그대로다",
  );

  assert.deepEqual(
    plain(
      swapItems(swapItems(source, indexA, indexB, COPY), indexA, indexB, COPY),
    ),
    source,
    "같은 두 인덱스로 두 번 바꾸면 원래 값이다",
  );
  checkSparseReadsAsUndefined(before, result, (array) =>
    swapItems(array, indexA, indexB, COPY),
  );
}

type Operation = (array: Plain[], mode: Mode) => Plain[];

/**
 * 빈 슬롯 입력의 현재 동작(특성화). 계약에 정책이 없어 결함인지 확정하지 않았다.
 * - `inplace: false`: 항상 `[...arr]`로 복사하므로 빈 슬롯이 `undefined` 요소가 된다.
 * - `inplace: true`: 빈 슬롯이 늘지 않는다(어떤 슬롯이 채워지는지는 연산마다 다르다).
 * 정책이 정해져 동작이 바뀌면 이 검사를 새 정책에 맞춰 고친다.
 */
export function checkSparseStructure(
  slots: readonly Slot[],
  operation: Operation,
  mode: Mode,
): void {
  const input = build(slots);
  const holesBefore = holeCount(input);
  const result = operation(input, mode);
  if (mode.inplace) {
    assert.ok(
      holeCount(result) <= holesBefore,
      "inplace: true는 빈 슬롯을 늘리지 않는다",
    );
  } else {
    assert.equal(
      holeCount(result),
      0,
      "inplace: false는 빈 슬롯을 undefined로 채운다",
    );
  }
}
