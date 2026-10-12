import { lengthOf } from "./lengthOf.js";

/**
 * 비어 있으면 `true`다. `null`과 `undefined`도 비어 있는 것으로 본다. `length`가 있는 값이면 쓸 수 있다.
 * 배열을 `[T, ...T[]]`로 좁히려면 `isNonEmptyArray`를 쓴다.
 *
 * @example
 * isEmpty([]); // true
 * isEmpty(undefined); // true
 * isEmpty([0]); // false
 */
export function isEmpty(
  value: { readonly length: number } | null | undefined,
): boolean {
  return lengthOf(value) === 0;
}
