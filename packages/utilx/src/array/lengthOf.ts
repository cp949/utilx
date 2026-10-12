/**
 * 길이를 돌려준다. `null`과 `undefined`는 `0`이다. 배열뿐 아니라 `length`가 있는 값이면 쓸 수 있다.
 *
 * @example
 * lengthOf([1, 2, 3]); // 3
 * lengthOf(undefined); // 0
 * lengthOf(null); // 0
 */
export function lengthOf(
  value: { readonly length: number } | null | undefined,
): number {
  return value === null || value === undefined ? 0 : value.length;
}
