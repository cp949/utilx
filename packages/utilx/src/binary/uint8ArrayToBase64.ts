import type { Base64Options } from "./Base64Options.js";

/** `String.fromCharCode`에 한 번에 넘길 바이트 수. 인자 개수 한도를 넘지 않게 나눈다. */
const BASE64_CHUNK_SIZE = 0x8000;

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
