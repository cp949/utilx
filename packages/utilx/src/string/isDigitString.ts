const DIGITS = /^[0-9]+$/;

/**
 * 비어 있지 않고 모두 ASCII 숫자(`0`~`9`)이면 `true`다. 부호, 소수점, 전각 숫자는 `false`다.
 * `null`과 `undefined`는 `false`다.
 *
 * @example
 * isDigitString('0123'); // true
 * isDigitString('-1'); // false
 * isDigitString(''); // false
 */
export function isDigitString(text: string | null | undefined): boolean {
  return typeof text === "string" && DIGITS.test(text);
}
