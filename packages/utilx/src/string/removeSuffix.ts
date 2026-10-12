import type { RemoveAffixOptions } from "./RemoveAffixOptions.js";

/**
 * 문자열이 `suffix`로 끝나면 그 부분을 제거한다. 끝나지 않으면 원본을 그대로 돌려준다.
 * 빈 `suffix`는 아무것도 제거하지 않는다.
 *
 * @example
 * removeSuffix('a.json', '.json'); // 'a'
 * removeSuffix('path///', '/', { repeat: true }); // 'path'
 */
export function removeSuffix(
  text: string,
  suffix: string,
  options: RemoveAffixOptions = {},
): string {
  if (suffix.length === 0) return text;

  let result = text;
  while (result.endsWith(suffix)) {
    result = result.slice(0, result.length - suffix.length);
    if (!options.repeat) break;
  }
  return result;
}
