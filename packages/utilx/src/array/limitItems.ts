import type { ArrayInPlaceOptions } from "./ArrayInPlaceOptions.js";
import type { ArrayCopyOptions } from "./ArrayCopyOptions.js";
import { workingArray } from "./workingArray.internal.js";

/**
 * 항목이 `maxCount`개를 넘으면 뒤쪽을 버려 `maxCount`개로 줄인다. 넘지 않으면 그대로 둔다.
 *
 * @throws {RangeError} `maxCount`가 0 이상의 정수가 아닐 때
 *
 * @example
 * limitItems([1, 2, 3, 4], 2, { inplace: false }); // [1, 2]
 * limitItems([1, 2], 5, { inplace: false }); // [1, 2]
 */
export function limitItems<T>(
  arr: T[],
  maxCount: number,
  options: ArrayInPlaceOptions,
): T[];

export function limitItems<T>(
  arr: readonly T[],
  maxCount: number,
  options: ArrayCopyOptions,
): T[];

export function limitItems<T>(
  arr: readonly T[],
  maxCount: number,
  options: { readonly inplace: boolean },
): T[] {
  if (!Number.isInteger(maxCount) || maxCount < 0) {
    throw new RangeError("maxCount는 0 이상의 정수여야 한다");
  }
  const result = workingArray(arr, options);
  if (result.length > maxCount) result.length = maxCount;
  return result;
}
