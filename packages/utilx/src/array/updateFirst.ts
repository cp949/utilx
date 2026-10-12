import type { ArrayInPlaceOptions } from "./ArrayInPlaceOptions.js";
import type { ArrayCopyOptions } from "./ArrayCopyOptions.js";
import { workingArray } from "./workingArray.internal.js";

/**
 * 조건에 맞는 첫 번째 항목을 `update`가 돌려준 값으로 바꾼다.
 * 조건에 맞는 항목이 없으면 `undefined`를 돌려주고 배열은 바뀌지 않는다.
 *
 * @example
 * const items = [{ id: 1, on: false }, { id: 2, on: false }];
 * updateFirst(items, (it) => it.id === 2, (it) => ({ ...it, on: true }), { inplace: false });
 * // [{ id: 1, on: false }, { id: 2, on: true }]
 */
export function updateFirst<T>(
  arr: T[],
  match: (item: T, index: number) => boolean,
  update: (item: T, index: number) => T,
  options: ArrayInPlaceOptions,
): T[] | undefined;

export function updateFirst<T>(
  arr: readonly T[],
  match: (item: T, index: number) => boolean,
  update: (item: T, index: number) => T,
  options: ArrayCopyOptions,
): T[] | undefined;

export function updateFirst<T>(
  arr: readonly T[],
  match: (item: T, index: number) => boolean,
  update: (item: T, index: number) => T,
  options: { readonly inplace: boolean },
): T[] | undefined {
  const index = arr.findIndex(match);
  if (index < 0) return undefined;
  const result = workingArray(arr, options);
  // index는 findIndex가 찾은 위치이므로 항목이 있다.
  result[index] = update(arr[index] as T, index);
  return result;
}
