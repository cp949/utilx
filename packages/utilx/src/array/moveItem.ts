import type { ArrayInPlaceOptions } from "./ArrayInPlaceOptions.js";
import type { ArrayCopyOptions } from "./ArrayCopyOptions.js";
import { workingArray } from "./workingArray.internal.js";

/**
 * `fromIndex`의 항목을 `toIndex` 위치로 옮긴다.
 *
 * - `fromIndex`가 음수이면 뒤에서부터 센다(`-1`은 마지막 항목).
 * - `fromIndex`가 범위 밖이거나 정수가 아니면 아무것도 옮기지 않는다.
 * - `toIndex`는 항목을 뺀 뒤의 배열에 끼워 넣는 위치다. `Array.prototype.splice`와 같이 범위를 넘으면 양 끝으로 맞춘다.
 *
 * @example
 * moveItem(['a', 'b', 'c'], 0, 2, { inplace: false }); // ['b', 'c', 'a']
 * moveItem(['a', 'b', 'c'], -1, 0, { inplace: false }); // ['c', 'a', 'b']
 */
export function moveItem<T>(
  arr: T[],
  fromIndex: number,
  toIndex: number,
  options: ArrayInPlaceOptions,
): T[];

export function moveItem<T>(
  arr: readonly T[],
  fromIndex: number,
  toIndex: number,
  options: ArrayCopyOptions,
): T[];

export function moveItem<T>(
  arr: readonly T[],
  fromIndex: number,
  toIndex: number,
  options: { readonly inplace: boolean },
): T[] {
  const result = workingArray(arr, options);
  // NaN과 소수는 범위 비교를 통과하고 splice가 0이나 절삭값으로 바꾼다.
  // 음수 소수는 길이를 더하면 부동소수 반올림으로 정수가 될 수 있어 원래 값을 검사한다.
  if (!Number.isInteger(fromIndex)) return result;
  const from = fromIndex < 0 ? result.length + fromIndex : fromIndex;
  if (from < 0 || from >= result.length || from === toIndex) return result;
  // from은 범위를 확인했으므로 항목이 있다.
  const item = result.splice(from, 1)[0] as T;
  result.splice(toIndex, 0, item);
  return result;
}
