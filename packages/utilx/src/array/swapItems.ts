import type { ArrayInPlaceOptions } from "./ArrayInPlaceOptions.js";
import type { ArrayCopyOptions } from "./ArrayCopyOptions.js";
import { workingArray } from "./workingArray.internal.js";

/** 음수 인덱스를 뒤에서부터 센 위치로 바꾼다. 범위 밖이거나 정수가 아니면 `-1`이다. */
function resolveIndex(length: number, index: number): number {
  // 음수 소수는 길이를 더하면 부동소수 반올림으로 정수가 될 수 있어 원래 값을 검사한다.
  if (!Number.isInteger(index)) return -1;
  const resolved = index < 0 ? length + index : index;
  return resolved >= 0 && resolved < length ? resolved : -1;
}

/**
 * 두 위치의 항목을 서로 바꾼다.
 *
 * - 인덱스가 음수이면 뒤에서부터 센다(`-1`은 마지막 항목).
 * - 인덱스 중 하나라도 범위 밖이거나 정수가 아니면 아무것도 바꾸지 않는다.
 *
 * @example
 * swapItems(['a', 'b', 'c'], 0, 2, { inplace: false }); // ['c', 'b', 'a']
 */
export function swapItems<T>(
  arr: T[],
  indexA: number,
  indexB: number,
  options: ArrayInPlaceOptions,
): T[];

export function swapItems<T>(
  arr: readonly T[],
  indexA: number,
  indexB: number,
  options: ArrayCopyOptions,
): T[];

export function swapItems<T>(
  arr: readonly T[],
  indexA: number,
  indexB: number,
  options: { readonly inplace: boolean },
): T[] {
  const result = workingArray(arr, options);
  const a = resolveIndex(result.length, indexA);
  const b = resolveIndex(result.length, indexB);
  if (a < 0 || b < 0 || a === b) return result;
  const tmp = result[a] as T;
  result[a] = result[b] as T;
  result[b] = tmp;
  return result;
}
