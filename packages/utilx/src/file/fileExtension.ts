import { extensionDotIndex } from "./extensionDotIndex.internal.js";

/** `fileExtension` 옵션. */
export interface FileExtensionOptions {
  /** `true`면 소문자로 바꾼다. 기본값은 `false`다. */
  lowerCase?: boolean;

  /** `true`면 앞에 `.`을 붙인다. 기본값은 `false`다. */
  withDot?: boolean;
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
