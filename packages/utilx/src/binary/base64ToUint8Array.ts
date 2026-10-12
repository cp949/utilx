/**
 * base64 문자열을 바이트로 바꾼다. 일반 base64와 URL-safe base64를 모두 받고, 패딩(`=`)은 없어도 된다.
 * 공백은 무시한다.
 *
 * @throws {DOMException} base64에 쓸 수 없는 문자가 있을 때(`InvalidCharacterError`)
 *
 * @example
 * base64ToUint8Array('-_8'); // Uint8Array [251, 255]
 */
export function base64ToUint8Array(base64: string): Uint8Array {
  const binary = atob(base64.replace(/-/g, "+").replace(/_/g, "/"));
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes;
}
