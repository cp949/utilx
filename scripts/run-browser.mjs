/**
 * 브라우저 검증 실행기.
 *
 *   node scripts/run-browser.mjs chromium-latest   # Playwright 최신 Chromium
 *   node scripts/run-browser.mjs chrome83          # podman 컨테이너의 Chrome 83
 *
 * 배포 dist를 fixture가 그대로 로드하므로 실행 전에 `pnpm build`가 끝나 있어야 한다.
 * `pnpm test:browser`, `pnpm test:browser:chrome83`은 빌드를 먼저 실행한다.
 */
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { BROWSER_PROJECTS } from "./browser-report.mjs";
import {
  IN_CONTAINER_ENV,
  buildImageArgs,
  buildRunArgs,
  resolveContainerRuntime,
} from "./browser-container.mjs";

const defaultRepoRoot = fileURLToPath(new URL("..", import.meta.url));

/** 컨테이너를 거쳐 실행하는 project. */
const CONTAINER_PROJECTS = new Set(["chrome83"]);

/**
 * 명령행 인자에서 project 이름을 읽는다.
 *
 * @param {string[]} args
 */
export function parseProject(args) {
  const [project, ...rest] = args;
  if (
    project === undefined ||
    rest.length > 0 ||
    !(project in BROWSER_PROJECTS)
  ) {
    throw new Error(
      `project는 하나만 받는다: ${Object.keys(BROWSER_PROJECTS).join(", ")} (받은 값: ${args.join(" ") || "없음"})`,
    );
  }
  return project;
}

/**
 * 배포 dist가 빌드돼 있는지 확인한다.
 *
 * @param {string} repoRoot
 */
export function assertDistBuilt(repoRoot) {
  if (!existsSync(join(repoRoot, "packages", "utilx", "dist", "index.js"))) {
    throw new Error(
      "packages/utilx/dist/index.js가 없다. `pnpm build`를 먼저 실행한다.",
    );
  }
}

/** Playwright CLI 실행 명령. */
export function playwrightCommand(project) {
  return [
    "node",
    join("node_modules", "@playwright", "test", "cli.js"),
    "test",
    `--project=${project}`,
  ];
}

function run(command, args, cwd) {
  const result = spawnSync(command, args, { cwd, stdio: "inherit" });
  if (result.error) throw result.error;
  return result.status ?? 1;
}

/**
 * project를 실행하고 종료 코드를 돌려준다.
 *
 * @param {string} project
 * @param {{ repoRoot?: string, env?: NodeJS.ProcessEnv }} [options]
 */
export function runProject(
  project,
  { repoRoot = defaultRepoRoot, env = process.env } = {},
) {
  assertDistBuilt(repoRoot);

  if (CONTAINER_PROJECTS.has(project) && env[IN_CONTAINER_ENV] !== "1") {
    const runtime = resolveContainerRuntime();
    const buildStatus = run(
      runtime,
      buildImageArgs({ contextDir: join(repoRoot, "docker", "chrome83") }),
      repoRoot,
    );
    if (buildStatus !== 0) return buildStatus;
    return run(
      runtime,
      buildRunArgs({
        repoRoot,
        uid: process.getuid?.() ?? 1000,
        gid: process.getgid?.() ?? 1000,
        command: ["node", "scripts/run-browser.mjs", project],
      }),
      repoRoot,
    );
  }

  const [node, ...args] = playwrightCommand(project);
  return run(node, args, repoRoot);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  try {
    process.exitCode = runProject(parseProject(process.argv.slice(2)));
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}
