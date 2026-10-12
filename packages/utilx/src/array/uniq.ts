import type { ArrayInPlaceOptions } from "./ArrayInPlaceOptions.js";
import type { ArrayCopyOptions } from "./ArrayCopyOptions.js";
import { workingArray } from "./workingArray.internal.js";
import { dedupeInPlace } from "./dedupeInPlace.internal.js";

/**
 * 중복된 값을 빼고 처음 나온 항목만 남긴다. 순서는 유지한다.
 *
 * @example
 * uniq([1, 2, 2, 3, 1], { inplace: false }); // [1, 2, 3]
 */
export function uniq<T>(arr: T[], options: ArrayInPlaceOptions): T[];

export function uniq<T>(arr: readonly T[], options: ArrayCopyOptions): T[];

export function uniq<T>(
  arr: readonly T[],
  options: { readonly inplace: boolean },
): T[] {
  const result = workingArray(arr, options);
  dedupeInPlace(result, (item) => item);
  return result;
}
