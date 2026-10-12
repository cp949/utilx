/** `blobToFile` 옵션. */
export interface BlobToFileOptions {
  /**
   * 결과 `File`의 MIME 타입이다. 생략하거나 빈 문자열이면 `blob.type`을 쓰고,
   * 그것도 비어 있으면 `'application/octet-stream'`이다.
   */
  type?: string;
}

const DEFAULT_TYPE = "application/octet-stream";

/**
 * `Blob`을 지정한 파일 이름의 `File`로 바꾼다. 데이터는 복사하지 않고 `blob`을 그대로 감싼다.
 * `blob`이 이미 `File`이어도 새 `File`을 만든다. 파일 이름을 바꾸는 데 쓸 수 있다.
 * `lastModified`는 지정하지 않으므로 현재 시각이다.
 *
 * @example
 * const file = blobToFile(blob, 'photo.png');
 * blobToFile(blob, 'data.bin', { type: 'application/zip' });
 */
export function blobToFile(
  blob: Blob,
  fileName: string,
  options: BlobToFileOptions = {},
): File {
  const type = options.type || blob.type || DEFAULT_TYPE;
  return new File([blob], fileName, { type });
}
