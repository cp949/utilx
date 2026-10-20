/**
 * 문자열을 `RegExp` 안에서 글자 그대로 일치하는 패턴으로 바꾼다.
 *
 * `-`는 `\x2d`로 바꾼다. `u` 플래그 패턴과 문자 클래스(`[...]`) 안에서도 쓸 수 있게 하려는 것이다.
 * sindresorhus/escape-string-regexp(MIT)의 구현을 바탕으로 한다. 저작권·허가 고지는 패키지 LICENSE에 있다.
 *
 * @example
 * escapeStringRegexp('How much $ for a 🦄?'); // 'How much \\$ for a 🦄\\?'
 * new RegExp(escapeStringRegexp('a.b')).test('axb'); // false
 */
export function escapeStringRegexp(text: string): string {
  return text.replace(/[|\\{}()[\]^$+*?.]/g, "\\$&").replace(/-/g, "\\x2d");
}
