import {
  DEFAULT_MESSAGE,
  readMessageProperty,
  safeString,
} from "./errorMessage.internal.js";

/**
 * 임의의 throw 값에서 사람이 읽는 메시지를 꺼낸다. 예외를 던지지 않는다.
 *
 * 다음 순서로 판정한다.
 * 1. `null`, `undefined`: `fallback`
 * 2. 문자열: 그대로(빈 문자열도 그대로)
 * 3. 문자열 `message` 속성이 있는 객체: 그 값. `Error`가 아니어도 허용한다. getter가 예외를 던지면 4로 넘어간다
 * 4. 그 외: `String(err)`. 변환이 예외를 던지면 `fallback`
 *
 * @param fallback 메시지를 만들 수 없을 때 쓰는 값. 기본값은 `'unknown'`이다
 *
 * @example
 * extractErrorMessage(new Error('실패')); // '실패'
 * extractErrorMessage({ message: '거부됨' }); // '거부됨'
 * extractErrorMessage(404); // '404'
 * extractErrorMessage(undefined); // 'unknown'
 */
export function extractErrorMessage(
  err: unknown,
  fallback: string = DEFAULT_MESSAGE,
): string {
  if (err === null || err === undefined) return fallback;
  if (typeof err === "string") return err;
  return readMessageProperty(err) ?? safeString(err) ?? fallback;
}
