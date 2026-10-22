/**
 * 배열이 오름차순으로 정렬되어 있으면 `true`다. 같은 값이 이어지는 것은 허용한다. 빈 배열과 항목이 하나인 배열은 `true`다.
 *
 * `comparator`를 생략하면 `>`로 비교한다. 이때 `NaN`, `null`, `undefined`가 하나라도 있으면 순서를 정할 수 없으므로 `false`다.
 * `comparator`를 넘기면 `Array.prototype.sort`의 비교 함수와 같은 규칙으로 인접한 두 항목만 비교하고, 항목 값은 따로 검사하지 않는다.
 * 내림차순을 확인하려면 `(a, b) => b - a`처럼 반대로 넘긴다.
 *
 * @example
 * isArraySorted([1, 2, 3]); // true
 * isArraySorted([1, 1, 2]); // true
 * isArraySorted([1, 3, 2]); // false
 * isArraySorted(["a", "b", "c"]); // true
 * isArraySorted([3, 2, 1], (a, b) => b - a); // true
 * isArraySorted([1, NaN]); // false
 */
export function isArraySorted<T>(
  array: readonly T[],
  comparator?: (left: T, right: T) => number,
): boolean {
  if (comparator === undefined) {
    for (const item of array) {
      // NaN은 자기 자신과도 같지 않다
      if (item !== item || item === null || item === undefined) return false;
    }
  }

  for (let index = 1; index < array.length; index += 1) {
    const left = array[index - 1] as T;
    const right = array[index] as T;
    const outOfOrder = comparator ? comparator(left, right) > 0 : left > right;
    if (outOfOrder) return false;
  }

  return true;
}
