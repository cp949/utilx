/** `%TypedArray%.prototype[Symbol.toStringTag]` getter. 내부 슬롯 `[[TypedArrayName]]`을 읽는다. */
const readTypedArrayName = (
  Object.getOwnPropertyDescriptor(
    Object.getPrototypeOf(Uint8Array.prototype) as object,
    Symbol.toStringTag,
  ) as unknown as { get: (this: unknown) => string | undefined }
).get;

/**
 * 값이 `Uint8Array`이면 `true`다. Node의 `Buffer`도 `Uint8Array`의 하위 클래스라 `true`다.
 * 다른 realm(iframe 등)에서 만든 `Uint8Array`도 `true`다.
 *
 * - 내부 슬롯으로 판별한다. `Symbol.toStringTag`를 위장한 객체, 태그를 위장한 다른 TypedArray,
 *   프로토타입만 `Uint8Array.prototype`으로 바꾼 다른 TypedArray는 `false`다.
 * - 예외를 던지지 않는다. throwing getter나 revoked Proxy도 `false`다.
 *
 * @example
 * isUint8Array(new Uint8Array(2)); // true
 * isUint8Array(new ArrayBuffer(2)); // false
 */
export function isUint8Array(value: unknown): value is Uint8Array {
  return (
    typeof value === "object" &&
    value !== null &&
    readTypedArrayName.call(value) === "Uint8Array"
  );
}
