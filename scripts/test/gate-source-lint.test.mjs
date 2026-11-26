import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { cpSync, symlinkSync } from "node:fs";
import { join } from "node:path";
import { describe, it } from "node:test";
import {
  restrictedRules,
  toOxlintRules,
  webRestrictedRules,
} from "../../lint/restricted-rules.js";
import { createTempRepo, realRepoRoot } from "./helpers.mjs";

const oxlintBin = join(realRepoRoot, "node_modules/oxlint/bin/oxlint");

/** ESLint 규칙 이름을 oxlint 설정 안의 규칙 이름으로 옮긴다. */
const oxlintRuleName = (rule) => Object.keys(toOxlintRules({ [rule]: [] }))[0];

/**
 * 실제 소스 lint 구성(`packages/utilx/oxlint.config.ts`)과 `lint/` 하위 파일을 임시 저장소에 복사한다.
 * 저장소 안에는 seed 파일을 쓰지 않는다. `oxlint` 패키지는 실제 저장소의 node_modules를 연결해 쓴다.
 *
 * @param {Record<string, string>} seeds `packages/utilx` 기준 상대 경로 → 소스
 */
function createLintRepo(seeds) {
  const repo = createTempRepo(
    Object.fromEntries(
      Object.entries(seeds).map(([path, code]) => [
        `packages/utilx/${path}`,
        code,
      ]),
    ),
  );
  cpSync(join(realRepoRoot, "lint"), join(repo.root, "lint"), {
    recursive: true,
  });
  cpSync(
    join(realRepoRoot, "packages/utilx/oxlint.config.ts"),
    join(repo.root, "packages/utilx/oxlint.config.ts"),
  );
  symlinkSync(
    join(realRepoRoot, "node_modules"),
    join(repo.root, "node_modules"),
    "dir",
  );
  return {
    cwd: join(repo.root, "packages/utilx"),
    cleanup: repo.cleanup,
  };
}

/** oxlint를 실행하고 표준 출력을 돌려준다. 위반이 있어 종료 코드가 1이어도 출력은 유효하다. */
function runOxlint(cwd, args) {
  const result = spawnSync(process.execPath, [oxlintBin, ...args], {
    cwd,
    encoding: "utf8",
  });
  assert.ok(
    result.status === 0 || result.status === 1,
    `oxlint 실행 실패(status ${result.status}): ${result.stderr}`,
  );
  return result.stdout;
}

/** 파일별 위반 규칙 ID(`plugin(rule)` 형식)를 돌려준다. 파일을 만들지 않은 경로는 빈 배열이다. */
function lintRuleIds(cwd, files) {
  const { diagnostics } = JSON.parse(runOxlint(cwd, ["-f", "json", "."]));
  return Object.fromEntries(
    files.map((file) => [
      file,
      diagnostics
        .filter((diagnostic) => diagnostic.filename === file)
        .map((diagnostic) => diagnostic.code),
    ]),
  );
}

describe("소스 lint 구성의 환경 제한 연결", () => {
  const rules = [
    "no-restricted-globals",
    "no-restricted-properties",
    "no-restricted-syntax",
    "no-restricted-imports",
  ];

  /** `--print-config`의 override에서 파일 패턴에 해당하는 규칙 설정을 꺼낸다. */
  const overrideRules = (pattern) => {
    const repo = createLintRepo({});
    try {
      const { overrides } = JSON.parse(runOxlint(repo.cwd, ["--print-config"]));
      const found = overrides.find((override) =>
        override.files.includes(pattern),
      );
      assert.ok(found, `${pattern} override가 없다`);
      return found.rules;
    } finally {
      repo.cleanup();
    }
  };

  const globalNames = (config) =>
    config["no-restricted-globals"].slice(1).map((entry) => entry.name);

  it("src 일반 경로는 환경 제한 규칙 4개를 error로 적용한다", () => {
    const config = overrideRules("src/**/*.ts");
    for (const rule of rules) {
      assert.equal(
        config[oxlintRuleName(rule)][0],
        "deny",
        `${rule}이 error가 아니다`,
      );
    }
    assert.ok(globalNames(config).includes("document"));
    assert.ok(globalNames(config).includes("Buffer"));
  });

  it("src/web 경로는 DOM 전역만 풀고 나머지 제한은 유지한다", () => {
    const config = overrideRules("src/web/**/*.ts");
    for (const rule of rules) {
      assert.equal(
        config[oxlintRuleName(rule)][0],
        "deny",
        `${rule}이 error가 아니다`,
      );
    }
    assert.ok(!globalNames(config).includes("document"));
    assert.ok(globalNames(config).includes("Buffer"));
    assert.ok(globalNames(config).includes("structuredClone"));
  });

  it("src 경로별 규칙 옵션이 게이트와 같은 환경 제한 규칙이다", () => {
    for (const [pattern, expected] of [
      ["src/**/*.ts", restrictedRules],
      ["src/web/**/*.ts", webRestrictedRules],
    ]) {
      const config = overrideRules(pattern);
      for (const rule of rules) {
        assert.deepEqual(
          config[oxlintRuleName(rule)].slice(1),
          expected[rule].slice(1),
          `${pattern}의 ${rule} 옵션이 lint/restricted-rules.js와 다르다`,
        );
      }
    }
  });

  it("src는 DOM 전역을, src/web은 DOM이 아닌 제한만 실제로 막는다", () => {
    const seeds = {
      "src/dom.ts": "export const r = () => document.title;\n",
      "src/web/dom.ts": "export const r = () => document.title;\n",
      "src/web/node.ts": 'export const r = () => Buffer.from("x");\n',
    };
    const repo = createLintRepo(seeds);
    try {
      const ids = lintRuleIds(repo.cwd, Object.keys(seeds));
      assert.deepEqual(ids["src/dom.ts"], ["eslint(no-restricted-globals)"]);
      assert.deepEqual(ids["src/web/dom.ts"], []);
      assert.ok(
        ids["src/web/node.ts"].includes("eslint(no-restricted-globals)"),
      );
    } finally {
      repo.cleanup();
    }
  });
});

describe("환경 제한 규칙의 TypeScript 구문 처리", () => {
  /** 타입 정보 없이 판정되는 `no-restricted-syntax` 결과만 모은다. 다른 규칙의 보고는 무시한다. */
  const lintSyntax = (cases) => {
    const seeds = Object.fromEntries(
      Object.entries(cases).map(([name, code]) => [`src/${name}.ts`, code]),
    );
    const repo = createLintRepo(seeds);
    try {
      const ids = lintRuleIds(repo.cwd, Object.keys(seeds));
      return Object.fromEntries(
        Object.keys(cases).map((name) => [
          name,
          ids[`src/${name}.ts`].filter(
            (id) => id === "repo(no-restricted-syntax)",
          ),
        ]),
      );
    } finally {
      repo.cleanup();
    }
  };

  const result = lintSyntax({
    asAssertion: "export const r = (globalThis as any).document;\n",
    nonNull: "export const r = globalThis!.document;\n",
    typeofType:
      "type G = typeof globalThis;\ntype D = typeof globalThis.document;\nexport type R = [G, D];\n",
  });

  for (const [name, key] of [
    ["as 단언", "asAssertion"],
    ["non-null 단언", "nonNull"],
  ]) {
    it(`${name}으로 감싼 globalThis는 실패한다`, () => {
      assert.deepEqual(result[key], ["repo(no-restricted-syntax)"]);
    });
  }

  it("타입 위치의 typeof globalThis는 통과한다", () => {
    assert.deepEqual(result.typeofType, []);
  });
});
