import { isError } from "../type/isError.js";
import {
  DEFAULT_MESSAGE,
  readMessageProperty,
  safeString,
} from "./errorMessage.internal.js";

/** `toError`가 돌려주는 타입. `lib`이 ES2019라 `Error.cause` 타입이 없어서 직접 선언한다. */
export type ErrorWithCause = Error & { cause?: unknown };

/** `JSON.stringify(value)`. 문자열이 나오지 않거나 예외를 던지면 `undefined`다. */
function safeJson(value: unknown): string | undefined {
  try {
    const json: unknown = JSON.stringify(value);
    return typeof json === "string" ? json : undefined;
  } catch {
    return undefined;
  }
}

/**
 * 임의의 throw 값을 `Error`로 바꾼다. 예외를 던지지 않는다.
 *
 * - `isError`가 `true`이면 그대로 돌려준다. 다른 realm(iframe 등)의 `Error`도 그대로 보존한다.
 *   `message` 같은 필드 값은 검증하지 않는다. `Symbol.toStringTag`만 위장한 객체는 `isError`가 `false`라 새 `Error`로 감싼다.
 * - 그 외에는 새 `Error`를 만들고 원래 값을 `cause`에 담는다. `cause`는 열거되지 않는 속성이다.
 * - 메시지는 다음 순서로 정한다. `null`/`undefined`는 `'unknown'`, 문자열은 그대로, 문자열 `message` 속성이 있으면 그 값,
 *   객체는 `JSON.stringify` 결과, 그 외(또는 직렬화 실패)는 `String(err)`, 그것도 실패하면 `'unknown'`이다.
 *
 * @example
 * toError(new TypeError('x')); // 같은 TypeError
 * toError('실패').message; // '실패'
 * toError({ code: 1 }).message; // '{"code":1}'
 * toError({ code: 1 }).cause; // { code: 1 }
 */
export function toError(err: unknown): ErrorWithCause {
  try {
    if (isError(err)) return err;
  } catch {
    // Proxy나 태그 getter로 판별이 실패해도 기존 메시지 변환을 계속한다.
  }

  let message: string | undefined;
  if (err === null || err === undefined) {
    message = DEFAULT_MESSAGE;
  } else if (typeof err === "string") {
    message = err;
  } else {
    message =
      readMessageProperty(err) ??
      (typeof err === "object" ? safeJson(err) : undefined) ??
      safeString(err) ??
      DEFAULT_MESSAGE;
  }

  const error: ErrorWithCause = new Error(message);
  Object.defineProperty(error, "cause", {
    value: err,
    enumerable: false,
    writable: true,
    configurable: true,
  });
  return error;
}
