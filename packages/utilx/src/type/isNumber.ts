/** `typeof value === 'number'`이다. `NaN`, `Infinity`도 `true`다. */
export function isNumber(value: unknown): value is number {
  return typeof value === "number";
}
