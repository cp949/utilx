/**
 * 이 환경이 터치 입력을 지원하면 `true`다. `window`에 `ontouchstart`가 있거나 `navigator.maxTouchPoints`가 `0`보다 크면 지원하는 것으로 본다.
 *
 * 터치스크린이 달린 노트북처럼 마우스가 주 입력인 기기도 `true`다. 터치가 주 입력인지는 알려 주지 않는다.
 * 서버(`window`, `navigator` 없음)에서는 `false`다.
 */
export function hasTouchSupport(): boolean {
  if (typeof window !== "undefined" && "ontouchstart" in window) return true;
  return typeof navigator !== "undefined" && navigator.maxTouchPoints > 0;
}
