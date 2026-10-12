import { downloadUrl } from "./downloadUrl.js";

/**
 * object URL을 해제하기까지 기다리는 시간(ms)이다.
 * 다운로드 시작 직후 해제하면 일부 브라우저에서 다운로드가 취소될 수 있어 미룬다.
 */
const REVOKE_DELAY_MS = 40000;

/**
 * `Blob`을 지정한 파일 이름으로 내려받는다.
 *
 * @example
 * downloadBlob(new Blob(['hello'], { type: 'text/plain' }), 'hello.txt');
 */
export function downloadBlob(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);
  try {
    downloadUrl(url, fileName);
  } finally {
    setTimeout(() => {
      URL.revokeObjectURL(url);
    }, REVOKE_DELAY_MS);
  }
}
