import { isNumericString } from "../string/isNumericString.js";

/**
 * 10진수 표기 문자열을 유한한 수로 바꾼다. 앞뒤 공백은 무시한다.
 * 빈 문자열, 공백뿐인 문자열, 숫자 표기가 아닌 문자열, `null`, `undefined`는 `undefined`다.
 * 유한한 범위를 넘는 큰 수(`'9'`를 400번 반복한 문자열 등)도 `undefined`다. `-0`은 `0`으로 돌려준다.
 *
 * `Number('')`와 `Number('  ')`가 `0`이 되는 것을 막는 것이 목적이다.
 *
 * @example
 * parseNumberOrUndefined(' 12.5 '); // 12.5
 * parseNumberOrUndefined(''); // undefined
 * parseNumberOrUndefined('12abc'); // undefined
 * parseNumberOrUndefined('1e3'); // undefined
 */
export function parseNumberOrUndefined(
  text: string | null | undefined,
): number | undefined {
  if (typeof text !== "string") return undefined;
  const trimmed = text.trim();
  if (!isNumericString(trimmed)) return undefined;
  const value = Number(trimmed);
  if (!Number.isFinite(value)) return undefined;
  return value === 0 ? 0 : value;
}
