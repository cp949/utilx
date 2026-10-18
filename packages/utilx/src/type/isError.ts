/**
 * `Error` 인스턴스이면 `true`다. 다른 realm(iframe 등)에서 만든 `Error`도 `true`다.
 *
 * - 같은 realm은 `instanceof Error`로 판정한다.
 * - 다른 realm은 `Object.prototype.toString` 태그가 `[object Error]`이고 `Symbol.toStringTag` 속성이 없을 때만 `true`다.
 *   진짜 `Error`에는 이 속성이 없으므로, `Symbol.toStringTag`만 위장한 객체는 `false`다.
 * - 판별 중 예외가 나면(throwing getter, revoked Proxy 등) 예외를 던지지 않고 `false`다.
 *
 * 비적대적 입력을 전제로 한 판별이다. 의도적으로 만든 Proxy는 걸러내지 못한다.
 * `Symbol.toStringTag`를 직접 정의한 다른 realm의 `Error`는 `false`다.
 *
 * @example
 * isError(new TypeError()); // true
 */
export function isError(value: unknown): value is Error {
  try {
    if (value instanceof Error) return true;
    return (
      typeof value === "object" &&
      value !== null &&
      !(Symbol.toStringTag in value) &&
      Object.prototype.toString.call(value) === "[object Error]"
    );
  } catch {
    return false;
  }
}
