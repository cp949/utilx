/**
 * 배포 tarball의 소비자 검증.
 *
 * 배포 대상 패키지를 실제로 pack하고, 임시 디렉터리의 `node_modules/<이름>`에 tarball을 풀어 패키지 이름으로 소비한다.
 * 소스 경로와 workspace symlink에는 의존하지 않는다. 검사 순서는 다음과 같다.
 *
 * 1. 정적 검사: 파일 집합(허용 목록), README·LICENSE, exports 대상 파일, 내부 상대 import 해석
 * 2. DOM 없는 별도 Node 프로세스에서 bare ESM import
 * 3. TypeScript 소비자 컴파일: `nodenext`, `bundler`(DOM lib 포함)
 * 4. DOM lib 없는 컴파일이 `TS2304`로 실패하는지(타입 소비의 DOM lib 요구 조건을 고정)
 *
 * 정적 검사에서 문제가 나오면 2~4는 같은 원인으로 중복 실패하므로 실행하지 않는다.
 * `node10` 해석, CJS, 공개 서브패스 추가, publish는 범위 밖이다.
 */
import { spawnSync } from "node:child_process";
import {
  existsSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join, posix } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { createConsumerFromPackage } from "./pack.mjs";
import { listPublishablePackages } from "./workspace-packages.mjs";

/** 이 스크립트가 속한 저장소의 루트. */
const defaultRepoRoot = fileURLToPath(new URL("..", import.meta.url));

/** 소비자 컴파일에 쓰는 TypeScript. 대상 저장소가 임시 저장소여도 이 저장소의 컴파일러를 쓴다. */
const TSC = fileURLToPath(
  new URL("../node_modules/typescript/lib/tsc.js", import.meta.url),
);

/** tarball에 허용하는 최상위 파일. 이 밖에는 `dist/` 아래 파일만 허용한다. */
const ALLOWED_ROOT_FILES = ["package.json", "README.md", "LICENSE"];
const REQUIRED_FILES = ["README.md", "LICENSE"];

/** 소비자 컴파일 구성. DOM lib이 있는 구성은 통과해야 한다. */
const TS_CONSUMERS = [
  { name: "nodenext", module: "nodenext", resolution: "nodenext" },
  { name: "bundler", module: "esnext", resolution: "bundler" },
];

/**
 * exports 값에서 문자열 대상을 모은다. `null`(접근 차단)은 대상이 아니다.
 *
 * @param {unknown} value
 * @param {string[]} conditions 지금까지 지난 조건 이름
 * @returns {{ conditions: string[], target: string }[]}
 */
function collectExportTargets(value, conditions = []) {
  if (typeof value === "string") return [{ conditions, target: value }];
  if (Array.isArray(value)) {
    return value.flatMap((item) => collectExportTargets(item, conditions));
  }
  if (value !== null && typeof value === "object") {
    return Object.entries(value).flatMap(([key, item]) =>
      collectExportTargets(item, [...conditions, key]),
    );
  }
  return [];
}

/**
 * exports를 `[서브패스, 값]` 목록으로 정규화한다. 조건만 있는 객체나 문자열은 `"."` 하나로 본다.
 * 값이 `null`인 서브패스는 접근을 막는 항목이라 공개 대상에서 뺀다.
 *
 * @param {unknown} exportsField
 * @returns {[string, unknown][]}
 */
function exportEntries(exportsField) {
  if (
    exportsField !== null &&
    typeof exportsField === "object" &&
    !Array.isArray(exportsField) &&
    Object.keys(exportsField).every((key) => key.startsWith("."))
  ) {
    return Object.entries(exportsField).filter(([, value]) => value !== null);
  }
  return [[".", exportsField]];
}

/** 파일 집합이 허용 목록 안에 있고 필수 파일이 모두 있는지 검사한다. */
function checkFileSet(files) {
  const problems = [];
  for (const file of files) {
    if (!ALLOWED_ROOT_FILES.includes(file) && !file.startsWith("dist/")) {
      problems.push(
        `허용 목록(${ALLOWED_ROOT_FILES.join(", ")}, dist/**) 밖의 파일이 포함됐다: ${file}`,
      );
    }
  }
  for (const required of REQUIRED_FILES) {
    if (!files.includes(required)) {
      problems.push(`${required}가 tarball에 없다`);
    }
  }
  return problems;
}

/** exports의 모든 대상 파일이 tarball에 있고, 서브패스마다 타입·JS 대상이 있는지 검사한다. */
function checkExports(manifest, files) {
  if (manifest.exports === undefined || manifest.exports === null) {
    return ["exports 필드가 없다"];
  }

  const entries = exportEntries(manifest.exports);
  // 빈 exports를 그대로 두면 소비자 검사가 import 없이 통과해 엉뚱한 메시지로만 실패한다.
  if (entries.length === 0) {
    return ["exports에 공개 서브패스가 없다"];
  }

  const problems = [];
  for (const [subpath, value] of entries) {
    const targets = collectExportTargets(value);
    for (const { target } of targets) {
      if (!target.startsWith("./")) {
        problems.push(
          `exports["${subpath}"] 대상이 ./로 시작하지 않는다: ${target}`,
        );
      } else if (target.includes("*")) {
        problems.push(
          `exports["${subpath}"]의 패턴 대상은 지원하지 않는다: ${target}`,
        );
      } else if (!files.includes(target.slice(2))) {
        problems.push(
          `exports["${subpath}"] 대상 파일이 tarball에 없다: ${target}`,
        );
      }
    }

    const hasTypes = targets.some(
      ({ conditions, target }) =>
        conditions.includes("types") && target.endsWith(".d.ts"),
    );
    const hasJs = targets.some(
      ({ conditions, target }) =>
        !conditions.includes("types") && /\.m?js$/.test(target),
    );
    if (!hasTypes) {
      problems.push(`exports["${subpath}"]에 types 조건의 .d.ts 대상이 없다`);
    }
    if (!hasJs) {
      problems.push(`exports["${subpath}"]에 JS 대상이 없다`);
    }
  }
  return problems;
}

/** 주석을 걷어 낸다. 예제 코드 안의 import가 실제 import로 잡히지 않게 한다. */
function stripComments(source) {
  return source.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
}

/** `from "./x"`, `import "./x"`, `import("./x")`, `import("./x").T`의 상대 경로. */
const RELATIVE_SPECIFIER =
  /(?:\bfrom\s*|\bimport\s*\(\s*|\bimport\s+)(["'])(\.{1,2}\/[^"'\n]*)\1/g;

/** JS·선언 파일의 상대 import가 tarball 안의 파일로 해석되는지 검사한다. */
function checkRelativeSpecifiers(packageRoot, files) {
  const problems = [];
  const fileSet = new Set(files);

  for (const file of files) {
    const isDeclaration = file.endsWith(".d.ts");
    if (!isDeclaration && !/\.m?js$/.test(file)) continue;

    const source = stripComments(readFileSync(join(packageRoot, file), "utf8"));
    for (const match of source.matchAll(RELATIVE_SPECIFIER)) {
      const specifier = match[2];
      const resolved = posix.normalize(
        posix.join(posix.dirname(file), specifier),
      );
      if (resolved.startsWith("../")) {
        problems.push(
          `${file}: 패키지 밖을 가리키는 상대 import다: ${specifier}`,
        );
        continue;
      }
      // 선언 파일의 `./x.js`는 `x.d.ts`로 해석된다.
      const candidates = isDeclaration
        ? [resolved, resolved.replace(/\.js$/, ".d.ts")]
        : [resolved];
      if (!candidates.some((candidate) => fileSet.has(candidate))) {
        problems.push(
          `${file}: 상대 import가 tarball 안의 파일로 해석되지 않는다: ${specifier}`,
        );
      }
    }
  }
  return problems;
}

/** 소비자 디렉터리에서 자식 프로세스를 실행한다. 부모의 환경 변수는 PATH만 넘긴다. */
function runIn(cwd, command, args) {
  return spawnSync(command, args, {
    cwd,
    encoding: "utf8",
    env: { PATH: process.env.PATH ?? "" },
  });
}

/** 출력의 앞쪽 몇 줄만 남긴다. */
function head(output, lines = 6) {
  return output.trim().split(/\r?\n/).slice(0, lines).join("\n  ");
}

/** exports 서브패스를 패키지 이름 기준 import 지정자로 바꾼다. `"."` → `name`, `"./x"` → `name/x`. */
function specifiersOf(manifest) {
  return exportEntries(manifest.exports).map(([subpath]) =>
    subpath === "." ? manifest.name : `${manifest.name}${subpath.slice(1)}`,
  );
}

/** DOM이 없는 별도 Node 프로세스에서 모든 공개 지정자를 bare ESM import한다. */
function checkRuntimeImport(consumerDir, specifiers) {
  writeFileSync(
    join(consumerDir, "runtime.mjs"),
    [
      `const specifiers = ${JSON.stringify(specifiers)};`,
      `if (typeof globalThis.document !== "undefined" || typeof globalThis.window !== "undefined") {`,
      `  throw new Error("소비자 프로세스에 DOM 전역이 있다");`,
      `}`,
      `for (const specifier of specifiers) {`,
      `  const namespace = await import(specifier);`,
      `  if (Object.keys(namespace).length === 0) {`,
      `    throw new Error(specifier + "의 export가 없다");`,
      `  }`,
      `}`,
      ``,
    ].join("\n"),
  );
  const result = runIn(consumerDir, process.execPath, ["runtime.mjs"]);
  return result.status === 0
    ? []
    : [`DOM 없는 bare ESM import가 실패했다:\n  ${head(result.stderr)}`];
}

/** tsconfig를 쓰고 `tsc`를 실행한다. */
function compile(consumerDir, name, options) {
  const config = join(consumerDir, `tsconfig.${name}.json`);
  writeFileSync(
    config,
    JSON.stringify({
      compilerOptions: {
        strict: true,
        noEmit: true,
        types: [],
        skipLibCheck: false,
        ...options,
      },
      files: ["consumer.ts"],
    }),
  );
  return runIn(consumerDir, process.execPath, [TSC, "-p", config]);
}

/** TypeScript 소비자를 컴파일한다. DOM lib이 있는 구성은 통과해야 하고, 없는 구성은 `TS2304`로 실패해야 한다. */
function checkTypeScriptConsumers(consumerDir, specifiers) {
  writeFileSync(
    join(consumerDir, "consumer.ts"),
    specifiers
      .map((specifier, index) => `import * as m${index} from "${specifier}";`)
      .concat(
        specifiers.map((_, index) => `void m${index};`),
        "",
      )
      .join("\n"),
  );

  const problems = [];
  for (const { name, module, resolution } of TS_CONSUMERS) {
    const result = compile(consumerDir, name, {
      module,
      moduleResolution: resolution,
      lib: ["ES2019", "DOM"],
    });
    if (result.status !== 0) {
      problems.push(
        `TypeScript 소비자(${resolution}, DOM lib 포함) 컴파일이 실패했다:\n  ${head(result.stdout || result.stderr)}`,
      );
    }
  }

  const withoutDom = compile(consumerDir, "no-dom", {
    module: "nodenext",
    moduleResolution: "nodenext",
    lib: ["ES2019"],
  });
  if (withoutDom.status === 0) {
    problems.push(
      "DOM lib 없이 skipLibCheck:false 컴파일이 통과했다. 선언이 DOM 타입을 쓰지 않게 바뀌었다면 README의 DOM lib 요구 조건과 이 검사를 함께 고쳐야 한다",
    );
  } else if (!withoutDom.stdout.includes("TS2304")) {
    problems.push(
      `DOM lib 없는 컴파일이 TS2304가 아닌 오류로 실패했다:\n  ${head(withoutDom.stdout || withoutDom.stderr)}`,
    );
  }
  return problems;
}

/** 패키지 하나를 검사한다. */
function checkPackage(pkg) {
  const out = mkdtempSync(join(tmpdir(), "consumer-"));
  try {
    const { consumerDir, packageRoot, files, manifest } =
      createConsumerFromPackage(pkg.dir, out);

    const staticProblems = [
      ...checkFileSet(files),
      ...checkExports(manifest, files),
      ...checkRelativeSpecifiers(packageRoot, files),
    ];
    if (staticProblems.length > 0) return staticProblems;

    const specifiers = specifiersOf(manifest);
    return [
      ...checkRuntimeImport(consumerDir, specifiers),
      ...checkTypeScriptConsumers(consumerDir, specifiers),
    ];
  } finally {
    rmSync(out, { recursive: true, force: true });
  }
}

/**
 * 검사를 실행한다. 통과·실패를 종료 코드가 아니라 결과 객체로 돌려준다.
 *
 * @param {string} [repoRoot]
 * @returns {{ ok: boolean, problems: string[] }}
 */
export function runConsumerCheck(repoRoot = defaultRepoRoot) {
  if (!existsSync(TSC)) {
    return { ok: false, problems: [`TypeScript 컴파일러가 없다: ${TSC}`] };
  }

  const targets = listPublishablePackages(repoRoot);
  const problems = [];

  if (targets.length === 0) {
    problems.push(
      "검사할 배포 대상 패키지(packages/* 중 private가 아닌 것)가 없다",
    );
  }

  for (const pkg of targets) {
    for (const problem of checkPackage(pkg)) {
      problems.push(`${pkg.relDir} tarball: ${problem}`);
    }
  }

  return { ok: problems.length === 0, problems };
}

// 직접 실행할 때만 종료 코드를 설정한다(테스트에서 import해도 프로세스 상태를 바꾸지 않는다).
if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  const result = runConsumerCheck();
  if (result.ok) {
    console.log(
      "check:consumer 통과: tarball의 exports, 상대 경로, DOM 없는 ESM import, TypeScript 소비가 정상이다",
    );
  } else {
    console.error("check:consumer 실패:");
    for (const problem of result.problems) console.error(`- ${problem}`);
    process.exitCode = 1;
  }
}
