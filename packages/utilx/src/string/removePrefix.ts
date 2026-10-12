import type { RemoveAffixOptions } from "./RemoveAffixOptions.js";

/**
 * 문자열이 `prefix`로 시작하면 그 부분을 제거한다. 시작하지 않으면 원본을 그대로 돌려준다.
 * 빈 `prefix`는 아무것도 제거하지 않는다.
 *
 * @example
 * removePrefix('--flag', '-'); // '-flag'
 * removePrefix('--flag', '-', { repeat: true }); // 'flag'
 */
export function removePrefix(
  text: string,
  prefix: string,
  options: RemoveAffixOptions = {},
): string {
  if (prefix.length === 0) return text;

  let result = text;
  while (result.startsWith(prefix)) {
    result = result.slice(prefix.length);
    if (!options.repeat) break;
  }
  return result;
}
