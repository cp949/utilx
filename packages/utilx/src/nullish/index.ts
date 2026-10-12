/**
 * `null`과 `undefined`(nil) 판별 유틸이다.
 */

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

/**
 * 값이 `null`도 `undefined`도 아니면 `true`다. `isNil`의 반대이며 타입을 `NonNullable<T>`로 좁힌다.
 *
 * @example
 * const names = ['a', null, 'b'].filter(isNotNil); // string[]
 */
export function isNotNil<T>(value: T): value is NonNullable<T> {
  return value !== null && value !== undefined;
}
