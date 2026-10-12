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
