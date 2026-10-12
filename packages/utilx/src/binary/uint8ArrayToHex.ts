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
