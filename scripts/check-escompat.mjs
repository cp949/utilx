/**
 * 배포 산출물(dist) 호환성 게이트.
 *
 * 배포 대상 패키지(`packages/*` 중 private가 아닌 것)의 dist JS 전량을 baseline.json의 Chrome 하한(floor) 기준으로
 * 검사한다. oxlint + eslint-plugin-es-x(JS plugin)의 `restrict-to-<esTarget>` 프리셋을 깔고, ES2020 이후로 분류되지만 floor에서
 * 이미 지원되는 기능은 `escompat-rules.mjs` 표에서 파생해 푼다. 소스 문법은 tsc가 ES2019로 낮추므로 이 게이트가 실제로
 * 잡는 것은 런타임 API 사용이다. es-x는 ECMAScript 표준만 검사하므로 DOM·Node 전역, `Math.random`, 외부 import는
 * `lint/restricted-rules.js`의 환경 규칙을 같은 엔진으로 적용한다.
 *
 * 검사 대상이 0건이면 게이트가 조용히 무력화되므로 dist가 없거나 JS가 0건이면 실패한다. dist는 빌드 산출물이라
 * `pnpm build` 뒤에 실행한다.
 *
 * oxlint에는 인라인 설정 주석을 끄는 옵션이 없다. 그래서 dist 사본의 `eslint`·`oxlint` 단어와 `global` 주석 지시어를
 * 같은 길이의 다른 글자로 바꿔 임시 디렉터리에서 lint한다. 줄·열 위치는 그대로라서 보고 위치는 원본과 같다.
 *
 * 대상 파생, linter 생성, 게이트 실행을 export하고 직접 실행일 때만 종료 코드를 설정한다.
 */
import { spawnSync } from "node:child_process";
import {
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import { dirname, isAbsolute, join, relative } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import esX from "eslint-plugin-es-x";
import {
  restrictedRules,
  toOxlintRules,
  webRestrictedRules,
} from "../lint/restricted-rules.js";
import { loadBaseline } from "./baseline.mjs";
import { presetName, rulesAllowedAt } from "./escompat-rules.mjs";
import { listPublishablePackages } from "./workspace-packages.mjs";

/** 이 스크립트가 속한 저장소의 루트. */
const defaultRepoRoot = fileURLToPath(new URL("..", import.meta.url));

/**
 * aggressive 모드는 receiver를 보지 않아 이름이 겹치는 규칙이 오탐을 낸다. ES2025 Iterator helper(map, filter 등)는
 * 배열 메서드와, Set 메서드(union 등)는 도메인 메서드(`z.union`)와 겹친다. 소스의 `lib`이 ES2019라 이 API를 실제로 쓰면
 * 컴파일이 먼저 거부하므로 게이트에서 끄고 잃는 것이 없다.
 */
const COLLISION_PRONE_RULE = /^es-x\/no-(?:iterator|set)-prototype-/;

/** 이 저장소에 설치된 oxlint 실행 파일과 JS plugin 경로. 검사 대상 저장소(`repoRoot`)가 아니라 이 스크립트 기준이다. */
const oxlintBin = fileURLToPath(
  new URL("../node_modules/oxlint/bin/oxlint", import.meta.url),
);
const esXPluginPath = createRequire(import.meta.url).resolve(
  "eslint-plugin-es-x",
);
const localPluginPath = fileURLToPath(
  new URL("../lint/oxlint-plugin.js", import.meta.url),
);

/**
 * oxlint가 보고한 `plugin(rule)` 코드를 ESLint 규칙 ID 형식으로 바꾼다.
 * 코어 규칙은 `rule`, es-x는 `es-x/rule`, 로컬 plugin은 원래 ESLint 코어 규칙 이름이다. 구문 오류는 null이다.
 */
function toRuleId(code) {
  const match = /^([^()]+)\(([^()]+)\)$/.exec(code ?? "");
  if (!match) return null;
  const [, plugin, rule] = match;
  return plugin === "eslint" || plugin === "repo" ? rule : `${plugin}/${rule}`;
}

/**
 * 인라인 설정 주석을 무력화한다. oxlint는 `eslint-disable`, `oxlint-disable` 계열 주석과 `global` 지시어를
 * 항상 해석해서 끌 수 없다. 단어를 같은 길이의 `x`로 바꿔 위치를 보존한다. 문자열 안의 같은 단어도 바뀌지만
 * 규칙 판정에는 영향이 없다.
 */
export function neutralizeInlineConfig(text) {
  const mask = (word) => "x".repeat(word.length);
  return text
    .replace(/\b(?:eslint|oxlint)\b/gi, mask)
    .replace(
      /(\/\*\s*)(globals?|exported)\b/g,
      (_, open, word) => open + mask(word),
    );
}

/**
 * 게이트가 쓰는 linter. 자체 테스트가 같은 구성으로 위반 seed를 lint해 검출력을 고정한다.
 * 반환한 객체의 `lintFiles`·`lintText`는 ESLint와 같은 결과 모양(`{ filePath, messages }`)을 돌려준다.
 *
 * @param {{ repoRoot?: string, baseline?: { chromeFloor: number, esTarget: string } }} [options]
 */
export function createEscompatLinter({
  repoRoot = defaultRepoRoot,
  baseline = loadBaseline(repoRoot),
} = {}) {
  const name = presetName(baseline.esTarget);
  const preset = esX.configs[name];
  if (!preset) {
    throw new Error(`es-x에 프리셋 ${name}이 없다`);
  }

  const collisionRules = Object.fromEntries(
    Object.keys(preset.rules ?? {})
      .filter((ruleId) => COLLISION_PRONE_RULE.test(ruleId))
      .map((ruleId) => [ruleId, "off"]),
  );

  const config = {
    // 기본으로 켜지는 plugin과 correctness 범주를 모두 끄고 아래 규칙만 적용한다.
    plugins: [],
    categories: { correctness: "off" },
    jsPlugins: [esXPluginPath, localPluginPath],
    // dist JS에는 타입 정보가 없어 기본 모드는 변수 receiver(`values.findLast()`)를 놓친다.
    // aggressive는 모든 member call을 보고한다.
    settings: { "es-x": { aggressive: true } },
    rules: {
      ...preset.rules,
      ...collisionRules,
      ...rulesAllowedAt(baseline.chromeFloor),
      ...toOxlintRules(restrictedRules),
    },
    overrides: [
      {
        // DOM 전역은 web subpath에서만 허용한다.
        files: ["**/dist/web/**"],
        rules: toOxlintRules(webRestrictedRules),
      },
    ],
  };

  /**
   * 가상 파일 목록을 임시 디렉터리에 쓰고 oxlint로 lint한다. 파일 경로는 저장소 루트 기준 상대 경로로 유지해
   * `dist/web` override가 같은 방식으로 적용된다.
   *
   * @param {{ filePath: string, text: string }[]} entries
   */
  function lint(entries) {
    const workDir = mkdtempSync(join(tmpdir(), "escompat-"));
    try {
      const relPaths = entries.map(({ filePath }) =>
        isAbsolute(filePath) ? relative(repoRoot, filePath) : filePath,
      );
      entries.forEach(({ text }, index) => {
        const target = join(workDir, relPaths[index]);
        mkdirSync(dirname(target), { recursive: true });
        writeFileSync(target, neutralizeInlineConfig(text));
      });
      writeFileSync(join(workDir, "oxlintrc.json"), JSON.stringify(config));

      const result = spawnSync(
        process.execPath,
        [oxlintBin, "-c", "oxlintrc.json", "--no-ignore", "-f", "json", "."],
        { cwd: workDir, encoding: "utf8", maxBuffer: 256 * 1024 * 1024 },
      );
      // 0은 위반 없음, 1은 위반 있음이다. 그 밖은 설정·plugin 로드 실패라 통과로 보지 않는다.
      if (result.status !== 0 && result.status !== 1) {
        throw new Error(
          `oxlint 실행 실패(status ${result.status}): ${result.stderr || result.stdout}`,
        );
      }
      const { diagnostics, number_of_files: lintedFiles } = JSON.parse(
        result.stdout,
      );
      // 무시 규칙 등으로 일부 파일이 검사에서 빠지면 게이트가 조용히 무력화되므로 개수를 대조한다.
      if (lintedFiles !== entries.length) {
        throw new Error(
          `oxlint가 ${entries.length}개 중 ${lintedFiles}개만 검사했다`,
        );
      }
      return entries.map(({ filePath }, index) => ({
        filePath,
        messages: diagnostics
          .filter(
            (diagnostic) =>
              join(workDir, diagnostic.filename) ===
              join(workDir, relPaths[index]),
          )
          .map((diagnostic) => {
            const span = diagnostic.labels[0]?.span;
            return {
              ruleId: toRuleId(diagnostic.code),
              message: diagnostic.message,
              line: span?.line ?? 0,
              column: span?.column ?? 0,
            };
          }),
      }));
    } finally {
      rmSync(workDir, { recursive: true, force: true });
    }
  }

  return {
    /** 파일을 읽어 lint한다. `files`는 절대 경로이고 `repoRoot` 아래에 있어야 한다. */
    lintFiles: (files) =>
      lint(
        files.map((file) => ({
          filePath: file,
          text: readFileSync(file, "utf8"),
        })),
      ),
    /** 코드를 가상 경로에 놓은 것으로 보고 lint한다. `filePath`는 저장소 루트 기준 상대 경로다. */
    lintText: (code, { filePath }) => lint([{ filePath, text: code }]),
  };
}

/** dist 아래의 JS 파일(.js/.mjs/.cjs)을 재귀 열거한다. 디렉터리가 없으면 0건으로 취급한다. */
function listDistJsFiles(directory) {
  let entries;
  try {
    entries = readdirSync(directory, { recursive: true, encoding: "utf8" });
  } catch {
    return [];
  }
  return entries
    .filter((entry) => /\.(?:js|mjs|cjs)$/.test(entry))
    .map((entry) => join(directory, entry))
    .sort();
}

/**
 * 게이트를 실행한다. 통과·실패를 종료 코드가 아니라 결과 객체로 돌려줘 테스트가 판정할 수 있다.
 *
 * @param {string} [repoRoot]
 * @returns {Promise<{ ok: boolean, files: string[], problems: string[] }>}
 */
export async function runEscompatGate(repoRoot = defaultRepoRoot) {
  const baseline = loadBaseline(repoRoot);
  const targets = listPublishablePackages(repoRoot);
  const problems = [];
  const files = [];

  if (targets.length === 0) {
    problems.push(
      "검사할 배포 대상 패키지(packages/* 중 private가 아닌 것)가 없다",
    );
  }
  for (const pkg of targets) {
    const found = listDistJsFiles(join(pkg.dir, "dist"));
    if (found.length === 0) {
      problems.push(
        `${pkg.relDir}/dist: 검사할 JS가 0건이다. \`pnpm build\` 뒤에 실행한다`,
      );
    }
    files.push(...found);
  }

  if (files.length > 0) {
    const linter = createEscompatLinter({ repoRoot, baseline });
    for (const result of linter.lintFiles(files)) {
      for (const message of result.messages) {
        problems.push(
          `${relative(repoRoot, result.filePath)}:${message.line}:${message.column} ${message.ruleId ?? "parse-error"} ${message.message}`,
        );
      }
    }
  }

  return { ok: problems.length === 0, files, problems };
}

// 직접 실행할 때만 게이트를 돌리고 종료 코드를 설정한다(테스트에서 import해도 프로세스 상태를 바꾸지 않는다).
if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  const { chromeFloor, esTarget } = loadBaseline();
  const result = await runEscompatGate();
  if (result.ok) {
    console.log(
      `check:escompat 통과: ${result.files.length}개 파일이 Chrome ${chromeFloor} 이상(${esTarget}) 기준을 만족한다`,
    );
  } else {
    console.error("check:escompat 실패:");
    for (const problem of result.problems) console.error(`- ${problem}`);
    process.exitCode = 1;
  }
}
