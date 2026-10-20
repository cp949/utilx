/**
 * 인자 중 길이가 1 이상인 첫 문자열을 돌려준다. 없으면 `undefined`다.
 *
 * 공백만 있는 문자열도 비어 있지 않은 것으로 본다. 공백을 건너뛰려면 `firstNotBlank`를 쓴다.
 *
 * @example
 * firstNotEmpty('', null, '  ', 'a'); // '  '
 * firstNotEmpty(undefined, 'a', 'b'); // 'a'
 * firstNotEmpty('', null); // undefined
 * firstNotEmpty(); // undefined
 */
export function firstNotEmpty(
  ...values: readonly (string | null | undefined)[]
): string | undefined {
  return values.find(
    (value): value is string =>
      value !== null && value !== undefined && value.length > 0,
  );
}
