import type { ArrayInPlaceOptions } from "./ArrayInPlaceOptions.js";
import type { ArrayCopyOptions } from "./ArrayCopyOptions.js";
import { workingArray } from "./workingArray.internal.js";
import { rotateLeftInPlace } from "./rotateLeftInPlace.internal.js";

/**
 * 배열을 왼쪽으로 `count`칸 돌린다. 앞의 `count`개가 뒤로 간다.
 *
 * - `count`가 길이 이상이면 길이로 나눈 나머지만큼 돌린다.
 * - `count`가 음수이면 오른쪽으로 돌린다.
 * - 빈 배열과 항목이 하나인 배열은 그대로다.
 *
 * @throws {RangeError} `count`가 정수가 아닐 때
 *
 * @example
 * rotateLeft([1, 2, 3, 4], 1, { inplace: false }); // [2, 3, 4, 1]
 */
export function rotateLeft<T>(
  arr: T[],
  count: number,
  options: ArrayInPlaceOptions,
): T[];

export function rotateLeft<T>(
  arr: readonly T[],
  count: number,
  options: ArrayCopyOptions,
): T[];

export function rotateLeft<T>(
  arr: readonly T[],
  count: number,
  options: { readonly inplace: boolean },
): T[] {
  const result = workingArray(arr, options);
  rotateLeftInPlace(result, count);
  return result;
}
