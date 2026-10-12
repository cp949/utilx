/**
 * 브라우저 전용 유틸이다. 호출할 때 `document`, `URL`, `navigator` 등이 필요하다.
 */

/**
 * 클립보드 유틸이다. 호출할 때 `navigator.clipboard`가 필요하다.
 */
export * from "./copyTextToClipboard.js";

/**
 * 브라우저에서 파일을 내려받는 유틸이다. `document`가 필요하고, `downloadBlob`은 `URL.createObjectURL`도 쓴다.
 *
 * 모두 `<a download>` 방식이다. `download` 속성을 지원하지 않는 환경에서는 동작하지 않는다.
 * 사용자 제스처(클릭 등) 안에서 호출해야 브라우저가 다운로드를 막지 않는다.
 */
export * from "./downloadBlob.js";
export * from "./downloadText.js";
export * from "./downloadUrl.js";

/**
 * `Blob`을 `File`로 바꾸는 유틸이다. `File` 생성자가 필요하므로 호출할 때 DOM이 필요하다.
 */
export * from "./blobToFile.js";

/**
 * 카메라·마이크(`getUserMedia`) 스트림 유틸이다.
 */
export * from "./hasGetUserMedia.js";
export * from "./stopMediaStream.js";

export * from "./ObjectUrlRegistry.js";
