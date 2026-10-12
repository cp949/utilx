export const DEFAULT_MESSAGE = "unknown";

/** 값에서 문자열 `message` 속성을 읽는다. 없거나 getter가 예외를 던지면 `undefined`다. */
export function readMessageProperty(value: unknown): string | undefined {
  if (
    (typeof value !== "object" && typeof value !== "function") ||
    value === null
  ) {
    return undefined;
  }
  try {
    const message = (value as { message?: unknown }).message;
    return typeof message === "string" ? message : undefined;
  } catch {
    return undefined;
  }
}

/** `String(value)`. 변환이 예외를 던지면 `undefined`다. */
export function safeString(value: unknown): string | undefined {
  try {
    return String(value);
  } catch {
    return undefined;
  }
}
