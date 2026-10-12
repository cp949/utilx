import { isAbsolutePath } from "./isAbsolutePath.js";

/**
 * 경로를 정리한다. 중복 구분자를 하나로 합치고 `.`을 없애고 `..`을 해석한다.
 * 절대 경로에서 루트 위로 올라가는 `..`은 버리고, 상대 경로에서는 남긴다. 끝의 구분자는 유지한다.
 * 빈 문자열은 `'.'`이다.
 *
 * @example
 * normalizePath('/a//b/../c/./'); // '/a/c/'
 * normalizePath('../a/..'); // '..'
 * normalizePath(''); // '.'
 */
export function normalizePath(path: string): string {
  if (path.length === 0) return ".";

  const absolute = isAbsolutePath(path);
  const trailingSeparator = path.endsWith("/");

  const segments: string[] = [];
  for (const segment of path.split("/")) {
    if (segment === "" || segment === ".") continue;
    if (segment === "..") {
      if (segments.length > 0 && segments[segments.length - 1] !== "..") {
        segments.pop();
      } else if (!absolute) {
        segments.push("..");
      }
      continue;
    }
    segments.push(segment);
  }

  let result = segments.join("/");
  if (result.length === 0 && !absolute) result = ".";
  if (result.length > 0 && trailingSeparator) result += "/";
  return absolute ? `/${result}` : result;
}
