/**
 * 문자열을 UTF-8 바이트로 바꾼다.
 *
 * @example
 * stringToUint8Array('Hi'); // Uint8Array [72, 105]
 */
export function stringToUint8Array(text: string): Uint8Array {
  return new TextEncoder().encode(text);
}
