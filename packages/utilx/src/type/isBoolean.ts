/** `typeof value === 'boolean'`이다. */
export function isBoolean(value: unknown): value is boolean {
  return typeof value === "boolean";
}
