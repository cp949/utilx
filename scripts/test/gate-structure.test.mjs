import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { loadBaseline, parseBaseline } from "../baseline.mjs";
import { runEscompatGate } from "../check-escompat.mjs";
import { listPublishablePackages } from "../workspace-packages.mjs";
import { baseRepoFiles, createTempRepo } from "./helpers.mjs";

/** 임시 저장소에서 `body`를 실행하고 항상 정리한다. */
async function withRepo(files, body) {
  const repo = createTempRepo(files);
  try {
    return await body(repo.root);
  } finally {
    repo.cleanup();
  }
}

describe("escompat 게이트: 검사 대상 구조", () => {
  it("정상 dist는 통과하고 검사한 파일 수를 돌려준다", async () => {
    await withRepo(baseRepoFiles(), async (root) => {
      const result = await runEscompatGate(root);
      assert.equal(result.ok, true);
      assert.equal(result.files.length, 1);
    });
  });

  it("dist 디렉터리가 없으면 실패한다", async () => {
    const files = baseRepoFiles();
    delete files["packages/lib/dist/index.js"];
    await withRepo(files, async (root) => {
      const result = await runEscompatGate(root);
      assert.equal(result.ok, false);
      assert.match(
        result.problems.join("\n"),
        /packages\/lib\/dist: 검사할 JS가 0건/,
      );
    });
  });

  it("dist에 JS가 없고 선언 파일만 있으면 실패한다", async () => {
    const files = baseRepoFiles();
    delete files["packages/lib/dist/index.js"];
    files["packages/lib/dist/index.d.ts"] = "export declare const a: number;\n";
    await withRepo(files, async (root) => {
      const result = await runEscompatGate(root);
      assert.equal(result.ok, false);
      assert.match(result.problems.join("\n"), /검사할 JS가 0건/);
    });
  });

  it("배포 대상 패키지가 0개이면 실패한다", async () => {
    const files = baseRepoFiles({
      "packages/lib/package.json": { name: "@test/lib", private: true },
    });
    await withRepo(files, async (root) => {
      const result = await runEscompatGate(root);
      assert.equal(result.ok, false);
      assert.match(result.problems.join("\n"), /배포 대상 패키지.*없다/);
    });
  });

  it("packages 디렉터리가 없어도 배포 대상 0개로 실패한다", async () => {
    await withRepo(
      {
        "pnpm-workspace.yaml": 'packages:\n  - "packages/*"\n',
        "baseline.json": { chromeFloor: 75, esTarget: "ES2019" },
      },
      async (root) => {
        const result = await runEscompatGate(root);
        assert.equal(result.ok, false);
        assert.match(result.problems.join("\n"), /배포 대상 패키지.*없다/);
      },
    );
  });

  it("private 패키지의 dist는 검사하지 않는다", async () => {
    const files = baseRepoFiles({
      "packages/internal/package.json": {
        name: "@test/internal",
        private: true,
      },
      "packages/internal/dist/index.js": "export const r = document.title;\n",
    });
    await withRepo(files, async (root) => {
      const result = await runEscompatGate(root);
      assert.equal(result.ok, true);
      assert.deepEqual(
        result.files.map((file) => file.slice(root.length + 1)),
        ["packages/lib/dist/index.js"],
      );
    });
  });

  it("dist의 위반은 파일 위치와 규칙 ID를 포함해 실패한다", async () => {
    const files = baseRepoFiles({
      "packages/lib/dist/index.js": "export const r = () => document.title;\n",
    });
    await withRepo(files, async (root) => {
      const result = await runEscompatGate(root);
      assert.equal(result.ok, false);
      assert.match(
        result.problems.join("\n"),
        /packages\/lib\/dist\/index\.js:1:\d+ no-restricted-globals/,
      );
    });
  });

  it("dist/web의 DOM 접근은 통과하고 그 밖은 실패한다", async () => {
    const files = baseRepoFiles({
      "packages/lib/dist/web/a.js": "export const r = () => document.title;\n",
      "packages/lib/dist/other/b.js":
        "export const r = () => document.title;\n",
    });
    await withRepo(files, async (root) => {
      const result = await runEscompatGate(root);
      assert.equal(result.ok, false);
      assert.equal(result.problems.length, 1);
      assert.match(result.problems[0], /dist\/other\/b\.js/);
    });
  });

  it("dist의 eslint-disable 주석은 게이트를 우회하지 못한다", async () => {
    const files = baseRepoFiles({
      "packages/lib/dist/index.js":
        "/* eslint-disable */\nexport const r = () => document.title;\n",
    });
    await withRepo(files, async (root) => {
      assert.equal((await runEscompatGate(root)).ok, false);
    });
  });

  it("pnpm-workspace.yaml이 없으면 예외를 던진다", async () => {
    const files = baseRepoFiles();
    delete files["pnpm-workspace.yaml"];
    await withRepo(files, async (root) => {
      assert.throws(
        () => listPublishablePackages(root),
        /pnpm-workspace\.yaml이 없다/,
      );
    });
  });

  it("지원하지 않는 workspace 패턴이면 예외를 던진다", async () => {
    const files = baseRepoFiles({
      "pnpm-workspace.yaml": 'packages:\n  - "packages/**"\n',
    });
    await withRepo(files, async (root) => {
      assert.throws(
        () => listPublishablePackages(root),
        /지원하지 않는 workspace 패턴/,
      );
    });
  });
});

describe("baseline 검증", () => {
  const valid = { chromeFloor: 75, esTarget: "ES2019" };

  it("올바른 baseline은 그대로 돌려준다", () => {
    assert.deepEqual(parseBaseline(valid), valid);
  });

  const invalid = [
    ["객체가 아님(null)", null, /객체여야 한다/],
    ["객체가 아님(배열)", [], /객체여야 한다/],
    [
      "알 수 없는 키",
      { ...valid, chromeFlor: 80 },
      /알 수 없는 키가 있다: chromeFlor/,
    ],
    ["chromeFloor 누락", { esTarget: "ES2019" }, /chromeFloor는 양의 정수/],
    ["chromeFloor 0", { ...valid, chromeFloor: 0 }, /chromeFloor는 양의 정수/],
    [
      "chromeFloor 음수",
      { ...valid, chromeFloor: -75 },
      /chromeFloor는 양의 정수/,
    ],
    [
      "chromeFloor 소수",
      { ...valid, chromeFloor: 75.5 },
      /chromeFloor는 양의 정수/,
    ],
    [
      "chromeFloor 문자열",
      { ...valid, chromeFloor: "75" },
      /chromeFloor는 양의 정수/,
    ],
    ["esTarget 누락", { chromeFloor: 75 }, /esTarget은/],
    ["esTarget 형식 오류", { ...valid, esTarget: "ES19" }, /esTarget은/],
    ["esTarget 숫자", { ...valid, esTarget: 2019 }, /esTarget은/],
  ];
  for (const [name, value, message] of invalid) {
    it(`${name}이면 예외를 던진다`, () => {
      assert.throws(() => parseBaseline(value), message);
    });
  }

  it("baseline.json이 없으면 예외를 던진다", async () => {
    await withRepo({}, (root) => {
      assert.throws(() => loadBaseline(root), /baseline\.json을 읽을 수 없다/);
    });
  });

  it("baseline.json이 JSON이 아니면 예외를 던진다", async () => {
    await withRepo({ "baseline.json": "{ chromeFloor: " }, (root) => {
      assert.throws(() => loadBaseline(root), /baseline\.json을 읽을 수 없다/);
    });
  });

  it("잘못된 baseline이면 게이트도 실패한다", async () => {
    const files = baseRepoFiles({
      "baseline.json": { chromeFloor: 0, esTarget: "ES2019" },
    });
    await withRepo(files, async (root) => {
      await assert.rejects(runEscompatGate(root), /chromeFloor는 양의 정수/);
    });
  });

  it("es-x에 없는 프리셋이면 게이트가 실패한다", async () => {
    const files = baseRepoFiles({
      "baseline.json": { chromeFloor: 75, esTarget: "ES1999" },
    });
    await withRepo(files, async (root) => {
      await assert.rejects(runEscompatGate(root), /프리셋 .*ES1999|es1999/i);
    });
  });
});
