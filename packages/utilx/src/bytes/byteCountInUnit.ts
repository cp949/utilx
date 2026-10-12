import {
  resolve,
  assertDigits,
  unitLevel,
} from "./byteCountOptions.internal.js";

/** `byteCountInUnit` 옵션. */
export interface ByteCountInUnitOptions {
  /** 단위 사이의 배수다. 기본값은 `1024`다. */
  base?: 1000 | 1024;

  /** `unit`을 찾을 라벨 목록이다. 첫 항목이 바이트 단위다. 기본값은 `formatByteCount`와 같다. */
  units?: readonly string[];

  /** 반올림할 소수 자릿수다. 0 이상 20 이하의 정수이고 기본값은 `0`이다. */
  fractionDigits?: number;
}

/**
 * 바이트 수를 지정한 단위로 환산한 수를 돌려준다. 합산 같은 계산용이다.
 * `fractionDigits`자리까지 `Math.round`로 반올림하고, 단위를 올리거나 내리지 않는다.
 *
 * @param size 바이트 수. 유한한 수여야 한다
 * @param unit 환산할 단위. `units` 안의 라벨이어야 한다
 * @throws {RangeError} `size`가 유한하지 않거나, `base`가 1000/1024가 아니거나, `units`가 비어 있거나,
 *   `unit`이 `units`에 없거나, `fractionDigits`가 올바르지 않을 때
 *
 * @example
 * byteCountInUnit(3 * 1024 ** 3, 'GB'); // 3
 * byteCountInUnit(1536 * 1024 ** 2, 'GB', { fractionDigits: 1 }); // 1.5
 * byteCountInUnit(1500, 'KB', { base: 1000 }); // 2
 */
export function byteCountInUnit(
  size: number,
  unit: string,
  options: ByteCountInUnitOptions = {},
): number {
  if (!Number.isFinite(size)) {
    throw new RangeError("size는 유한한 수여야 한다");
  }
  const { base, units } = resolve(options);
  const level = unitLevel(units, unit);
  const fractionDigits = options.fractionDigits ?? 0;
  assertDigits(fractionDigits, "fractionDigits");

  const value = size / base ** level;
  const factor = 10 ** fractionDigits;
  const rounded = Math.round(value * factor) / factor;
  return rounded === 0 ? 0 : rounded;
}
