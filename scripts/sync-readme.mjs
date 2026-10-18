/**
 * README 동기화와 일치 검사.
 *
 * 루트 `README.md`가 원본이다. 배포 대상 패키지의 `README.md`는 npm tarball에 들어가는 사본이며
 * 루트와 byte 단위로 같아야 한다. 내용이 달라지면 `--check`가 실패한다.
 *
 * - `--check`: 일치 여부만 검사한다(`pnpm check:readme`).
 * - `--write`: 패키지 README를 루트 README로 덮어쓴다(`pnpm sync:readme`).
 *
 * 루트 README는 npm에서도 읽히므로 저장소 안의 상대 링크는 쓰지 않는다(절대 URL 사용).
 * `--check`는 이 규칙도 검사한다. 사본이 그대로 퍼지므로 원본에서 막아야 npm 페이지의 링크가 깨지지 않는다.
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { listPublishablePackages } from "./workspace-packages.mjs";

/** 이 스크립트가 속한 저장소의 루트. */
const defaultRepoRoot = fileURLToPath(new URL("..", import.meta.url));

/** scheme(`https:`, `mailto:` 등)이나 문서 안 앵커(`#`)로 시작하는 링크 대상. */
const NON_RELATIVE_TARGET = /^(?:[A-Za-z][A-Za-z0-9+.-]*:|#)/;

/**
 * 마크다운의 인라인 링크·이미지(`](대상)`)와 참조 정의(`[이름]: 대상`) 중 상대 경로 대상을 찾는다.
 * 코드 블록 안의 `](`는 코드(예: `fns[0](x)`)일 수 있으므로 건너뛴다.
 *
 * @param {string} text
 * @returns {{ line: number, target: string }[]}
 */
export function findRelativeLinks(text) {
  const found = [];
  let inFence = false;
  text.split(/\r?\n/).forEach((line, index) => {
    if (/^\s*(```|~~~)/.test(line)) {
      inFence = !inFence;
      return;
    }
    if (inFence) return;
    // 인라인 코드 안의 텍스트는 링크가 아니다.
    const prose = line.replace(/`[^`]*`/g, "");
    const targets = [];
    for (const match of prose.matchAll(/\]\(\s*<?([^)\s>]+)/g)) {
      targets.push(match[1]);
    }
    const definition = /^\s{0,3}\[[^\]]+\]:\s*<?([^\s>]+)/.exec(prose);
    if (definition) targets.push(definition[1]);
    for (const target of targets) {
      if (!NON_RELATIVE_TARGET.test(target)) {
        found.push({ line: index + 1, target });
      }
    }
  });
  return found;
}

/**
 * 루트 README와 배포 대상 패키지 README의 일치 여부를 검사한다.
 * 루트 README에 상대 경로 링크가 있어도 실패한다.
 * 통과·실패를 종료 코드가 아니라 결과 객체로 돌려준다.
 *
 * @param {string} [repoRoot]
 * @returns {{ ok: boolean, problems: string[] }}
 */
export function runReadmeCheck(repoRoot = defaultRepoRoot) {
  const problems = [];
  const rootReadme = join(repoRoot, "README.md");
  if (!existsSync(rootReadme)) {
    return { ok: false, problems: ["루트 README.md가 없다"] };
  }
  const source = readFileSync(rootReadme);

  for (const { line, target } of findRelativeLinks(source.toString("utf8"))) {
    problems.push(
      `README.md:${line}의 상대 링크 \`${target}\`는 npm에서 깨진다. 절대 URL로 바꾼다`,
    );
  }

  const targets = listPublishablePackages(repoRoot);
  if (targets.length === 0) {
    problems.push(
      "검사할 배포 대상 패키지(packages/* 중 private가 아닌 것)가 없다",
    );
  }

  for (const pkg of targets) {
    const file = join(pkg.dir, "README.md");
    if (!existsSync(file)) {
      problems.push(`${pkg.relDir}/README.md가 없다`);
    } else if (!readFileSync(file).equals(source)) {
      problems.push(
        `${pkg.relDir}/README.md가 루트 README.md와 다르다. \`pnpm sync:readme\`로 맞춘다`,
      );
    }
  }

  return { ok: problems.length === 0, problems };
}

/**
 * 배포 대상 패키지의 README를 루트 README로 덮어쓴다.
 *
 * @param {string} [repoRoot]
 * @returns {string[]} 내용이 바뀐 파일의 저장소 기준 상대 경로
 */
export function syncReadme(repoRoot = defaultRepoRoot) {
  const source = readFileSync(join(repoRoot, "README.md"));
  const changed = [];
  for (const pkg of listPublishablePackages(repoRoot)) {
    const file = join(pkg.dir, "README.md");
    if (existsSync(file) && readFileSync(file).equals(source)) continue;
    writeFileSync(file, source);
    changed.push(`${pkg.relDir}/README.md`);
  }
  return changed;
}

// 직접 실행할 때만 동작한다(테스트에서 import해도 프로세스 상태를 바꾸지 않는다).
if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  const mode = process.argv[2];
  if (mode === "--write") {
    const changed = syncReadme();
    console.log(
      changed.length === 0
        ? "sync:readme: 이미 일치한다"
        : `sync:readme: ${changed.join(", ")}를 갱신했다`,
    );
  } else if (mode === "--check") {
    const result = runReadmeCheck();
    if (result.ok) {
      console.log("check:readme 통과: 패키지 README가 루트 README와 같다");
    } else {
      console.error("check:readme 실패:");
      for (const problem of result.problems) console.error(`- ${problem}`);
      process.exitCode = 1;
    }
  } else {
    console.error("사용법: node scripts/sync-readme.mjs --check | --write");
    process.exitCode = 1;
  }
}
