/**
 * `/`로 구분하는 POSIX 경로 문자열 유틸이다. 파일 시스템에 접근하지 않고 문자열만 다룬다.
 * 동작은 Node의 `path.posix`와 같다. URL에는 쓰지 않는다(`http://`의 `//`가 합쳐진다).
 */

export * from "./isAbsolutePath.js";
export * from "./joinPath.js";
export * from "./normalizePath.js";
export * from "./parsePath.js";
