/**
 * 앞뒤 공백을 제거한다. `null`과 `undefined`는 빈 문자열로 바꾼다.
 *
 * @example
 * trim('  a '); // 'a'
 * trim(undefined); // ''
 */
export function trim(value: string | null | undefined): string {
  return value === null || value === undefined ? "" : value.trim();
}
