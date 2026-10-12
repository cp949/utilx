export const DEFAULT_UNITS: readonly string[] = [
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

export const MAX_FRACTION_DIGITS = 20;

export interface Resolved {
  base: 1000 | 1024;
  units: readonly string[];
}

export function resolveBase(base: number | undefined): 1000 | 1024 {
  const value = base ?? 1024;
  if (value !== 1000 && value !== 1024) {
    throw new RangeError("base는 1000 또는 1024여야 한다");
  }
  return value;
}

export function resolveUnits(
  units: readonly string[] | undefined,
): readonly string[] {
  const value = units ?? DEFAULT_UNITS;
  if (value.length === 0) {
    throw new RangeError("units는 비어 있을 수 없다");
  }
  return value;
}

export function resolve(options: {
  base?: number | undefined;
  units?: readonly string[] | undefined;
}): Resolved {
  return {
    base: resolveBase(options.base),
    units: resolveUnits(options.units),
  };
}

export function assertDigits(value: number, name: string): void {
  if (!Number.isInteger(value) || value < 0 || value > MAX_FRACTION_DIGITS) {
    throw new RangeError(`${name}는 0 이상 20 이하의 정수여야 한다`);
  }
}

export function unitLevel(units: readonly string[], unit: string): number {
  const level = units.indexOf(unit);
  if (level < 0) {
    throw new RangeError(`units에 없는 단위다: ${unit}`);
  }
  return level;
}
