/**
 * 값이 `null`도 `undefined`도 아니면 `true`다. `isNil`의 반대이며 타입을 `NonNullable<T>`로 좁힌다.
 *
 * @example
 * const names = ['a', null, 'b'].filter(isNotNil); // string[]
 */
export function isNotNil<T>(value: T): value is NonNullable<T> {
  return value !== null && value !== undefined;
}
