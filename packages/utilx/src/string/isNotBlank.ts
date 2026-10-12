import { isBlank } from "./isBlank.js";

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
