/**
 * 문자열 공백 처리 유틸이다.
 *
 * 공백 기준은 `String.prototype.trim()`과 같다. 전각 공백(U+3000), NBSP(U+00A0), BOM(U+FEFF)도 공백이다.
 */

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

/**
 * 앞뒤 공백을 제거하고, 결과가 비어 있으면 `undefined`를 돌려준다.
 *
 * @example
 * trimToUndef('  a '); // 'a'
 * trimToUndef('   '); // undefined
 * trimToUndef(null); // undefined
 */
export function trimToUndef(
  value: string | null | undefined,
): string | undefined {
  const text = trim(value);
  return text.length === 0 ? undefined : text;
}

/**
 * 값이 없거나 공백뿐이면 `true`를 돌려준다.
 *
 * 타입 가드가 아니다. `false`일 때 `string`이 아닌 쪽으로 좁혀지는 오류를 피하려는 설계이며,
 * 좁힌 값이 필요하면 `trimToUndef`를 쓴다.
 *
 * @example
 * isBlank(''); // true
 * isBlank('  '); // true
 * isBlank(null); // true
 * isBlank(' a '); // false
 */
export function isBlank(value: string | null | undefined): boolean {
  return trim(value).length === 0;
}

/**
 * 공백이 아닌 문자가 하나라도 있으면 `true`를 돌려준다. `isBlank`의 반대다.
 *
 * @example
 * isNotBlank(' a '); // true
 * isNotBlank('  '); // false
 */
export function isNotBlank(value: string | null | undefined): boolean {
  return !isBlank(value);
}
