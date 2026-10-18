import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { ESLint } from "eslint";
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
});
