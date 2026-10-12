import { assertLength, cutBefore } from "./truncate.internal.js";

/**
 * 문자열을 최대 `maxLength`(UTF-16 코드 유닛 수)까지만 남긴다. 이모지 같은 서로게이트 쌍은 반으로 자르지 않으므로
 * 결과가 `maxLength`보다 1 짧을 수 있다. `null`과 `undefined`는 빈 문자열이다.
 *
 * @throws {RangeError} `maxLength`가 0 이상의 정수가 아닐 때
 *
 * @example
 * limitMaxLength('abcdef', 3); // 'abc'
 * limitMaxLength(null, 3); // ''
 */
export function limitMaxLength(
  text: string | null | undefined,
  maxLength: number,
): string {
  assertLength(maxLength, "maxLength");
  if (text === null || text === undefined) return "";
  if (text.length <= maxLength) return text;
  return text.slice(0, cutBefore(text, maxLength));
}
