/**
 * 바이트 수를 사람이 읽는 문자열로 바꾸는 유틸이다.
 */

/** `formatByteCount` 옵션. */
export interface FormatByteCountOptions {
  /** 단위 사이의 배수다. 기본값은 `1024`다. */
  base?: 1000 | 1024;

  /**
   * 단위 라벨이다. 첫 항목이 바이트 단위다. 기본값은 `['bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']`다.
   * 라벨을 지정하면 `1`바이트도 `units[0]`을 그대로 쓴다.
   */
  units?: readonly string[];
}

const DEFAULT_UNITS: readonly string[] = [
  "bytes",
  "KB",
  "MB",
  "GB",
  "TB",
  "PB",
  "EB",
  "ZB",
  "YB",
];

/**
 * 바이트 수를 `1.5 MB` 같은 문자열로 바꾼다.
 *
 * - 첫 단위(바이트)에서는 정수로 표기한다.
 * - 그 위 단위에서는 10 미만이면 소수 첫째 자리까지, 10 이상이면 정수로 표기한다. 소수부가 `.0`이면 생략한다.
 * - 반올림 결과가 `base`에 닿으면 다음 단위로 올린다. `1023.96 KB`는 `1 MB`로 표기한다.
 * - 음수는 단위를 올리지 않고 바이트 단위로 그대로 표기한다.
 * - 가장 큰 단위를 넘으면 그 단위로 계속 표기한다.
 *
 * @param size 바이트 수. 유한한 수여야 한다
 * @throws {RangeError} `size`가 유한하지 않거나, `base`가 1000/1024가 아니거나, `units`가 비어 있을 때
 *
 * @example
 * formatByteCount(0); // '0 bytes'
 * formatByteCount(1); // '1 byte'
 * formatByteCount(1536); // '1.5 KB'
 * formatByteCount(1536, { base: 1000 }); // '1.5 KB'
 * formatByteCount(5 * 1024 * 1024); // '5 MB'
 * formatByteCount(2048, { units: ['바이트', 'KB'] }); // '2 KB'
 */
export function formatByteCount(
  size: number,
  options: FormatByteCountOptions = {},
): string {
  if (!Number.isFinite(size)) {
    throw new RangeError("size는 유한한 수여야 한다");
  }
  const base = options.base ?? 1024;
  if (base !== 1000 && base !== 1024) {
    throw new RangeError("base는 1000 또는 1024여야 한다");
  }
  const units = options.units ?? DEFAULT_UNITS;
  const lastLevel = units.length - 1;
  if (lastLevel < 0) {
    throw new RangeError("units는 비어 있을 수 없다");
  }

  const unitAt = (level: number) => units[level] as string;

  if (size === 1 && options.units === undefined) return "1 byte";
  if (size < 0) return `${size} ${unitAt(0)}`;

  let level = 0;
  let value = size;
  for (;;) {
    const digits = value < 10 && level > 0 ? 1 : 0;
    const rounded = Number(value.toFixed(digits));
    if (rounded >= base && level < lastLevel) {
      value /= base;
      level += 1;
      continue;
    }
    return `${String(rounded)} ${unitAt(level)}`;
  }
}
