/**
 * 첫 글자를 대문자로 바꾼다. 나머지는 그대로 둔다. 빈 문자열은 빈 문자열이다.
 *
 * @example
 * capitalize('fooBar'); // 'FooBar'
 */
export function capitalize(text: string): string {
  const [first = ""] = text;
  return first.toUpperCase() + text.slice(first.length);
}
