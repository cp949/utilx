import type { FormatByteCountOptions } from "./FormatByteCountOptions.js";
import { compute } from "./byteCountCompute.internal.js";

/** `formatByteCountToParts` 결과. */
export interface ByteCountParts {
  /** 반올림한 수. 문자열의 끝 `0`을 채우기 전의 값이다(`'1.50'`이면 `1.5`). */
  value: number;

  /** 단위 라벨. `formatByteCount`가 쓰는 것과 같다(`1`바이트는 `'byte'`). */
  unit: string;
}

/**
 * `formatByteCount`와 같은 규칙으로 계산하되, 문자열로 합치기 전의 수와 단위를 나눠 돌려준다.
 * 수와 단위를 따로 배치하거나 수만 `toLocaleString`으로 포매팅할 때 쓴다.
 * `value`는 숫자라서 `fractionDigits.min`으로 채운 끝의 `0`은 없다.
 *
 * @throws {RangeError} `formatByteCount`와 같은 조건
 *
 * @example
 * formatByteCountToParts(1536); // { value: 1.5, unit: 'KB' }
 * formatByteCountToParts(1); // { value: 1, unit: 'byte' }
 * formatByteCountToParts(5 * 1024 ** 3, { unit: 'MB' }); // { value: 5120, unit: 'MB' }
 */
export function formatByteCountToParts(
  size: number,
  options: FormatByteCountOptions = {},
): ByteCountParts {
  const { value, unit } = compute(size, options);
  return { value, unit };
}
