import { isNotBlank } from "./isNotBlank.js";

/**
 * 인자 중 공백이 아닌 문자가 있는 첫 문자열을 돌려준다. 없으면 `undefined`다.
 *
 * 찾은 문자열은 앞뒤 공백을 제거하지 않은 원본 그대로 돌려준다. 공백 기준은 `trim`과 같다.
 *
 * @example
 * firstNotBlank('', '  ', ' a ', 'b'); // ' a '
 * firstNotBlank(null, undefined, 'a'); // 'a'
 * firstNotBlank('', '  '); // undefined
 * firstNotBlank(); // undefined
 */
export function firstNotBlank(
  ...values: readonly (string | null | undefined)[]
): string | undefined {
  return values.find(
    (value): value is string =>
      value !== null && value !== undefined && isNotBlank(value),
  );
}
