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
