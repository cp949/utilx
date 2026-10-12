import { lengthOf } from "./lengthOf.js";

/**
 * 항목이 하나 이상이면 `true`다. `null`과 `undefined`는 `false`다. `length`가 있는 값이면 쓸 수 있다.
 *
 * @example
 * isNotEmpty([1]); // true
 * isNotEmpty([]); // false
 * isNotEmpty(null); // false
 */
export function isNotEmpty(
  value: { readonly length: number } | null | undefined,
): boolean {
  return lengthOf(value) > 0;
}
