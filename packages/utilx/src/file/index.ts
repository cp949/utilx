/**
 * 파일 이름에서 확장자와 기본 이름을 나누는 유틸이다. 경로는 다루지 않는다.
 *
 * 확장자는 마지막 `.` 뒤의 문자열이다. 다음은 확장자가 없는 것으로 본다.
 * - `.`이 없는 이름: `README`
 * - `.`으로 시작하는 이름(숨김 파일): `.bashrc`
 * - `.`으로 끝나는 이름: `file.`
 */

/** `fileExtension` 옵션. */
export interface FileExtensionOptions {
  /** `true`면 소문자로 바꾼다. 기본값은 `false`다. */
  lowerCase?: boolean;

  /** `true`면 앞에 `.`을 붙인다. 기본값은 `false`다. */
  withDot?: boolean;
}

/** 확장자를 나누는 `.`의 위치. 확장자가 없으면 `-1`이다. */
function extensionDotIndex(fileName: string): number {
  const index = fileName.lastIndexOf(".");
  return index > 0 && index < fileName.length - 1 ? index : -1;
}

/**
 * 파일 이름의 확장자를 돌려준다. 확장자가 없으면 `null`이다.
 *
 * @example
 * fileExtension('a.tar.gz'); // 'gz'
 * fileExtension('Photo.JPG', { lowerCase: true }); // 'jpg'
 * fileExtension('a.png', { withDot: true }); // '.png'
 * fileExtension('.bashrc'); // null
 * fileExtension('README'); // null
 */
export function fileExtension(
  fileName: string,
  options: FileExtensionOptions = {},
): string | null {
  const index = extensionDotIndex(fileName);
  if (index < 0) return null;

  const extension = fileName.slice(index + 1);
  const cased = options.lowerCase ? extension.toLowerCase() : extension;
  return options.withDot ? `.${cased}` : cased;
}

/**
 * 확장자를 뺀 이름을 돌려준다. 확장자가 없으면 이름을 그대로 돌려준다.
 *
 * @example
 * fileBaseName('a.tar.gz'); // 'a.tar'
 * fileBaseName('.bashrc'); // '.bashrc'
 * fileBaseName('README'); // 'README'
 */
export function fileBaseName(fileName: string): string {
  const index = extensionDotIndex(fileName);
  return index < 0 ? fileName : fileName.slice(0, index);
}
