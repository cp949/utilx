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
 * await sleep(500);
 *
 * const controller = new AbortController();
 * try {
 *   await sleep(5000, controller.signal);
 * } catch (error) {
 *   if (error instanceof DOMException && error.name === 'AbortError') return;
 *   throw error;
 * }
 */
export function sleep(ms: number, signal?: AbortSignal): Promise<void> {
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

/**
 * 다음 애니메이션 프레임까지 기다린다(`requestAnimationFrame`). DOM 변경이 화면에 반영된 뒤에 이어서
 * 작업할 때 쓴다. `requestAnimationFrame`이 없는 환경(서버 등)에서는 `setTimeout(0)` 뒤에 완료한다.
 *
 * 브라우저는 백그라운드 탭에서 프레임을 멈추므로, 탭이 숨겨져 있으면 탭이 다시 보일 때까지 완료되지 않는다.
 *
 * @example
 * element.classList.add('visible');
 * await nextAnimationFrame();
 * element.focus();
 */
export function nextAnimationFrame(): Promise<void> {
  return new Promise<void>((resolve) => {
    if (typeof requestAnimationFrame === "function") {
      requestAnimationFrame(() => {
        resolve();
      });
    } else {
      setTimeout(resolve, 0);
    }
  });
}
