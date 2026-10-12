import type { Base64Options } from "./Base64Options.js";
import { stringToUint8Array } from "./stringToUint8Array.js";
import { uint8ArrayToBase64 } from "./uint8ArrayToBase64.js";

/**
 * 문자열을 UTF-8로 인코딩한 뒤 base64로 바꾼다. `btoa`와 달리 한글 등 유니코드를 그대로 받는다.
 *
 * @example
 * stringToBase64('안녕'); // '7JWI64WV'
 */
export function stringToBase64(
  text: string,
  options: Base64Options = {},
): string {
  return uint8ArrayToBase64(stringToUint8Array(text), options);
}
