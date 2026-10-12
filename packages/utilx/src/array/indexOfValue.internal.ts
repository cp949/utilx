/** `SameValueZero`로 같은 첫 항목의 위치. 없으면 `-1`이다. */
export function indexOfValue<T>(arr: readonly T[], value: T): number {
  // NaN은 자기 자신과 다르므로 별도로 비교한다.
  return arr.findIndex(
    (item) => item === value || (item !== item && value !== value),
  );
}
