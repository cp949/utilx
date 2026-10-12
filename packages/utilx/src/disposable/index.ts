/**
 * 정리(cleanup)가 필요한 자원을 한 scope에 모아 함께 해제하는 유틸이다.
 *
 * React 컴포넌트 언마운트나 페이지 종료처럼 "여러 자원을 한 번에 정리"하는 지점에 쓴다.
 */

export * from "./CleanupFn.js";
export * from "./DisposableScope.js";
export * from "./DisposeError.js";
export * from "./addEventListenerWithCleanup.js";
