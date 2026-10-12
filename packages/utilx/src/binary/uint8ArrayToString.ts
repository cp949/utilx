/**
 * 바이트를 문자열로 바꾼다. 기본 인코딩은 UTF-8이며, UTF-8의 BOM은 제거한다.
 * `encoding`에는 WHATWG 인코딩 이름(`'shift_jis'`, `'euc-kr'`, `'utf-16le'` 등)을 쓴다.
 * 지원하는 인코딩은 브라우저마다 다르다.
 *
 * @throws {RangeError} 브라우저가 모르는 `encoding`일 때
 *
 * @example
 * uint8ArrayToString(new Uint8Array([72, 105])); // 'Hi'
 */
export function uint8ArrayToString(
  array: Uint8Array,
  encoding = "utf-8",
): string {
  return new TextDecoder(encoding).decode(array);
}
