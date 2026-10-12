import type { FormatByteCountOptions } from "./FormatByteCountOptions.js";
import {
  resolve,
  assertDigits,
  unitLevel,
} from "./byteCountOptions.internal.js";

/** `fractionDigits` 옵션을 검증하고 `{ min, max }`로 바꾼다. 생략하면 `undefined`다. */
export function resolveDigits(
  fractionDigits: FormatByteCountOptions["fractionDigits"],
): { min: number; max: number } | undefined {
  if (fractionDigits === undefined) return undefined;
  if (typeof fractionDigits === "number") {
    assertDigits(fractionDigits, "fractionDigits");
    return { min: 0, max: fractionDigits };
  }
  assertDigits(fractionDigits.min, "fractionDigits.min");
  assertDigits(fractionDigits.max, "fractionDigits.max");
  if (fractionDigits.min > fractionDigits.max) {
    throw new RangeError("fractionDigits.min은 max보다 클 수 없다");
  }
  return fractionDigits;
}

/** `toFixed(max)` 결과에서 끝의 `0`을 `min`자리까지만 남기고 지운다. 지수 표기는 그대로 둔다. */
export function trimFraction(fixed: string, min: number): string {
  if (!fixed.includes(".") || fixed.includes("e")) return fixed;
  let end = fixed.length;
  const dot = fixed.indexOf(".");
  while (end > dot + 1 + min && fixed.charAt(end - 1) === "0") end -= 1;
  if (end === dot + 1) end = dot;
  return fixed.slice(0, end);
}

export interface Computed {
  /** 표시할 수 문자열. */
  text: string;

  /** 반올림한 수. */
  value: number;

  /** 단위 라벨. */
  unit: string;
}

export function compute(
  size: number,
  options: FormatByteCountOptions,
): Computed {
  if (!Number.isFinite(size)) {
    throw new RangeError("size는 유한한 수여야 한다");
  }
  const { base, units } = resolve(options);
  const digits = resolveDigits(options.fractionDigits);
  const fixedLevel =
    options.unit === undefined ? undefined : unitLevel(units, options.unit);

  const lastLevel = units.length - 1;
  const unitAt = (level: number) => units[level] as string;

  if (fixedLevel === undefined && size < 0) {
    return { text: String(size), value: size, unit: unitAt(0) };
  }

  let level = fixedLevel ?? 0;
  let value = size / base ** level;
  for (;;) {
    const maxDigits =
      level === 0 ? 0 : (digits?.max ?? (Math.abs(value) < 10 ? 1 : 0));
    const minDigits = level === 0 ? 0 : (digits?.min ?? 0);
    // 반올림 결과가 0이면 `-0`이 아니라 `0`으로 표기한다.
    const fixed = value.toFixed(maxDigits).replace(/^-(?=0(?:\.0*)?$)/, "");
    const rounded = Number(fixed);
    if (fixedLevel === undefined && rounded >= base && level < lastLevel) {
      value /= base;
      level += 1;
      continue;
    }

    const isSingleByte =
      level === 0 && size === 1 && options.units === undefined;
    return {
      text: trimFraction(fixed, minDigits),
      value: rounded,
      unit: isSingleByte ? "byte" : unitAt(level),
    };
  }
}
