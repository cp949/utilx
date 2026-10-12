/**
 * 문자열의 길이(UTF-16 코드 유닛 수)를 돌려준다. `null`과 `undefined`는 `0`이다.
 * C의 `strlen`처럼 쓰되, 바이트 수나 글자 수가 아니다. `'😀'`는 `2`, `'가'`는 `1`이다.
 *
 * @example
 * strlen('abc'); // 3
 * strlen(undefined); // 0
 */
export function strlen(text: string | null | undefined): number {
  return text === null || text === undefined ? 0 : text.length;
}
