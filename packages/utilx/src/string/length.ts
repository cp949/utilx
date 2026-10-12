/**
 * 문자열 길이를 재거나 길이에 맞춰 자르는 유틸이다.
 */

/** `truncateMiddle` 옵션. */
export interface TruncateMiddleOptions {
  /** 결과의 최대 길이(UTF-16 코드 유닛 수, `omission` 포함). 기본값은 `30`이다. */
  length?: number;

  /** 가운데에 넣을 생략 표시. 기본값은 `'...'`이다. */
  omission?: string;
}

function assertLength(value: number, name: string): void {
  if (!Number.isInteger(value) || value < 0) {
    throw new RangeError(`${name}은 0 이상의 정수여야 한다: ${value}`);
  }
}

function isHighSurrogate(code: number): boolean {
  return code >= 0xd800 && code <= 0xdbff;
}

function isLowSurrogate(code: number): boolean {
  return code >= 0xdc00 && code <= 0xdfff;
}

/** `index`가 서로게이트 쌍(이모지 등) 한가운데면 쌍 앞으로 옮긴다. */
function cutBefore(text: string, index: number): number {
  if (
    index > 0 &&
    index < text.length &&
    isHighSurrogate(text.charCodeAt(index - 1)) &&
    isLowSurrogate(text.charCodeAt(index))
  ) {
    return index - 1;
  }
  return index;
}

/** `index`가 서로게이트 쌍 한가운데면 쌍 뒤로 옮긴다. */
function cutAfter(text: string, index: number): number {
  const adjusted = cutBefore(text, index);
  return adjusted === index ? index : index + 1;
}

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

/**
 * 문자열을 최대 `maxLength`(UTF-16 코드 유닛 수)까지만 남긴다. 이모지 같은 서로게이트 쌍은 반으로 자르지 않으므로
 * 결과가 `maxLength`보다 1 짧을 수 있다. `null`과 `undefined`는 빈 문자열이다.
 *
 * @throws {RangeError} `maxLength`가 0 이상의 정수가 아닐 때
 *
 * @example
 * limitMaxLength('abcdef', 3); // 'abc'
 * limitMaxLength(null, 3); // ''
 */
export function limitMaxLength(
  text: string | null | undefined,
  maxLength: number,
): string {
  assertLength(maxLength, "maxLength");
  if (text === null || text === undefined) return "";
  if (text.length <= maxLength) return text;
  return text.slice(0, cutBefore(text, maxLength));
}

/**
 * 문자열이 `length`보다 길면 가운데를 `omission`으로 줄여 앞뒤만 남긴다. 파일명이나 긴 ID를 표시할 때 쓴다.
 * 결과 길이는 `omission`을 포함해 `length` 이하이고, 앞쪽이 뒤쪽보다 하나 더 길 수 있다.
 * `omission`이 `length` 이상이면 `omission`을 `length`까지 잘라 돌려준다.
 * 이모지 같은 서로게이트 쌍은 반으로 자르지 않는다.
 *
 * @throws {RangeError} `length`가 0 이상의 정수가 아닐 때
 *
 * @example
 * truncateMiddle('This is a long string that needs truncating.', { length: 20 });
 * // 'This is a...ncating.'
 * truncateMiddle('abcdefghij', { length: 7, omission: '~' }); // 'abc~hij'
 */
export function truncateMiddle(
  text: string,
  options: TruncateMiddleOptions = {},
): string {
  const { length = 30, omission = "..." } = options;
  assertLength(length, "length");
  if (text.length <= length) return text;
  if (omission.length >= length) return omission.slice(0, length);

  const keep = length - omission.length;
  const headLength = Math.ceil(keep / 2);
  const tailLength = Math.floor(keep / 2);

  const head = text.slice(0, cutBefore(text, headLength));
  const tail = text.slice(cutAfter(text, text.length - tailLength));
  return head + omission + tail;
}
