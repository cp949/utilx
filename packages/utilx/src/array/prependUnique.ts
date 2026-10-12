import type { ArrayInPlaceOptions } from "./ArrayInPlaceOptions.js";
import type { ArrayCopyOptions } from "./ArrayCopyOptions.js";
import { workingArray } from "./workingArray.internal.js";

/**
 * 배열 앞에 `items` 중 배열에 없는 값만 추가한다. `items`의 순서는 유지하고, `items` 안의 중복도 한 번만 추가한다.
 * 원래 배열에 있던 중복은 손대지 않는다.
 *
 * @example
 * prependUnique([2, 3], [1, 2, 1], { inplace: false }); // [1, 2, 3]
 */
export function prependUnique<T>(
  arr: T[],
  items: readonly T[],
  options: ArrayInPlaceOptions,
): T[];

export function prependUnique<T>(
  arr: readonly T[],
  items: readonly T[],
  options: ArrayCopyOptions,
): T[];

export function prependUnique<T>(
  arr: readonly T[],
  items: readonly T[],
  options: { readonly inplace: boolean },
): T[] {
  const result = workingArray(arr, options);
  const seen = new Set(result);
  const toAdd: T[] = [];
  for (const item of items) {
    if (seen.has(item)) continue;
    seen.add(item);
    toAdd.push(item);
  }
  if (toAdd.length > 0) result.unshift(...toAdd);
  return result;
}
