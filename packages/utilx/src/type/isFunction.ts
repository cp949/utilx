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
