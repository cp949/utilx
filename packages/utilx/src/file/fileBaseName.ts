import { extensionDotIndex } from "./extensionDotIndex.internal.js";

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
