/**
 * 여러 `Uint8Array`를 이어 붙인 새 배열을 만든다. 빈 목록이면 길이 0인 배열이다.
 *
 * @example
 * concatUint8Arrays([new Uint8Array([1, 2]), new Uint8Array([3])]); // Uint8Array [1, 2, 3]
 */
export function concatUint8Arrays(arrays: readonly Uint8Array[]): Uint8Array {
  let totalLength = 0;
  for (const array of arrays) totalLength += array.length;

  const result = new Uint8Array(totalLength);
  let offset = 0;
  for (const array of arrays) {
    result.set(array, offset);
    offset += array.length;
  }
  return result;
}
