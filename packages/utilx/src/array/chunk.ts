/**
 * 배열을 `size`개씩 잘라 새 배열의 배열로 돌려준다. 마지막 조각은 `size`보다 짧을 수 있다.
 *
 * 원본은 바꾸지 않는다. 빈 배열은 `[]`다.
 *
 * @throws {RangeError} `size`가 1 이상의 정수가 아닐 때
 *
 * @example
 * chunk([1, 2, 3, 4, 5], 2); // [[1, 2], [3, 4], [5]]
 * chunk([], 3); // []
 */
export function chunk<T>(arr: readonly T[], size: number): T[][] {
  if (!Number.isInteger(size) || size < 1) {
    throw new RangeError("size는 1 이상의 정수여야 한다");
  }
  const result: T[][] = [];
  for (let start = 0; start < arr.length; start += size) {
    result.push(arr.slice(start, start + size));
  }
  return result;
}
