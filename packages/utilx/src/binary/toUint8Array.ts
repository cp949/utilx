/**
 * `ArrayBuffer` 또는 `ArrayBuffer`를 감싼 view(`DataView`, 다른 TypedArray 포함)를 복사 없이
 * `Uint8Array`로 바꾼다. 같은 메모리를 가리키므로 복사본이 필요하면 `.slice()`를 호출한다.
 *
 * `Buffer`를 순수 `Uint8Array`로 바꾸는 데도 쓸 수 있다.
 *
 * @throws {TypeError} `ArrayBuffer`도 view도 아닐 때
 *
 * @example
 * toUint8Array(new Uint16Array([1, 2])); // Uint8Array(4) [1, 0, 2, 0] (리틀 엔디언 환경)
 */
export function toUint8Array(value: ArrayBuffer | ArrayBufferView): Uint8Array {
  if (ArrayBuffer.isView(value)) {
    return new Uint8Array(value.buffer, value.byteOffset, value.byteLength);
  }
  if (
    value instanceof ArrayBuffer ||
    Object.prototype.toString.call(value) === "[object ArrayBuffer]"
  ) {
    return new Uint8Array(value);
  }
  throw new TypeError("ArrayBuffer 또는 ArrayBuffer view여야 한다");
}
