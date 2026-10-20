/**
 * 처음 나오는 `delimiter` 뒤의 부분 문자열을 돌려준다.
 *
 * `delimiter`가 없거나 빈 문자열이면 `missingDelimiterValue`를 돌려준다. 생략하면 `text` 전체다.
 * `missingDelimiterValue`가 빈 문자열이어도 그 값을 돌려준다.
 *
 * @example
 * substringAfter('a.b.c', '.'); // 'b.c'
 * substringAfter('a::b', '::'); // 'b'
 * substringAfter('abc', '.'); // 'abc'
 * substringAfter('abc', '.', ''); // ''
 */
export function substringAfter(
  text: string,
  delimiter: string,
  missingDelimiterValue: string = text,
): string {
  const index = delimiter.length === 0 ? -1 : text.indexOf(delimiter);
  return index < 0
    ? missingDelimiterValue
    : text.slice(index + delimiter.length);
}
