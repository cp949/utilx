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
