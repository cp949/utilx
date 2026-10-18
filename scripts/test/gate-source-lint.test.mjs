import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { ESLint, Linter } from "eslint";
import tseslint from "typescript-eslint";
import {
  restrictedRules,
  webRestrictedRules,
} from "../../lint/restricted-rules.js";
import { realRepoRoot } from "./helpers.mjs";

/** 소스 lint 구성(`packages/utilx/eslint.config.js`)이 파일에 적용하는 규칙. 파일을 파싱하지 않는다. */
async function configFor(file) {
  const eslint = new ESLint({ cwd: `${realRepoRoot}packages/utilx` });
  return (await eslint.calculateConfigForFile(file)).rules;
}

const globalNames = (rules) =>
  rules["no-restricted-globals"].slice(1).map((entry) => entry.name);

describe("소스 lint 구성의 환경 제한 연결", () => {
  const rules = [
    "no-restricted-globals",
    "no-restricted-properties",
    "no-restricted-syntax",
    "no-restricted-imports",
  ];

  it("src 일반 경로는 환경 제한 규칙 4개를 error로 적용한다", async () => {
    const config = await configFor("src/array/appendUnique.ts");
    for (const rule of rules) {
      assert.equal(config[rule][0], 2, `${rule}이 error가 아니다`);
    }
    assert.ok(globalNames(config).includes("document"));
    assert.ok(globalNames(config).includes("Buffer"));
  });

  it("src/web 경로는 DOM 전역만 풀고 나머지 제한은 유지한다", async () => {
    const config = await configFor("src/web/downloadUrl.ts");
    for (const rule of rules) {
      assert.equal(config[rule][0], 2, `${rule}이 error가 아니다`);
    }
    assert.ok(!globalNames(config).includes("document"));
    assert.ok(globalNames(config).includes("Buffer"));
    assert.ok(globalNames(config).includes("structuredClone"));
  });

  it("src 경로별 규칙 옵션이 게이트와 같은 환경 제한 규칙이다", async () => {
    for (const [file, expected] of [
      ["src/array/appendUnique.ts", restrictedRules],
      ["src/web/downloadUrl.ts", webRestrictedRules],
    ]) {
      const config = await configFor(file);
      for (const rule of rules) {
        assert.deepEqual(
          config[rule].slice(1),
          expected[rule].slice(1),
          `${file}의 ${rule} 옵션이 lint/restricted-rules.js와 다르다`,
        );
      }
    }
  });
});

describe("환경 제한 규칙의 TypeScript 구문 처리", () => {
  /** dist JS에는 없는 TS 구문을 소스 parser로 lint한다. 타입 정보가 필요 없는 규칙만 적용한다. */
  const lintTs = (code) =>
    new Linter()
      .verify(
        code,
        {
          files: ["**/*.ts"],
          languageOptions: { parser: tseslint.parser, sourceType: "module" },
          rules: restrictedRules,
        },
        "src/a.ts",
      )
      .map((message) => message.ruleId);

  for (const [name, code] of [
    ["as 단언", "export const r = (globalThis as any).document;"],
    ["non-null 단언", "export const r = globalThis!.document;"],
  ]) {
    it(`${name}으로 감싼 globalThis는 실패한다`, () => {
      assert.deepEqual(lintTs(code), ["no-restricted-syntax"]);
    });
  }

  it("타입 위치의 typeof globalThis는 통과한다", () => {
    assert.deepEqual(
      lintTs(
        "type G = typeof globalThis;\ntype D = typeof globalThis.document;\nexport type R = [G, D];",
      ),
      [],
    );
  });
});
