/**
 * 인자 중 `null`도 `undefined`도 아닌 첫 값을 돌려준다. 없으면 `undefined`다.
 *
 * `0`, `''`, `false`, `NaN`은 nil이 아니므로 그대로 돌려준다.
 *
 * @example
 * firstNotNil(null, undefined, 'a', 'b'); // 'a'
 * firstNotNil(undefined, 0, 1); // 0
 * firstNotNil(null, false, true); // false
 * firstNotNil(null, undefined); // undefined
 * firstNotNil(); // undefined
 */
export function firstNotNil<T>(
  ...values: readonly T[]
): NonNullable<T> | undefined {
  return values.find(
    (value): value is NonNullable<T> => value !== null && value !== undefined,
  );
}
