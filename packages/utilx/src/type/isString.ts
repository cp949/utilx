/** `typeof value === 'string'`이다. 래퍼 객체(`new String()`)는 `false`다. */
export function isString(value: unknown): value is string {
  return typeof value === "string";
}
