/**
 * 비동기 흐름 유틸이다.
 */

/**
 * 지정한 시간만큼 기다린다.
 *
 * `signal`이 abort되면 기다림을 멈추고 `AbortError`로 거부한다. 이미 abort된 시그널이면 즉시 거부한다.
 * 취소와 정상 종료를 호출자가 구분할 수 있다.
 *
 * @example
 * await delay(500);
 *
 * const controller = new AbortController();
 * try {
 *   await delay(5000, controller.signal);
 * } catch (error) {
 *   if (error instanceof DOMException && error.name === 'AbortError') return;
 *   throw error;
 * }
 */
export function delay(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    if (signal?.aborted) {
      reject(createAbortError());
      return;
    }

    const onAbort = () => {
      clearTimeout(timer);
      reject(createAbortError());
    };
    const timer = setTimeout(() => {
      signal?.removeEventListener("abort", onAbort);
      resolve();
    }, ms);
    signal?.addEventListener("abort", onAbort, { once: true });
  });
}

function createAbortError(): DOMException {
  return new DOMException("지연이 취소되었다", "AbortError");
}
