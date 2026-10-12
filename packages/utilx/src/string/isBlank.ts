import { trim } from "./trim.js";

/**
 * 값이 없거나 공백뿐이면 `true`를 돌려준다.
 *
 * 타입 가드가 아니다. `false`일 때 `string`이 아닌 쪽으로 좁혀지는 오류를 피하려는 설계이며,
 * 좁힌 값이 필요하면 `trimToUndefined`를 쓴다.
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
