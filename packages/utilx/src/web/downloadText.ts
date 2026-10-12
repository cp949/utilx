import { downloadBlob } from "./downloadBlob.js";

/** `downloadText` 옵션. */
export interface DownloadTextOptions {
  /** 파일의 MIME 타입. 기본값은 `'text/plain;charset=utf-8'`이다. */
  mimeType?: string;
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
