import { parseNumberOrUndefined } from "./parseNumberOrUndefined.js";

/** `parseIntegerOrUndefined` 옵션. */
export interface ParseIntegerOptions {
  /** 이 값보다 작으면 `undefined`다. 유한한 수여야 한다. */
  min?: number;

  /** 이 값보다 크면 `undefined`다. 유한한 수여야 한다. */
  max?: number;
}

/**
 * 10진수 표기 문자열을 안전한 정수로 바꾼다. 표기 규칙은 `parseNumberOrUndefined`와 같다.
 *
 * - 정수 여부는 문자열이 아니라 변환된 수 값으로 판정한다. `'1.0'`은 `1`이고 `'1.5'`는 `undefined`다.
 * - 안전 정수 범위(`Number.isSafeInteger`)를 벗어나면 `undefined`다. `'9007199254740993'`이 다른 정수로 바뀌는 것을 막는다.
 * - `'1.0000000000000001'`처럼 소수부가 반올림으로 사라지는 입력은 `1`이 된다. 문자열 기준으로 소수를 거르려면
 *   `isDigitString`을 먼저 쓴다.
 *
 * @throws {RangeError} `min`, `max`가 유한한 수가 아니거나 `min`이 `max`보다 클 때
 *
 * @example
 * parseIntegerOrUndefined('42'); // 42
 * parseIntegerOrUndefined('1.0'); // 1
 * parseIntegerOrUndefined('1.5'); // undefined
 * parseIntegerOrUndefined('0', { min: 1 }); // undefined
 */
export function parseIntegerOrUndefined(
  text: string | null | undefined,
  options: ParseIntegerOptions = {},
): number | undefined {
  const { min, max } = options;
  if (min !== undefined && !Number.isFinite(min)) {
    throw new RangeError("min은 유한한 수여야 한다");
  }
  if (max !== undefined && !Number.isFinite(max)) {
    throw new RangeError("max는 유한한 수여야 한다");
  }
  if (min !== undefined && max !== undefined && min > max) {
    throw new RangeError("min은 max보다 클 수 없다");
  }

  const value = parseNumberOrUndefined(text);
  if (value === undefined || !Number.isSafeInteger(value)) return undefined;
  if (min !== undefined && value < min) return undefined;
  if (max !== undefined && value > max) return undefined;
  return value;
}
