/**
 * 객체 리터럴이나 `Object.create(null)`로 만든 평범한 객체이면 `true`다.
 * 배열, `Map`, `Date`, 클래스 인스턴스는 `false`다. 다른 realm(iframe 등)의 평범한 객체는 `true`다.
 *
 * @example
 * isPlainObject({ a: 1 }); // true
 * isPlainObject(new Map()); // false
 * isPlainObject([]); // false
 */
export function isPlainObject(
  value: unknown,
): value is Record<string, unknown> {
  if (typeof value !== "object" || value === null) return false;

  const prototype: unknown = Object.getPrototypeOf(value);
  return (
    prototype === null ||
    prototype === Object.prototype ||
    // 다른 realm의 Object.prototype은 프로토타입이 null이다.
    Object.getPrototypeOf(prototype) === null
  );
}
