import type { FormatByteCountOptions } from "./FormatByteCountOptions.js";
import { compute } from "./byteCountCompute.internal.js";

/**
 * 바이트 수를 `1.5 MB` 같은 문자열로 바꾼다.
 *
 * - 첫 단위(바이트)에서는 정수로 표기한다.
 * - 그 위 단위에서는 `fractionDigits`가 없으면 10 미만은 소수 첫째 자리까지, 10 이상은 정수로 표기한다. 소수부가 `.0`이면 생략한다.
 * - 반올림 결과가 `base`에 닿으면 다음 단위로 올린다. `1023.96 KB`는 `1 MB`로 표기한다. `unit`으로 단위를 고정하면 올리지 않는다.
 * - 음수는 단위를 올리지 않고 바이트 단위로 그대로 표기한다. `unit`으로 단위를 고정한 경우는 그 단위로 환산한다.
 * - 가장 큰 단위를 넘으면 그 단위로 계속 표기한다.
 * - 천 단위 구분자는 넣지 않는다. 필요하면 `formatByteCountToParts`의 `value`를 `toLocaleString`으로 포매팅한다.
 *
 * @param size 바이트 수. 유한한 수여야 한다
 * @throws {RangeError} `size`가 유한하지 않거나, `base`가 1000/1024가 아니거나, `units`가 비어 있거나,
 *   `unit`이 `units`에 없거나, `fractionDigits`가 올바르지 않을 때
 *
 * @example
 * formatByteCount(0); // '0 bytes'
 * formatByteCount(1); // '1 byte'
 * formatByteCount(1536); // '1.5 KB'
 * formatByteCount(1536, { base: 1000 }); // '1.5 KB'
 * formatByteCount(5 * 1024 * 1024); // '5 MB'
 * formatByteCount(2048, { units: ['바이트', 'KB'] }); // '2 KB'
 * formatByteCount(1234567, { fractionDigits: 2 }); // '1.18 MB'
 * formatByteCount(1536, { fractionDigits: { min: 2, max: 2 } }); // '1.50 KB'
 * formatByteCount(3 * 1024 ** 3, { unit: 'MB' }); // '3072 MB'
 */
export function formatByteCount(
  size: number,
  options: FormatByteCountOptions = {},
): string {
  const { text, unit } = compute(size, options);
  return `${text} ${unit}`;
}
