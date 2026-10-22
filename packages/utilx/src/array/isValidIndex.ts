import { lengthOf } from "./lengthOf.js";

/**
 * `index`가 `arr` 안의 항목을 가리키면 `true`다. 정수이고 `0 <= index < 길이`일 때 유효하다.
 * 길이와 같은 `index`는 항목이 없으므로 유효하지 않다. `null`과 `undefined`는 길이 `0`으로 본다.
 *
 * @example
 * isValidIndex([1, 2, 3], 2); // true
 * isValidIndex([1, 2, 3], 3); // false
 * isValidIndex([1, 2, 3], -1); // false
 * isValidIndex([1, 2, 3], 1.5); // false
 */
export function isValidIndex(
  arr: { readonly length: number } | null | undefined,
  index: number,
): boolean {
  return Number.isInteger(index) && index >= 0 && index < lengthOf(arr);
}
