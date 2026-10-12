import { uint8ArrayToString } from "./uint8ArrayToString.js";
import { base64ToUint8Array } from "./base64ToUint8Array.js";

/**
 * base64 문자열을 UTF-8 텍스트로 되돌린다. 일반 base64와 URL-safe base64를 모두 받는다.
 *
 * @throws {DOMException} base64에 쓸 수 없는 문자가 있을 때(`InvalidCharacterError`)
 *
 * @example
 * base64ToString('7JWI64WV'); // '안녕'
 */
export function base64ToString(base64: string): string {
  return uint8ArrayToString(base64ToUint8Array(base64));
}
