/**
 * 두 배열을 앞에서부터 바이트 단위로 비교해 순서를 돌려준다. `sort`의 비교 함수로 쓴다.
 * 앞부분이 모두 같으면 짧은 배열이 먼저다.
 *
 * @example
 * [new Uint8Array([2]), new Uint8Array([1, 9])].sort(compareUint8Arrays); // [[1, 9], [2]]
 */
export function compareUint8Arrays(a: Uint8Array, b: Uint8Array): -1 | 0 | 1 {
  const length = Math.min(a.length, b.length);
  for (let index = 0; index < length; index += 1) {
    const diff = (a[index] as number) - (b[index] as number);
    if (diff !== 0) return diff < 0 ? -1 : 1;
  }
  if (a.length === b.length) return 0;
  return a.length < b.length ? -1 : 1;
}
