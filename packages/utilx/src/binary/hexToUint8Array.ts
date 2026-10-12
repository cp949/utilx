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
