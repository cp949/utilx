import { assertLength, cutBefore } from "./truncate.internal.js";

/** `truncateMiddle` 옵션. */
export interface TruncateMiddleOptions {
  /** 결과의 최대 길이(UTF-16 코드 유닛 수, `omission` 포함). 기본값은 `30`이다. */
  length?: number;

  /** 가운데에 넣을 생략 표시. 기본값은 `'...'`이다. */
  omission?: string;
}

/** `index`가 서로게이트 쌍 한가운데면 쌍 뒤로 옮긴다. */
function cutAfter(text: string, index: number): number {
  const adjusted = cutBefore(text, index);
  return adjusted === index ? index : index + 1;
}

/**
 * 문자열이 `length`보다 길면 가운데를 `omission`으로 줄여 앞뒤만 남긴다. 파일명이나 긴 ID를 표시할 때 쓴다.
 * 결과 길이는 `omission`을 포함해 `length` 이하이고, 앞쪽이 뒤쪽보다 하나 더 길 수 있다.
 * `omission`이 `length` 이상이면 `omission`을 `length`까지 잘라 돌려준다.
 * 이모지 같은 서로게이트 쌍은 반으로 자르지 않는다. 다만 `omission`을 `length`까지 자르는 위 경우에는
 * UTF-16 코드 유닛 기준으로 자르므로 `omission` 안의 서로게이트 쌍이 잘릴 수 있다.
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
