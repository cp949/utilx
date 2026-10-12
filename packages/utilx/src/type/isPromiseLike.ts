/**
 * `then` 메서드를 가진 객체(Promise 또는 thenable)이면 `true`다.
 *
 * @example
 * isPromiseLike(Promise.resolve(1)); // true
 * isPromiseLike({ then() {} }); // true
 */
export function isPromiseLike<T = unknown>(
  value: unknown,
): value is PromiseLike<T> {
  return (
    (typeof value === "object" || typeof value === "function") &&
    value !== null &&
    typeof (value as { then?: unknown }).then === "function"
  );
}
