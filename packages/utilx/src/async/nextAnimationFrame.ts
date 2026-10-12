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
