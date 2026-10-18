import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { findRuntimeDependencies, runDepsCheck } from "../check-deps.mjs";
import { baseRepoFiles, createTempRepo } from "./helpers.mjs";

/** `package.json`에 `extra` 필드를 더한 임시 저장소로 `runDepsCheck`를 실행한다. */
function checkWith(extra, { privatePackage = false } = {}) {
  const repo = createTempRepo(
    baseRepoFiles({
      // pnpm은 bundledDependencies를 hoisted 링커에서만 pack한다.
      "pnpm-workspace.yaml":
        'packages:\n  - "packages/*"\nnodeLinker: hoisted\n',
      "packages/lib/package.json": {
        name: "@test/lib",
        version: "1.0.0",
        type: "module",
        files: ["dist"],
        ...(privatePackage ? { private: true } : {}),
        ...extra,
      },
    }),
  );
  try {
    return runDepsCheck(repo.root);
  } finally {
    repo.cleanup();
  }
}

describe("findRuntimeDependencies", () => {
  it("devDependencies는 런타임 의존성으로 보지 않는다", () => {
    assert.deepEqual(
      findRuntimeDependencies({ devDependencies: { a: "1" } }),
      [],
    );
  });

  it("비어 있는 필드는 통과한다", () => {
    assert.deepEqual(
      findRuntimeDependencies({
        dependencies: {},
        peerDependencies: {},
        optionalDependencies: {},
        bundledDependencies: [],
        bundleDependencies: [],
      }),
      [],
    );
  });

  it("bundledDependencies: true는 전부 번들하는 것으로 본다", () => {
    assert.deepEqual(findRuntimeDependencies({ bundledDependencies: true }), [
      { field: "bundledDependencies", names: ["(전부)"] },
    ]);
  });
});

describe("check:deps 게이트", () => {
  it("의존성 필드가 없는 패키지는 통과한다", () => {
    assert.deepEqual(checkWith({}), { ok: true, problems: [] });
  });

  it("devDependencies만 있는 패키지는 통과한다", () => {
    assert.equal(checkWith({ devDependencies: { vitest: "5.0.1" } }).ok, true);
  });

  it("비어 있는 의존성 필드는 통과한다", () => {
    assert.equal(
      checkWith({
        dependencies: {},
        peerDependencies: {},
        bundledDependencies: [],
      }).ok,
      true,
    );
  });

  const forbidden = [
    ["dependencies", { dependencies: { left: "1.0.0" } }, "left"],
    ["peerDependencies", { peerDependencies: { react: "*" } }, "react"],
    [
      "optionalDependencies",
      { optionalDependencies: { fsevents: "2" } },
      "fsevents",
    ],
    ["bundledDependencies 배열", { bundledDependencies: ["inner"] }, "inner"],
    ["bundleDependencies 별칭", { bundleDependencies: ["inner"] }, "inner"],
    ["bundledDependencies: true", { bundledDependencies: true }, "(전부)"],
  ];
  for (const [field, extra, name] of forbidden) {
    it(`${field}에 값이 있으면 소스와 tarball 양쪽에서 실패한다`, () => {
      const result = checkWith(extra);
      assert.equal(result.ok, false);
      assert.equal(result.problems.length, 2, result.problems.join("\n"));
      assert.match(
        result.problems[0],
        new RegExp(
          `packages/lib/package\\.json: .*${name.replace(/[()]/g, "\\$&")}`,
        ),
      );
      assert.match(result.problems[1], /tarball의 package\.json/);
    });
  }

  it("private 패키지는 검사하지 않고 배포 대상 0개로 실패한다", () => {
    const result = checkWith(
      { dependencies: { left: "1.0.0" } },
      { privatePackage: true },
    );
    assert.equal(result.ok, false);
    assert.equal(result.problems.length, 1);
    assert.match(result.problems[0], /배포 대상 패키지.*없다/);
  });
});
