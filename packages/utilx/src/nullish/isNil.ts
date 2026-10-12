/**
 * 값이 `null` 또는 `undefined`이면 `true`다. `0`, `''`, `false`, `NaN`은 nil이 아니다.
 *
 * @example
 * isNil(null); // true
 * isNil(undefined); // true
 * isNil(0); // false
 * isNil(''); // false
 */
export function isNil(value: unknown): value is null | undefined {
  return value === null || value === undefined;
}
