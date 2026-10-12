import { normalizePath } from "./normalizePath.js";

/**
 * 경로 조각을 `/`로 이어 `normalizePath`한다. 빈 조각은 무시하고, 조각이 없으면 `'.'`이다.
 * 뒤 조각이 `/`로 시작해도 앞 조각을 덮어쓰지 않고 이어 붙인다.
 *
 * @example
 * joinPath('/a', 'b', '../c'); // '/a/c'
 * joinPath('a', '/b'); // 'a/b'
 */
export function joinPath(...parts: string[]): string {
  const joined = parts.filter((part) => part.length > 0).join("/");
  return joined.length === 0 ? "." : normalizePath(joined);
}
