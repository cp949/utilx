/**
 * 앞에서부터 `count`개의 항목을 새 배열로 돌려준다. 원래 순서를 유지한다.
 * `count`가 길이보다 크면 모든 항목을 돌려주고, `0`이면 빈 배열이다.
 *
 * @throws {RangeError} `count`가 0 이상의 정수가 아닐 때
 *
 * @example
 * firstItems([1, 2, 3, 4], 2); // [1, 2]
 * firstItems([1, 2], 5); // [1, 2]
 * firstItems([1, 2], 0); // []
 */
export function firstItems<T>(arr: readonly T[], count: number): T[] {
  if (!Number.isInteger(count) || count < 0) {
    throw new RangeError("count는 0 이상의 정수여야 한다");
  }
  return arr.slice(0, count);
}
