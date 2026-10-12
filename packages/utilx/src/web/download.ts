/**
 * 브라우저에서 파일을 내려받는 유틸이다. `document`가 필요하고, `downloadBlob`은 `URL.createObjectURL`도 쓴다.
 *
 * 모두 `<a download>` 방식이다. `download` 속성을 지원하지 않는 환경에서는 동작하지 않는다.
 * 사용자 제스처(클릭 등) 안에서 호출해야 브라우저가 다운로드를 막지 않는다.
 */

/**
 * object URL을 해제하기까지 기다리는 시간(ms)이다.
 * 다운로드 시작 직후 해제하면 일부 브라우저에서 다운로드가 취소될 수 있어 미룬다.
 */
const REVOKE_DELAY_MS = 40000;

/** `downloadText` 옵션. */
export interface DownloadTextOptions {
  /** 파일의 MIME 타입. 기본값은 `'text/plain;charset=utf-8'`이다. */
  mimeType?: string;
}

/**
 * URL을 내려받는다. `fileName`을 생략하면 브라우저가 URL이나 응답 헤더로 파일 이름을 정한다.
 *
 * 같은 출처의 URL, `blob:`, `data:` URL에서 동작한다. 다른 출처의 URL은 브라우저가 `download` 속성을 무시해
 * 내려받지 않고 해당 주소로 이동할 수 있다. 이때는 서버가 `Content-Disposition: attachment`를 보내야 한다.
 *
 * @example
 * downloadUrl('/reports/2026.pdf', '2026-report.pdf');
 */
export function downloadUrl(url: string, fileName = ""): void {
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  anchor.style.display = "none";
  document.body.appendChild(anchor);
  try {
    anchor.click();
  } finally {
    document.body.removeChild(anchor);
  }
}

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

/**
 * 문자열을 UTF-8 텍스트 파일로 내려받는다.
 *
 * @example
 * downloadText('a,b\n1,2', 'data.csv', { mimeType: 'text/csv;charset=utf-8' });
 */
export function downloadText(
  text: string,
  fileName: string,
  options: DownloadTextOptions = {},
): void {
  const { mimeType = "text/plain;charset=utf-8" } = options;
  downloadBlob(new Blob([text], { type: mimeType }), fileName);
}
