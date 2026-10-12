/**
 * 문자열의 앞뒤 일부를 제거하거나 부분 문자열을 바꾸는 유틸이다.
 */

/** `removePrefix`, `removeSuffix` 옵션. */
export interface RemoveAffixOptions {
  /** `true`면 앞(뒤)에 계속 붙어 있는 동안 반복해서 제거한다. 기본값은 `false`다. */
  repeat?: boolean;
}

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

/**
 * 문자열이 `prefix`로 시작하고 `suffix`로 끝날 때만 양쪽을 제거한다. `suffix`를 생략하면 `prefix`와 같다.
 * 둘 중 하나라도 맞지 않거나 비어 있거나, 겹쳐서 둘을 합친 길이가 문자열보다 길면 원본을 그대로 돌려준다.
 *
 * @example
 * removeSurrounding('"hi"', '"'); // 'hi'
 * removeSurrounding('[hi]', '[', ']'); // 'hi'
 * removeSurrounding('"hi', '"'); // '"hi'
 */
export function removeSurrounding(
  text: string,
  prefix: string,
  suffix: string = prefix,
): string {
  if (prefix.length === 0 || suffix.length === 0) return text;
  if (text.length < prefix.length + suffix.length) return text;
  if (!text.startsWith(prefix) || !text.endsWith(suffix)) return text;
  return text.slice(prefix.length, text.length - suffix.length);
}

/**
 * `search`와 일치하는 모든 부분을 `replacement`로 바꾼다. 정규식이 아니라 문자열 그대로 비교하고,
 * `replacement`의 `$&` 같은 특수 패턴도 해석하지 않는다.
 * `String.prototype.replaceAll`(Chrome 85)을 쓸 수 없는 환경을 위한 함수다.
 * 빈 `search`는 아무것도 바꾸지 않는다(표준 `replaceAll('')`과 다르다).
 *
 * @example
 * replaceAll('a.b.c', '.', '/'); // 'a/b/c'
 * replaceAll('price', 'price', '$&'); // '$&'
 */
export function replaceAll(
  text: string,
  search: string,
  replacement: string,
): string {
  if (search.length === 0) return text;
  return text.split(search).join(replacement);
}
