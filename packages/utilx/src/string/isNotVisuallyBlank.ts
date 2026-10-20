import { isVisuallyBlank } from "./isVisuallyBlank.js";

/**
 * 화면에 보이는 글자가 하나라도 있으면 `true`를 돌려준다. `isVisuallyBlank`의 반대다.
 *
 * @example
 * isNotVisuallyBlank('a'); // true
 * isNotVisuallyBlank('\u200b'); // false
 */
export function isNotVisuallyBlank(value: string | null | undefined): boolean {
  return !isVisuallyBlank(value);
}
