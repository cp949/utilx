/**
 * 뒤에서부터 `count`개의 항목을 새 배열로 돌려준다. 원래 순서를 유지한다.
 * `count`가 길이보다 크면 모든 항목을 돌려주고, `0`이면 빈 배열이다.
 *
 * @throws {RangeError} `count`가 0 이상의 정수가 아닐 때
 *
 * @example
 * lastItems([1, 2, 3, 4], 2); // [3, 4]
 * lastItems([1, 2], 5); // [1, 2]
 * lastItems([1, 2], 0); // []
 */
export function lastItems<T>(arr: readonly T[], count: number): T[] {
  if (!Number.isInteger(count) || count < 0) {
    throw new RangeError("count는 0 이상의 정수여야 한다");
  }
  // slice(-0)은 전체를 돌려주므로 0은 따로 처리한다.
  return count === 0 ? [] : arr.slice(-count);
}
