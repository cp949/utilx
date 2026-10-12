/**
 * 첫 번째 항목을 돌려준다. 빈 배열이면 `undefined`다.
 *
 * @example
 * firstItem([1, 2, 3]); // 1
 * firstItem([]); // undefined
 */
export function firstItem<T>(arr: readonly T[]): T | undefined {
  return arr[0];
}
