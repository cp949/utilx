import type { ArrayInPlaceOptions } from "./ArrayInPlaceOptions.js";
import type { ArrayCopyOptions } from "./ArrayCopyOptions.js";
import { workingArray } from "./workingArray.internal.js";
import { dedupeInPlace } from "./dedupeInPlace.internal.js";

/**
 * 키가 같은 항목 중 처음 나온 것만 남긴다. 순서는 유지한다.
 * `keyOf`는 항목에서 키를 꺼내는 함수이거나 항목의 속성 이름이다. 키는 `SameValueZero`로 비교한다.
 *
 * @example
 * uniqBy([{ id: 1 }, { id: 2 }, { id: 1 }], 'id', { inplace: false }); // [{ id: 1 }, { id: 2 }]
 * uniqBy(['a', 'B', 'A'], (s) => s.toLowerCase(), { inplace: false }); // ['a', 'B']
 */
export function uniqBy<T>(
  arr: T[],
  keyOf: ((item: T) => unknown) | keyof T,
  options: ArrayInPlaceOptions,
): T[];

export function uniqBy<T>(
  arr: readonly T[],
  keyOf: ((item: T) => unknown) | keyof T,
  options: ArrayCopyOptions,
): T[];

export function uniqBy<T>(
  arr: readonly T[],
  keyOf: ((item: T) => unknown) | keyof T,
  options: { readonly inplace: boolean },
): T[] {
  const getKey = typeof keyOf === "function" ? keyOf : (item: T) => item[keyOf];
  const result = workingArray(arr, options);
  dedupeInPlace(result, getKey);
  return result;
}
