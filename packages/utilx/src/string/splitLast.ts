/**
 * 마지막으로 나오는 `separator`를 기준으로 문자열을 둘로 나눈다.
 *
 * `separator`가 없거나 빈 문자열이면 `[text, undefined]`다. `separator`는 여러 글자여도 된다.
 *
 * @example
 * splitLast('foo.tar.gz', '.'); // ['foo.tar', 'gz']
 * splitLast('a::b::c', '::'); // ['a::b', 'c']
 * splitLast('foo.', '.'); // ['foo', '']
 * splitLast('foo', '.'); // ['foo', undefined]
 */
export function splitLast(
  text: string,
  separator: string,
): [string, string | undefined] {
  const index = separator.length === 0 ? -1 : text.lastIndexOf(separator);
  if (index < 0) return [text, undefined];
  return [text.slice(0, index), text.slice(index + separator.length)];
}
