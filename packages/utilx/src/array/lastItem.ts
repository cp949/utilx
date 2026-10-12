/**
 * 마지막 항목을 돌려준다. 빈 배열이면 `undefined`다.
 *
 * @example
 * lastItem([1, 2, 3]); // 3
 * lastItem([]); // undefined
 */
export function lastItem<T>(arr: readonly T[]): T | undefined {
  return arr[arr.length - 1];
}
