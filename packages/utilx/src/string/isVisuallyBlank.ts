/** 화면에 글자로 그려지지 않는 코드포인트: 공백, 기본 무시 코드포인트(제로 너비 문자 등), 점자 빈칸. */
const INVISIBLE_ONLY =
  /^[\p{White_Space}\p{Default_Ignorable_Code_Point}\u2800]*$/u;

/**
 * 값이 없거나 화면에 보이는 글자가 하나도 없으면 `true`를 돌려준다.
 *
 * `isBlank`는 `String.prototype.trim()`의 공백만 본다. 이 함수는 제로 너비 문자(`U+200B`~`U+200D`, `U+2060`),
 * 소프트 하이픈(`U+00AD`), 한글 채움 문자(`U+3164`, `U+115F`, `U+1160`, `U+FFA0`), 방향 표시, 변형 선택자,
 * 점자 빈칸(`U+2800`)처럼 보이지 않는 문자도 공백으로 본다. 사용자 이름처럼 비어 보이는 입력을 거를 때 쓴다.
 *
 * 타입 가드가 아니다. `false`일 때 `string`이 아닌 쪽으로 좁혀지는 오류를 피하려는 설계다.
 *
 * @example
 * isVisuallyBlank(''); // true
 * isVisuallyBlank(' \t\n'); // true
 * isVisuallyBlank('\u200b'); // true (제로 너비 공백)
 * isVisuallyBlank('\u3164'); // true (한글 채움 문자)
 * isVisuallyBlank(null); // true
 * isVisuallyBlank('a'); // false
 * isBlank('\u200b'); // false
 */
export function isVisuallyBlank(value: string | null | undefined): boolean {
  return value === null || value === undefined || INVISIBLE_ONLY.test(value);
}
