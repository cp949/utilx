/**
 * `Error` 인스턴스이면 `true`다. 다른 realm(iframe 등)에서 만든 `Error`도 `true`다.
 *
 * @example
 * isError(new TypeError()); // true
 */
export function isError(value: unknown): value is Error {
  return (
    value instanceof Error ||
    (typeof value === "object" &&
      value !== null &&
      Object.prototype.toString.call(value) === "[object Error]")
  );
}
