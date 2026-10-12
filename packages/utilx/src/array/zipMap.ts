/**
 * 여러 배열의 같은 위치 항목을 튜플 하나로 묶어 `mapper`에 넘기고, 결과를 모은 배열을 만든다.
 *
 * - 결과 길이는 가장 긴 배열의 길이다.
 * - 짧은 배열의 빈 자리는 `undefined`다. 그래서 튜플 원소 타입에 `undefined`가 포함된다.
 * - `arrays`가 비어 있으면 빈 배열이다.
 *
 * lodash나 es-toolkit의 `zipWith`와 달리 배열들을 하나의 배열로 묶어 첫 인자로 받고,
 * `mapper`는 항목을 여러 인자가 아니라 튜플 하나로 받는다.
 *
 * @example
 * zipMap([[1, 2], [10, 20], [100, 200]], ([a, b, c]) => (a ?? 0) + (b ?? 0) + (c ?? 0));
 * // [111, 222]
 * zipMap([['a', 'b'], [1]], (pair) => pair); // [['a', 1], ['b', undefined]]
 */
export function zipMap<T extends readonly unknown[], U>(
  arrays: { readonly [K in keyof T]: readonly T[K][] },
  mapper: (items: { [K in keyof T]: T[K] | undefined }) => U,
): U[] {
  const lists = arrays as readonly (readonly unknown[])[];
  let length = 0;
  for (const list of lists) {
    if (list.length > length) length = list.length;
  }
  const result: U[] = [];
  for (let i = 0; i < length; i++) {
    const items = lists.map((list) => list[i]);
    result.push((mapper as (items: unknown[]) => U)(items));
  }
  return result;
}
