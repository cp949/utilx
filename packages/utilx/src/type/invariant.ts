/**
 * 조건이 거짓이면 예외를 던지고, 통과하면 `condition`을 참으로 좁힌다.
 * 프로그램이 참이라고 가정하는 상태를 확인할 때 쓴다. 사용자 입력 검증에는 쓰지 않는다.
 *
 * @param message 조건이 거짓일 때 예외에 담을 메시지. 필수다
 * @throws {Error} `name`이 `'Invariant Violation'`인 `Error`
 *
 * @example
 * const entry = stack.find((e) => e.key === key);
 * invariant(entry, 'dialog not found');
 * entry.open; // entry는 undefined가 아니다
 */
export function invariant(
  condition: unknown,
  message: string,
): asserts condition {
  if (!condition) {
    const error = new Error(message);
    error.name = "Invariant Violation";
    throw error;
  }
}
