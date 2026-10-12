/**
 * `/`로 구분하는 POSIX 경로 문자열 유틸이다. 파일 시스템에 접근하지 않고 문자열만 다룬다.
 * 동작은 Node의 `path.posix`와 같다. URL에는 쓰지 않는다(`http://`의 `//`가 합쳐진다).
 */

/** `parsePath`의 결과. */
export interface ParsedPath {
  /** 절대 경로이면 `'/'`, 아니면 `''`. */
  root: string;

  /** 마지막 구분자 앞까지의 디렉터리 경로. */
  dir: string;

  /** 마지막 구성요소(파일명). 확장자를 포함한다. */
  base: string;

  /** `base`의 확장자. 점을 포함한다(`'.txt'`). 없으면 `''`. */
  ext: string;

  /** `base`에서 확장자를 뺀 이름. */
  name: string;
}

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

/**
 * 경로를 `root`, `dir`, `base`, `ext`, `name`으로 나눈다. 끝의 구분자는 무시한다.
 * `.bashrc`처럼 점으로 시작하는 이름과 `..`은 확장자가 없다.
 *
 * @example
 * parsePath('/home/user/file.tar.gz');
 * // { root: '/', dir: '/home/user', base: 'file.tar.gz', ext: '.gz', name: 'file.tar' }
 */
export function parsePath(path: string): ParsedPath {
  const parsed: ParsedPath = { root: "", dir: "", base: "", ext: "", name: "" };
  if (path.length === 0) return parsed;

  const absolute = isAbsolutePath(path);
  if (absolute) parsed.root = "/";

  // 끝의 구분자는 버린다. 단, 절대 경로의 루트 구분자 하나는 남긴다.
  let end = path.length;
  const minEnd = absolute ? 1 : 0;
  while (end > minEnd && path.charCodeAt(end - 1) === 47) end -= 1;
  const body = path.slice(0, end);

  const lastSlash = body.lastIndexOf("/");
  const base = absolute && end === 1 ? "" : body.slice(lastSlash + 1);
  if (lastSlash === 0) parsed.dir = "/";
  else if (lastSlash > 0) parsed.dir = body.slice(0, lastSlash);

  parsed.base = base;
  const dot = base.lastIndexOf(".");
  if (dot <= 0 || base === "..") {
    parsed.name = base;
  } else {
    parsed.name = base.slice(0, dot);
    parsed.ext = base.slice(dot);
  }
  return parsed;
}
