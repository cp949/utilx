/**
 * 절대 경로(`/`로 시작)이면 `true`다.
 *
 * @example
 * isAbsolutePath('/a/b'); // true
 * isAbsolutePath('a/b'); // false
 */
export function isAbsolutePath(path: string): boolean {
  return path.charCodeAt(0) === 47;
}
