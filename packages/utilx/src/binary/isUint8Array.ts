/**
 * 값이 `Uint8Array`이면 `true`다. Node의 `Buffer`도 `Uint8Array`의 하위 클래스라 `true`다.
 * 다른 realm(iframe 등)에서 만든 `Uint8Array`도 `true`다.
 *
 * @example
 * isUint8Array(new Uint8Array(2)); // true
 * isUint8Array(new ArrayBuffer(2)); // false
 */
export function isUint8Array(value: unknown): value is Uint8Array {
  if (value instanceof Uint8Array) return true;
  return (
    typeof value === "object" &&
    value !== null &&
    Object.prototype.toString.call(value) === "[object Uint8Array]"
  );
}
