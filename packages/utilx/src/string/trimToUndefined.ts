import { trim } from "./trim.js";

/**
 * 앞뒤 공백을 제거하고, 결과가 비어 있으면 `undefined`를 돌려준다.
 *
 * @example
 * trimToUndefined('  a '); // 'a'
 * trimToUndefined('   '); // undefined
 * trimToUndefined(null); // undefined
 */
export function trimToUndefined(
  value: string | null | undefined,
): string | undefined {
  const text = trim(value);
  return text.length === 0 ? undefined : text;
}
