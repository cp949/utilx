import { isAbsolutePath } from "./isAbsolutePath.js";

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
