/**
 * 브라우저 전용 유틸이다. `document`와 `URL.createObjectURL`이 필요하다.
 */

/**
 * object URL을 해제하기까지 기다리는 시간(ms)이다.
 * 다운로드 시작 직후 해제하면 일부 브라우저에서 다운로드가 취소될 수 있어 미룬다.
 */
const REVOKE_DELAY_MS = 40000;

/**
 * `Blob`을 지정한 파일 이름으로 내려받는다.
 *
 * `<a download>` 방식이다. `download` 속성을 지원하지 않는 환경에서는 동작하지 않는다.
 * 사용자 제스처(클릭 등) 안에서 호출해야 브라우저가 다운로드를 막지 않는다.
 *
 * @example
 * downloadBlob(new Blob(['hello'], { type: 'text/plain' }), 'hello.txt');
 */
export function downloadBlob(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  anchor.style.display = "none";
  document.body.appendChild(anchor);
  try {
    anchor.click();
  } finally {
    document.body.removeChild(anchor);
    setTimeout(() => {
      URL.revokeObjectURL(url);
    }, REVOKE_DELAY_MS);
  }
}

export { ObjectUrlRegistry } from "./object-url-registry.js";
