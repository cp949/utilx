import type { ArrayInPlaceOptions } from "./ArrayInPlaceOptions.js";
import type { ArrayCopyOptions } from "./ArrayCopyOptions.js";
import { indexOfValue } from "./indexOfValue.internal.js";
import { workingArray } from "./workingArray.internal.js";

/**
 * 값이 `valueA`인 첫 항목과 `valueB`인 첫 항목의 위치를 서로 바꾼다.
 * 둘 중 하나라도 배열에 없으면 `undefined`를 돌려주고 배열은 바뀌지 않는다.
 * 두 값이 같고 배열에 있으면 그대로 돌려준다.
 *
 * @example
 * swapValues(['a', 'b', 'c'], 'a', 'c', { inplace: false }); // ['c', 'b', 'a']
 * swapValues(['a', 'b'], 'a', 'z', { inplace: false }); // undefined
 */
export function swapValues<T>(
  arr: T[],
  valueA: T,
  valueB: T,
  options: ArrayInPlaceOptions,
): T[] | undefined;

export function swapValues<T>(
  arr: readonly T[],
  valueA: T,
  valueB: T,
  options: ArrayCopyOptions,
): T[] | undefined;

export function swapValues<T>(
  arr: readonly T[],
  valueA: T,
  valueB: T,
  options: { readonly inplace: boolean },
): T[] | undefined {
  const a = indexOfValue(arr, valueA);
  const b = indexOfValue(arr, valueB);
  if (a < 0 || b < 0) return undefined;
  const result = workingArray(arr, options);
  if (a !== b) {
    result[a] = valueB;
    result[b] = valueA;
  }
  return result;
}
