import type { CleanupFn } from "./CleanupFn.js";

/** 이벤트 리스너 옵션. */
type ListenOptions = boolean | AddEventListenerOptions;

/**
 * 이벤트 리스너를 등록하고, 해제하는 cleanup 함수를 돌려준다.
 * `window`, `document`, `HTMLElement`는 이벤트 이름에 맞게 이벤트 타입이 추론된다.
 *
 * @example
 * const stop = addEventListenerWithCleanup(window, 'resize', (event) => console.log(event.type));
 * stop(); // 리스너 해제
 */
export function addEventListenerWithCleanup<K extends keyof WindowEventMap>(
  target: Window,
  type: K,
  listener: (this: Window, event: WindowEventMap[K]) => unknown,
  options?: ListenOptions,
): CleanupFn;

export function addEventListenerWithCleanup<K extends keyof DocumentEventMap>(
  target: Document,
  type: K,
  listener: (this: Document, event: DocumentEventMap[K]) => unknown,
  options?: ListenOptions,
): CleanupFn;

export function addEventListenerWithCleanup<
  K extends keyof HTMLElementEventMap,
>(
  target: HTMLElement,
  type: K,
  listener: (this: HTMLElement, event: HTMLElementEventMap[K]) => unknown,
  options?: ListenOptions,
): CleanupFn;

export function addEventListenerWithCleanup(
  target: EventTarget,
  type: string,
  listener: EventListenerOrEventListenerObject,
  options?: ListenOptions,
): CleanupFn;

export function addEventListenerWithCleanup(
  target: EventTarget,
  type: string,
  listener: EventListenerOrEventListenerObject,
  options?: ListenOptions,
): CleanupFn {
  target.addEventListener(type, listener, options);
  return () => {
    target.removeEventListener(type, listener, options);
  };
}
