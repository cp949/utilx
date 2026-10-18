/**
 * 배포 tarball의 tree-shaking 측정 검사.
 *
 * 배포 대상 패키지를 pack해 임시 `node_modules/<이름>`에 풀고, 대표 단일 import를 esbuild로 번들한다.
 * 번들에 실제로 남은 모듈(`metafile.outputs`의 `bytesInOutput > 0`)과 raw/gzip bytes를 측정한다.
 * `metafile.inputs`는 파싱만 한 모듈도 담으므로 판정에 쓰지 않는다.
 *
 * - `--check`: 측정 결과를 `bundle-baseline.json`과 대조한다(`pnpm check:bundle`).
 * - `--write`: 측정 결과로 `bundle-baseline.json`을 다시 쓴다(`pnpm sync:bundle`).
 *
 * 두 모드 모두 아래 위반이 있으면 실패하고, `--write`는 파일을 쓰지 않는다.
 * - 배포 `package.json`의 `sideEffects`가 `false`가 아님(아래 차이 검사가 이 선언을 전제로 한다)
 * - 금지 디렉터리의 모듈이 번들에 남음(예: `trim` 소비자의 `dist/web/`)
 * - 대조군이 요구 모듈을 포함하지 않음(측정이 실제로 동작하는지 확인)
 * - `sideEffects`·`@__PURE__` 주석을 무시한 번들에서만 모듈이 늘어남(최상위 부작용이 선언에 가려져 있음)
 *
 * 포함 모듈 목록은 baseline과 정확히 같아야 한다. bytes는 기록만 하고 한도로 쓰지 않는다(예산은 별도 결정).
 * CJS, 공개 서브패스 추가, publish는 범위 밖이다.
 */
import {
  existsSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { gzipSync } from "node:zlib";
import { build, version as esbuildVersion } from "esbuild";
import { format as formatWithPrettier, resolveConfig } from "prettier";
import { loadBaseline } from "./baseline.mjs";
import { createConsumerFromPackage } from "./pack.mjs";
import { listPublishablePackages } from "./workspace-packages.mjs";

/** 이 스크립트가 속한 저장소의 루트. */
const defaultRepoRoot = fileURLToPath(new URL("..", import.meta.url));

/** 측정 결과를 기록하는 파일. 저장소 루트에 둔다. */
export const BUNDLE_BASELINE_FILE = "bundle-baseline.json";

/** 번들 옵션. 값이 바뀌면 baseline의 기록과 달라져 실패한다. */
const FORMAT = "esm";
const MINIFY = true;

/**
 * 측정할 import 목록.
 *
 * - `exportName`: 단일 import 대상. 없으면 `export *` 전체 번들이다.
 * - `forbidden`: 번들에 남으면 안 되는 `dist/` 하위 경로 접두사
 * - `required`: 번들에 남아야 하는 모듈 접두사(대조군)
 */
export const DEFAULT_ENTRIES = [
  {
    name: "trim",
    exportName: "trim",
    forbidden: ["dist/web/", "dist/buffer/", "dist/binary/"],
  },
  {
    name: "moveItem",
    exportName: "moveItem",
    forbidden: ["dist/web/", "dist/buffer/", "dist/binary/"],
  },
  {
    name: "DisposableScope",
    exportName: "DisposableScope",
    forbidden: ["dist/web/", "dist/buffer/"],
  },
  {
    name: "downloadBlob",
    exportName: "downloadBlob",
    required: ["dist/web/downloadBlob.js"],
  },
  { name: "*", required: ["dist/web/", "dist/buffer/", "dist/binary/"] },
];

/** 진입 소스. 패키지 이름으로 import한다. */
function entrySource(packageName, entry) {
  return entry.exportName === undefined
    ? `export * from ${JSON.stringify(packageName)};`
    : `export { ${entry.exportName} } from ${JSON.stringify(packageName)};`;
}

/**
 * 진입 하나를 번들해 남은 모듈과 bytes를 돌려준다.
 *
 * @param {string} consumerDir
 * @param {string} packageName
 * @param {{ exportName?: string }} entry
 * @param {string} target esbuild target
 * @param {boolean} ignoreAnnotations `sideEffects`와 `@__PURE__` 주석을 무시할지
 */
async function measure(
  consumerDir,
  packageName,
  entry,
  target,
  ignoreAnnotations,
) {
  const result = await build({
    stdin: {
      contents: entrySource(packageName, entry),
      resolveDir: consumerDir,
      loader: "js",
    },
    absWorkingDir: consumerDir,
    bundle: true,
    format: FORMAT,
    minify: MINIFY,
    target,
    platform: "browser",
    write: false,
    metafile: true,
    legalComments: "none",
    logLevel: "silent",
    ignoreAnnotations,
  });

  const marker = `node_modules/${packageName}/`;
  const [output] = Object.values(result.metafile.outputs);
  const modules = Object.entries(output.inputs)
    .filter(([, input]) => input.bytesInOutput > 0)
    .map(([path]) => path)
    .filter((path) => path.startsWith(marker))
    .map((path) => path.slice(marker.length))
    .sort();

  const bytes = result.outputFiles[0].contents;
  return {
    modules,
    rawBytes: bytes.length,
    gzipBytes: gzipSync(bytes, { level: 9 }).length,
  };
}

/** 두 목록이 같은 문자열 집합인지 비교한다. 입력은 정렬되어 있다. */
const sameList = (a, b) =>
  a.length === b.length && a.every((item, index) => item === b[index]);

/** 금지·요구·주석 의존 위반을 모은다. baseline과 무관한 규칙이다. */
function structuralProblems(entry, normal, ignoring) {
  const problems = [];
  const label = `entry ${entry.name}`;

  for (const prefix of entry.forbidden ?? []) {
    const hits = normal.modules.filter((path) => path.startsWith(prefix));
    if (hits.length > 0) {
      problems.push(
        `${label}: 금지된 ${prefix} 모듈이 번들에 포함됐다: ${hits.join(", ")}`,
      );
    }
  }
  for (const prefix of entry.required ?? []) {
    if (!normal.modules.some((path) => path.startsWith(prefix))) {
      problems.push(
        `${label}: 대조군이 요구하는 ${prefix} 모듈이 번들에 없다. 측정이 모듈을 놓치고 있다`,
      );
    }
  }

  const onlyIgnoring = ignoring.modules.filter(
    (path) => !normal.modules.includes(path),
  );
  if (onlyIgnoring.length > 0) {
    problems.push(
      `${label}: sideEffects 선언을 무시하면 모듈이 더 남는다. 최상위 부작용이 선언에 가려져 있다: ${onlyIgnoring.join(", ")}`,
    );
  }
  return problems;
}

/** 측정 결과를 baseline 형태로 만든다. */
function toBaseline(packageName, target, measured) {
  return {
    package: packageName,
    bundler: { name: "esbuild", version: esbuildVersion },
    options: { format: FORMAT, target, minify: MINIFY },
    entries: Object.fromEntries(
      measured.map(({ entry, normal }) => [
        entry.name,
        {
          modules: normal.modules,
          rawBytes: normal.rawBytes,
          gzipBytes: normal.gzipBytes,
        },
      ]),
    ),
  };
}

/** baseline 파일을 읽는다. 없거나 깨졌으면 문제 메시지를 돌려준다. */
function readBundleBaseline(repoRoot) {
  const file = join(repoRoot, BUNDLE_BASELINE_FILE);
  if (!existsSync(file)) {
    return {
      problem: `${BUNDLE_BASELINE_FILE}이 없다. \`pnpm sync:bundle\`로 만든다`,
    };
  }
  try {
    return { baseline: JSON.parse(readFileSync(file, "utf8")) };
  } catch (cause) {
    return {
      problem: `${BUNDLE_BASELINE_FILE}을 읽을 수 없다: ${cause.message}`,
    };
  }
}

/** 측정 결과를 baseline과 대조한다. 모듈 목록과 번들 조건은 정확히 같아야 한다. bytes 차이는 notes로만 남긴다. */
function compareWithBaseline(expected, actual) {
  const problems = [];
  const notes = [];
  const hint = "의도한 변경이면 `pnpm sync:bundle`로 baseline을 다시 만든다";

  if (expected.package !== actual.package) {
    problems.push(
      `baseline의 패키지(${expected.package})가 측정 대상(${actual.package})과 다르다. ${hint}`,
    );
  }
  for (const [label, want, got] of [
    ["번들러 이름", expected.bundler?.name, actual.bundler.name],
    ["번들러 버전", expected.bundler?.version, actual.bundler.version],
    ["format", expected.options?.format, actual.options.format],
    ["target", expected.options?.target, actual.options.target],
    ["minify", expected.options?.minify, actual.options.minify],
  ]) {
    if (want !== got) {
      problems.push(
        `baseline의 ${label}(${want})이 현재 값(${got})과 다르다. ${hint}`,
      );
    }
  }

  const expectedNames = Object.keys(expected.entries ?? {}).sort();
  const actualNames = Object.keys(actual.entries).sort();
  if (!sameList(expectedNames, actualNames)) {
    problems.push(
      `baseline의 entry 목록(${expectedNames.join(", ")})이 측정 목록(${actualNames.join(", ")})과 다르다. ${hint}`,
    );
  }

  for (const name of actualNames) {
    const want = expected.entries?.[name];
    const got = actual.entries[name];
    if (!want) continue;
    if (!sameList(want.modules ?? [], got.modules)) {
      problems.push(
        `entry ${name}: 포함 모듈이 baseline과 다르다.\n    baseline: ${(want.modules ?? []).join(", ")}\n    측정: ${got.modules.join(", ")}\n    ${hint}`,
      );
    } else if (
      want.rawBytes !== got.rawBytes ||
      want.gzipBytes !== got.gzipBytes
    ) {
      notes.push(
        `entry ${name}: bytes가 baseline과 다르다(raw ${want.rawBytes}→${got.rawBytes}, gzip ${want.gzipBytes}→${got.gzipBytes}). 한도가 아니므로 실패시키지 않는다`,
      );
    }
  }
  return { problems, notes };
}

/**
 * 검사를 실행한다. 통과·실패를 종료 코드가 아니라 결과 객체로 돌려준다.
 *
 * @param {string} [repoRoot]
 * @param {{ write?: boolean, entries?: typeof DEFAULT_ENTRIES }} [options]
 * @returns {Promise<{ ok: boolean, problems: string[], notes: string[], baseline?: object }>}
 */
export async function runBundleCheck(repoRoot = defaultRepoRoot, options = {}) {
  const { write = false, entries = DEFAULT_ENTRIES } = options;

  const targets = listPublishablePackages(repoRoot);
  if (targets.length !== 1) {
    return {
      ok: false,
      notes: [],
      problems: [
        `번들 검사는 배포 대상 패키지(packages/* 중 private가 아닌 것) 1개를 가정한다. 현재 ${targets.length}개`,
      ],
    };
  }
  const [pkg] = targets;
  const target = loadBaseline(repoRoot).esTarget.toLowerCase();

  const out = mkdtempSync(join(tmpdir(), "bundle-"));
  try {
    const { consumerDir, manifest } = createConsumerFromPackage(pkg.dir, out);
    const packageName = String(manifest.name);

    const measured = [];
    const problems = [];
    // 선언이 없으면 두 번들이 같은 규칙으로 tree-shaking되어 가려진 부작용이 차이로 드러나지 않는다.
    if (manifest.sideEffects !== false) {
      problems.push(
        `배포 package.json의 sideEffects가 false가 아니다(현재 ${JSON.stringify(manifest.sideEffects)}). 최상위 부작용 차이 검사가 이 선언을 전제로 한다`,
      );
    }
    for (const entry of entries) {
      const normal = await measure(
        consumerDir,
        packageName,
        entry,
        target,
        false,
      );
      const ignoring = await measure(
        consumerDir,
        packageName,
        entry,
        target,
        true,
      );
      measured.push({ entry, normal });
      problems.push(...structuralProblems(entry, normal, ignoring));
    }

    const actual = toBaseline(packageName, target, measured);
    if (problems.length > 0) {
      return { ok: false, problems, notes: [], baseline: actual };
    }

    if (write) {
      // `format:check`와 같은 결과가 되도록 저장소의 prettier 설정을 따른다.
      const file = join(repoRoot, BUNDLE_BASELINE_FILE);
      const text = await formatWithPrettier(JSON.stringify(actual), {
        ...(await resolveConfig(file)),
        filepath: file,
      });
      writeFileSync(file, text);
      return { ok: true, problems: [], notes: [], baseline: actual };
    }

    const { baseline, problem } = readBundleBaseline(repoRoot);
    if (problem) {
      return { ok: false, problems: [problem], notes: [], baseline: actual };
    }
    const compared = compareWithBaseline(baseline, actual);
    return {
      ok: compared.problems.length === 0,
      ...compared,
      baseline: actual,
    };
  } finally {
    rmSync(out, { recursive: true, force: true });
  }
}

// 직접 실행할 때만 종료 코드를 설정한다(테스트에서 import해도 프로세스 상태를 바꾸지 않는다).
if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  const mode = process.argv[2];
  if (mode !== "--check" && mode !== "--write") {
    console.error("사용법: node scripts/check-bundle.mjs --check | --write");
    process.exitCode = 1;
  } else {
    const result = await runBundleCheck(defaultRepoRoot, {
      write: mode === "--write",
    });
    for (const note of result.notes) console.log(`참고: ${note}`);
    if (!result.ok) {
      console.error("check:bundle 실패:");
      for (const problem of result.problems) console.error(`- ${problem}`);
      process.exitCode = 1;
    } else if (mode === "--write") {
      console.log(`${BUNDLE_BASELINE_FILE}을 갱신했다`);
    } else {
      console.log(
        "check:bundle 통과: 대표 단일 import의 포함 모듈이 baseline과 같고, 금지 모듈과 선언 의존 부작용이 없다",
      );
    }
  }
}
