import { lengthOf } from "./lengthOf.js";

/**
 * `[startIndex, endIndex)` 구간이 `arr` 안에서 비어 있지 않은 유효한 구간이면 `true`다.
 * 두 인덱스가 정수이고 `0 <= startIndex < endIndex <= 길이`일 때 유효하다.
 * `startIndex === endIndex`인 빈 구간은 유효하지 않다. `null`과 `undefined`는 길이 `0`으로 본다.
 *
 * @example
 * isValidIndexRange([1, 2, 3], 0, 3); // true
 * isValidIndexRange([1, 2, 3], 2, 2); // false
 * isValidIndexRange([1, 2, 3], 1, 4); // false
 */
export function isValidIndexRange(
  arr: { readonly length: number } | null | undefined,
  startIndex: number,
  endIndex: number,
): boolean {
  return (
    Number.isInteger(startIndex) &&
    Number.isInteger(endIndex) &&
    startIndex >= 0 &&
    startIndex < endIndex &&
    endIndex <= lengthOf(arr)
  );
}
