import type { ArrayInPlaceOptions } from "./ArrayInPlaceOptions.js";
import type { ArrayCopyOptions } from "./ArrayCopyOptions.js";
import { workingArray } from "./workingArray.internal.js";

/**
 * 배열 끝에 `items` 중 배열에 없는 값만 추가한다. `items` 안의 중복도 한 번만 추가한다.
 * 원래 배열에 있던 중복은 손대지 않는다.
 *
 * @example
 * appendUnique([1, 2], [2, 3, 3], { inplace: false }); // [1, 2, 3]
 *
 * const values = [1, 2];
 * appendUnique(values, [3], { inplace: true }); // values는 [1, 2, 3]이다
 */
export function appendUnique<T>(
  arr: T[],
  items: readonly T[],
  options: ArrayInPlaceOptions,
): T[];

export function appendUnique<T>(
  arr: readonly T[],
  items: readonly T[],
  options: ArrayCopyOptions,
): T[];

export function appendUnique<T>(
  arr: readonly T[],
  items: readonly T[],
  options: { readonly inplace: boolean },
): T[] {
  const result = workingArray(arr, options);
  const seen = new Set(result);
  for (const item of items) {
    if (seen.has(item)) continue;
    seen.add(item);
    result.push(item);
  }
  return result;
}
