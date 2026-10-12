/** `formatByteCount`, `formatByteCountToParts` 옵션. */
export interface FormatByteCountOptions {
  /** 단위 사이의 배수다. 기본값은 `1024`다. */
  base?: 1000 | 1024;

  /**
   * 단위 라벨이다. 첫 항목이 바이트 단위다. 기본값은 `['bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']`다.
   * 라벨을 지정하면 `1`바이트도 `units[0]`을 그대로 쓴다.
   */
  units?: readonly string[];

  /**
   * 소수 자릿수다. 수를 주면 최대 자릿수이고 끝의 `0`은 지운다. `{ min, max }`를 주면 최소 `min`자리까지 `0`으로 채운다.
   * 각각 0 이상 20 이하의 정수여야 하고 `min`은 `max`보다 클 수 없다.
   * 생략하면 10 미만은 소수 첫째 자리까지, 10 이상은 정수로 표기한다.
   * 첫 단위(바이트)는 이 옵션과 상관없이 정수로 표기한다.
   */
  fractionDigits?: number | { min: number; max: number };

  /**
   * 표기 단위를 `units` 안의 라벨 하나로 고정한다. 반올림 결과가 `base`에 닿아도 다음 단위로 올리지 않는다.
   * `units`에 없는 라벨이면 `RangeError`다. 생략하면 크기에 맞는 단위를 고른다.
   */
  unit?: string;
}
