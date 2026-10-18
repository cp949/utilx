/**
 * 게이트 테스트가 함께 쓰는 helper.
 *
 * 저장소 안에는 파일을 쓰지 않는다. 구조 검사용 저장소는 모두 `os.tmpdir()` 아래에 만들어서
 * fixture가 배포물이나 작업 트리에 남지 않는다.
 */
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createEscompatESLint } from "../check-escompat.mjs";

/** 실제 저장소 루트. seed lint의 가상 파일 경로와 소스 lint 구성 검증에만 쓴다. */
export const realRepoRoot = fileURLToPath(new URL("../..", import.meta.url));

/** 비-web 경로와 web 경로의 가상 dist 파일. 파일을 만들지 않고 `lintText`의 `filePath`로만 쓴다. */
export const DIST_PATH = {
  nonWeb: "packages/utilx/dist/x/a.js",
  web: "packages/utilx/dist/web/a.js",
};

/**
 * 하한 75, ES2019를 주입한 실제 게이트 ESLint 인스턴스로 seed를 lint하고 규칙 ID 목록을 돌려준다.
 *
 * @param {string} code
 * @param {"nonWeb" | "web"} area
 * @param {{ chromeFloor: number, esTarget: string }} [baseline]
 */
export async function lintSeed(
  code,
  area,
  baseline = { chromeFloor: 75, esTarget: "ES2019" },
) {
  const eslint = createEscompatESLint({ repoRoot: realRepoRoot, baseline });
  const [result] = await eslint.lintText(code, { filePath: DIST_PATH[area] });
  return result.messages.map((message) => message.ruleId ?? "parse-error");
}

/**
 * 임시 저장소를 만든다. `files`는 저장소 루트 기준 상대 경로 → 내용이다. 객체는 JSON으로 쓴다.
 *
 * @param {Record<string, string | object>} files
 * @returns {{ root: string, cleanup: () => void }}
 */
export function createTempRepo(files) {
  const root = mkdtempSync(join(tmpdir(), "gate-test-"));
  for (const [relPath, content] of Object.entries(files)) {
    const file = join(root, relPath);
    mkdirSync(dirname(file), { recursive: true });
    writeFileSync(
      file,
      typeof content === "string" ? content : JSON.stringify(content, null, 2),
    );
  }
  return {
    root,
    cleanup: () => rmSync(root, { recursive: true, force: true }),
  };
}

/** 정상 상태의 임시 저장소 파일 집합. 필요한 항목만 덮어써서 쓴다. */
export function baseRepoFiles(overrides = {}) {
  return {
    "pnpm-workspace.yaml": 'packages:\n  - "packages/*"\n',
    "baseline.json": { chromeFloor: 75, esTarget: "ES2019" },
    "packages/lib/package.json": {
      name: "@test/lib",
      version: "1.0.0",
      type: "module",
      files: ["dist"],
    },
    "packages/lib/dist/index.js": "export const a = 1;\n",
    ...overrides,
  };
}
