/**
 * `Uint8Array`와 문자열(텍스트, base64, hex) 사이의 변환 유틸이다.
 */

/** `String.fromCharCode`에 한 번에 넘길 바이트 수. 인자 개수 한도를 넘지 않게 나눈다. */
const BASE64_CHUNK_SIZE = 0x8000;

/** base64 변환 옵션. */
export interface Base64Options {
  /** `true`면 URL-safe base64(`-`, `_`)로 만들고 패딩(`=`)을 붙이지 않는다. 기본값은 `false`다. */
  urlSafe?: boolean;
}

/**
 * 문자열을 UTF-8 바이트로 바꾼다.
 *
 * @example
 * stringToUint8Array('Hi'); // Uint8Array [72, 105]
 */
export function stringToUint8Array(text: string): Uint8Array {
  return new TextEncoder().encode(text);
}

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

/**
 * 바이트를 base64 문자열로 바꾼다.
 *
 * @example
 * uint8ArrayToBase64(new Uint8Array([251, 255])); // '+/8='
 * uint8ArrayToBase64(new Uint8Array([251, 255]), { urlSafe: true }); // '-_8'
 */
export function uint8ArrayToBase64(
  array: Uint8Array,
  options: Base64Options = {},
): string {
  let binary = "";
  for (let start = 0; start < array.length; start += BASE64_CHUNK_SIZE) {
    const chunk = array.subarray(start, start + BASE64_CHUNK_SIZE);
    binary += String.fromCharCode.apply(null, chunk as unknown as number[]);
  }

  const base64 = btoa(binary);
  return options.urlSafe
    ? base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "")
    : base64;
}

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

/**
 * 바이트를 소문자 hex 문자열로 바꾼다.
 *
 * @example
 * uint8ArrayToHex(new Uint8Array([0, 15, 255])); // '000fff'
 */
export function uint8ArrayToHex(array: Uint8Array): string {
  let hex = "";
  for (let index = 0; index < array.length; index += 1) {
    const byte = array[index] as number;
    hex += (byte < 16 ? "0" : "") + byte.toString(16);
  }
  return hex;
}

/** hex 문자 하나(`0-9a-fA-F`)의 값. hex 문자가 아니면 `-1`이다. */
function hexDigitValue(code: number): number {
  if (code >= 48 && code <= 57) return code - 48; // 0-9
  if (code >= 97 && code <= 102) return code - 87; // a-f
  if (code >= 65 && code <= 70) return code - 55; // A-F
  return -1;
}

/**
 * hex 문자열을 바이트로 바꾼다. 대소문자를 모두 받는다.
 *
 * @throws {RangeError} 길이가 홀수이거나 hex 문자가 아닌 문자가 있을 때
 *
 * @example
 * hexToUint8Array('000FFf'); // Uint8Array [0, 15, 255]
 */
export function hexToUint8Array(hex: string): Uint8Array {
  if (hex.length % 2 !== 0) {
    throw new RangeError(`hex 문자열의 길이는 짝수여야 한다: ${hex.length}`);
  }

  const bytes = new Uint8Array(hex.length / 2);
  for (let index = 0; index < bytes.length; index += 1) {
    const high = hexDigitValue(hex.charCodeAt(index * 2));
    const low = hexDigitValue(hex.charCodeAt(index * 2 + 1));
    if (high < 0 || low < 0) {
      throw new RangeError(
        `hex 문자가 아닌 문자가 있다: ${index * 2 + (high < 0 ? 0 : 1)}번째`,
      );
    }
    bytes[index] = (high << 4) | low;
  }
  return bytes;
}
