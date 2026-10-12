/**
 * 첫 글자를 소문자로 바꾼다. 나머지는 그대로 둔다. 빈 문자열은 빈 문자열이다.
 *
 * @example
 * uncapitalize('FooBar'); // 'fooBar'
 */
export function uncapitalize(text: string): string {
  const [first = ""] = text;
  return first.toLowerCase() + text.slice(first.length);
}
