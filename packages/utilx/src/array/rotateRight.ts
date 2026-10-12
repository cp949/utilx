import type { ArrayInPlaceOptions } from "./ArrayInPlaceOptions.js";
import type { ArrayCopyOptions } from "./ArrayCopyOptions.js";
import { workingArray } from "./workingArray.internal.js";
import { rotateLeftInPlace } from "./rotateLeftInPlace.internal.js";

/**
 * 배열을 오른쪽으로 `count`칸 돌린다. 뒤의 `count`개가 앞으로 온다.
 * 규칙은 `rotateLeft`와 같고 방향만 반대다.
 *
 * @throws {RangeError} `count`가 정수가 아닐 때
 *
 * @example
 * rotateRight([1, 2, 3, 4], 1, { inplace: false }); // [4, 1, 2, 3]
 */
export function rotateRight<T>(
  arr: T[],
  count: number,
  options: ArrayInPlaceOptions,
): T[];

export function rotateRight<T>(
  arr: readonly T[],
  count: number,
  options: ArrayCopyOptions,
): T[];

export function rotateRight<T>(
  arr: readonly T[],
  count: number,
  options: { readonly inplace: boolean },
): T[] {
  const result = workingArray(arr, options);
  rotateLeftInPlace(result, -count);
  return result;
}
