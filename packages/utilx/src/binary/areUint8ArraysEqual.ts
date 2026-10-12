/**
 * 두 배열의 길이와 모든 바이트가 같으면 `true`다.
 *
 * 상수 시간 비교가 아니다. 비밀 값(토큰, MAC 등)을 비교하는 용도로 쓰지 않는다.
 *
 * @example
 * areUint8ArraysEqual(new Uint8Array([1, 2]), new Uint8Array([1, 2])); // true
 */
export function areUint8ArraysEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a === b) return true;
  if (a.length !== b.length) return false;

  for (let index = 0; index < a.length; index += 1) {
    if (a[index] !== b[index]) return false;
  }
  return true;
}
