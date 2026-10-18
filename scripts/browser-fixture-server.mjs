/**
 * 브라우저 검증용 fixture 서버.
 *
 * - `/`와 그 아래 경로는 `e2e/fixture`를 서빙한다.
 * - `/dist/`는 `packages/utilx/dist`를 서빙한다. 번들러 없이 배포 ESM을 그대로 로드한다.
 * - 루프백(127.0.0.1)에만 바인딩한다. 다른 호스트 이름은 브라우저의 host-resolver 규칙이 이 주소로 매핑한다.
 */
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join, normalize, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

/** 저장소 루트. */
const repoRoot = fileURLToPath(new URL("..", import.meta.url));

/** fixture 서버 기본 포트. `playwright.config.ts`의 baseURL과 같아야 한다. */
export const DEFAULT_PORT = 4601;

const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
  ".json": "application/json; charset=utf-8",
};

/**
 * 요청 경로를 서빙 루트 아래의 실제 파일 경로로 바꾼다.
 * 루트 밖으로 나가는 경로(`..`, 인코딩된 구분자, NUL)는 `null`이다.
 *
 * @param {string} root 서빙 루트의 절대 경로
 * @param {string} urlPath 쿼리를 뺀 요청 경로
 * @returns {string | null}
 */
export function resolveInside(root, urlPath) {
  let decoded;
  try {
    decoded = decodeURIComponent(urlPath);
  } catch {
    return null;
  }
  if (decoded.includes("\0")) return null;
  const candidate = resolve(join(root, normalize(decoded)));
  const rootWithSep = resolve(root) + sep;
  return candidate === resolve(root) || candidate.startsWith(rootWithSep)
    ? candidate
    : null;
}

/**
 * 요청 경로가 가리키는 서빙 루트와 루트 기준 상대 경로를 정한다.
 *
 * @param {string} urlPath
 * @param {{ fixtureDir: string, distDir: string }} dirs
 * @returns {{ root: string, relative: string }}
 */
export function routePath(urlPath, { fixtureDir, distDir }) {
  if (urlPath === "/dist" || urlPath.startsWith("/dist/")) {
    return { root: distDir, relative: urlPath.slice("/dist".length) || "/" };
  }
  return {
    root: fixtureDir,
    relative: urlPath === "/" ? "/index.html" : urlPath,
  };
}

/**
 * fixture 서버를 만든다. 아직 listen하지 않는다.
 *
 * @param {{ fixtureDir?: string, distDir?: string }} [options]
 */
export function createFixtureServer(options = {}) {
  const dirs = {
    fixtureDir: options.fixtureDir ?? join(repoRoot, "e2e", "fixture"),
    distDir: options.distDir ?? join(repoRoot, "packages", "utilx", "dist"),
  };

  return createServer((request, response) => {
    const urlPath = new URL(request.url ?? "/", "http://fixture.local")
      .pathname;
    const { root, relative } = routePath(urlPath, dirs);
    const filePath = resolveInside(root, relative);
    if (filePath === null) {
      response.writeHead(400).end("bad request");
      return;
    }
    readFile(filePath).then(
      (body) => {
        response.writeHead(200, {
          "content-type":
            MIME_TYPES[extname(filePath)] ?? "application/octet-stream",
          "cache-control": "no-store",
        });
        response.end(body);
      },
      () => {
        response.writeHead(404).end("not found");
      },
    );
  });
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const port = Number(process.env.FIXTURE_PORT ?? DEFAULT_PORT);
  createFixtureServer().listen(port, "127.0.0.1", () => {
    console.log(`fixture 서버: http://127.0.0.1:${String(port)}`);
  });
}
