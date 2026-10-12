/**
 * 값의 타입을 좁히는 타입 가드 모음이다.
 *
 * 모두 `false`일 때 타입이 틀리게 좁혀지지 않는 정확한 가드만 둔다. 그래서 `NaN`을 거르는 `isNumber`나
 * 공백 문자열을 거르는 `isString`은 없다. 그런 판정이 필요하면 가드가 아닌 함수를 따로 쓴다.
 * `null`/`undefined` 판별은 `isNil`, `isNotNil`을 쓴다.
 */

/** `typeof value === 'string'`이다. 래퍼 객체(`new String()`)는 `false`다. */
export function isString(value: unknown): value is string {
  return typeof value === "string";
}

/** `typeof value === 'number'`이다. `NaN`, `Infinity`도 `true`다. */
export function isNumber(value: unknown): value is number {
  return typeof value === "number";
}

/** `typeof value === 'boolean'`이다. */
export function isBoolean(value: unknown): value is boolean {
  return typeof value === "boolean";
}

/**
 * 호출할 수 있는 값이면 `true`다. `async` 함수, 제너레이터 함수, 클래스, 화살표 함수를 모두 포함한다.
 *
 * @example
 * isFunction(async () => 1); // true
 */
export function isFunction<
  T extends (...args: never[]) => unknown = (...args: never[]) => unknown,
>(value: unknown): value is T {
  return typeof value === "function";
}

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

/**
 * 요소가 하나 이상인 배열이면 `true`이고, 타입을 `[T, ...T[]]`로 좁힌다.
 * 좁힌 뒤에는 `array[0]`이 `undefined`가 아닌 `T`로 취급된다(`noUncheckedIndexedAccess`).
 *
 * @example
 * const items: string[] = getItems();
 * if (isNonEmptyArray(items)) console.log(items[0].length);
 */
export function isNonEmptyArray<T>(array: readonly T[]): array is [T, ...T[]] {
  return array.length > 0;
}

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
