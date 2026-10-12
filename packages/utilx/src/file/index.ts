/**
 * 파일 이름에서 확장자와 기본 이름을 나누는 유틸이다. 경로는 다루지 않는다.
 *
 * 확장자는 마지막 `.` 뒤의 문자열이다. 다음은 확장자가 없는 것으로 본다.
 * - `.`이 없는 이름: `README`
 * - `.`으로 시작하는 이름(숨김 파일): `.bashrc`
 * - `.`으로 끝나는 이름: `file.`
 */

export * from "./fileBaseName.js";
export * from "./fileExtension.js";
