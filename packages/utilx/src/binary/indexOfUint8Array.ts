/**
 * `array` 안에서 바이트열 `search`가 처음 나오는 위치를 돌려준다. 없으면 `-1`이다.
 * 빈 `search`는 `String.prototype.indexOf`처럼 `0`이다.
 *
 * @example
 * indexOfUint8Array(new Uint8Array([1, 2, 3, 2, 3]), new Uint8Array([2, 3])); // 1
 */
export function indexOfUint8Array(
  array: Uint8Array,
  search: Uint8Array,
): number {
  const lastStart = array.length - search.length;
  for (let start = 0; start <= lastStart; start += 1) {
    let matched = true;
    for (let offset = 0; offset < search.length; offset += 1) {
      if (array[start + offset] !== search[offset]) {
        matched = false;
        break;
      }
    }
    if (matched) return start;
  }
  return -1;
}
