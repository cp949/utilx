const NUMERIC = /^[+-]?(?:\d+(?:\.\d+)?|\.\d+)$/;

/**
 * 10진수 숫자 표기이면 `true`다. 부호(`+`, `-`), 정수부, 소수부를 허용한다.
 * 빈 문자열, 앞뒤 공백, 지수(`1e3`), 16진수(`0x10`), `Infinity`, `NaN`은 `false`다.
 * 공백이 섞일 수 있는 입력은 `trim`한 뒤 검사한다. `null`과 `undefined`는 `false`다.
 *
 * `Number(text)`가 `NaN`이 아닌지 보는 방식은 빈 문자열과 공백도 숫자로 취급해서 쓰지 않는다.
 *
 * @example
 * isNumericString('-12.5'); // true
 * isNumericString('.5'); // true
 * isNumericString(''); // false
 * isNumericString('1e3'); // false
 */
export function isNumericString(text: string | null | undefined): boolean {
  return typeof text === "string" && NUMERIC.test(text);
}
