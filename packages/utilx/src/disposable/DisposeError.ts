/**
 * `DisposableScope.dispose()`에서 cleanup이 하나 이상 실패했을 때 던진다.
 * `signal`의 `abort()` 자체가 던진 경우도 담는다. 메시지의 개수에는 이 예외도 포함된다.
 * 실패한 cleanup이 있어도 나머지 cleanup은 끝까지 실행한 뒤에 던진다.
 */
export class DisposeError extends Error {
  /** 실패한 cleanup이 던진 값. 실행 순서(등록의 역순)대로 담는다. `abort()`가 던졌다면 맨 앞에 온다. */
  readonly errors: readonly unknown[];

  constructor(errors: readonly unknown[]) {
    super(`${errors.length}개의 cleanup이 실패했다`);
    this.name = "DisposeError";
    this.errors = errors;
  }
}
