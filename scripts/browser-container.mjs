/**
 * Chrome 83 검증 컨테이너 실행 helper.
 *
 * 런타임은 `podman`만 쓴다. 없으면 `docker`로 대체하지 않고 실패한다.
 * 컨테이너는 저장소를 `/repo`에 마운트하고, 호스트 사용자 권한으로 실행해 `test-results/`가 호스트 소유로 남는다.
 */
import { accessSync, constants } from "node:fs";
import { delimiter, join } from "node:path";

/** Chrome 83 이미지 이름. */
export const IMAGE_NAME = "utilx-chrome83";

/** 컨테이너 안에서 저장소를 마운트하는 경로. */
export const CONTAINER_REPO = "/repo";

/** 컨테이너 안에서 러너가 컨테이너를 다시 띄우지 않도록 하는 환경 변수. */
export const IN_CONTAINER_ENV = "UTILX_BROWSER_CONTAINER";

/**
 * PATH에서 실행 파일을 찾는다.
 *
 * @param {string} name
 * @param {NodeJS.ProcessEnv} [env]
 */
export function commandExistsOnPath(name, env = process.env) {
  for (const dir of (env.PATH ?? "").split(delimiter)) {
    if (dir === "") continue;
    try {
      accessSync(join(dir, name), constants.X_OK);
      return true;
    } catch {
      // 다음 PATH 항목을 본다.
    }
  }
  return false;
}

/**
 * 컨테이너 런타임을 정한다. `podman`이 없으면 예외를 던진다.
 *
 * @param {(name: string) => boolean} [commandExists]
 * @returns {"podman"}
 */
export function resolveContainerRuntime(commandExists = commandExistsOnPath) {
  if (commandExists("podman")) return "podman";
  throw new Error(
    "podman을 찾을 수 없다. Chrome 83 검증은 podman으로만 실행한다(docker로 대체하지 않는다). podman을 설치하거나 `pnpm test:browser`로 최신 Chromium만 실행한다.",
  );
}

/**
 * 이미지 빌드 인자.
 *
 * @param {{ contextDir: string }} input
 */
export function buildImageArgs({ contextDir }) {
  return ["build", "-t", IMAGE_NAME, contextDir];
}

/**
 * 컨테이너 실행 인자.
 *
 * @param {{ repoRoot: string, uid: number, gid: number, command: string[] }} input
 */
export function buildRunArgs({ repoRoot, uid, gid, command }) {
  return [
    "run",
    "--rm",
    // fixture 서버와 브라우저가 같은 루프백을 쓰도록 호스트 네트워크를 공유한다.
    "--network",
    "host",
    "--userns=keep-id",
    "--user",
    `${String(uid)}:${String(gid)}`,
    // 호스트 사용자는 이미지의 /etc/passwd에 없어서 HOME을 쓰기 가능한 경로로 지정한다.
    "-e",
    "HOME=/tmp",
    "-e",
    `${IN_CONTAINER_ENV}=1`,
    "-v",
    `${repoRoot}:${CONTAINER_REPO}`,
    "-w",
    CONTAINER_REPO,
    IMAGE_NAME,
    ...command,
  ];
}
