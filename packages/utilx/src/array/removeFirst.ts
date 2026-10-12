import type { ArrayInPlaceOptions } from "./ArrayInPlaceOptions.js";
import type { ArrayCopyOptions } from "./ArrayCopyOptions.js";
import { indexOfValue } from "./indexOfValue.internal.js";
import { workingArray } from "./workingArray.internal.js";

/**
 * 값이 같은 첫 번째 항목을 뺀다. 같은 값이 없으면 그대로 둔다.
 *
 * @example
 * removeFirst([1, 2, 1], 1, { inplace: false }); // [2, 1]
 */
export function removeFirst<T>(
  arr: T[],
  value: T,
  options: ArrayInPlaceOptions,
): T[];

export function removeFirst<T>(
  arr: readonly T[],
  value: T,
  options: ArrayCopyOptions,
): T[];

export function removeFirst<T>(
  arr: readonly T[],
  value: T,
  options: { readonly inplace: boolean },
): T[] {
  const result = workingArray(arr, options);
  const index = indexOfValue(result, value);
  if (index >= 0) result.splice(index, 1);
  return result;
}
