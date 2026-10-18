import assert from "node:assert/strict";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { describe, it } from "node:test";
import { BUNDLE_BASELINE_FILE, runBundleCheck } from "../check-bundle.mjs";
import { baseRepoFiles, createTempRepo } from "./helpers.mjs";

/** 정상 상태의 배포 패키지 파일. 값이 `null`인 항목은 빼고 쓴다. */
function bundleFiles(overrides = {}) {
  const files = baseRepoFiles({
    "packages/lib/package.json": {
      name: "@test/lib",
      version: "1.0.0",
      type: "module",
      sideEffects: false,
      files: ["dist"],
      exports: {
        ".": { types: "./dist/index.d.ts", default: "./dist/index.js" },
      },
    },
    "packages/lib/dist/index.js":
      'export { trim } from "./string/trim.js";\nexport { open } from "./web/open.js";\n',
    "packages/lib/dist/string/trim.js":
      "export const trim = (value) => value.trim();\n",
    "packages/lib/dist/web/open.js": "export const open = () => 1;\n",
    ...overrides,
  });
  return Object.fromEntries(
    Object.entries(files).filter(([, content]) => content !== null),
  );
}

/** `trim` 소비자에 `dist/web/`를 금지하는 측정 목록. */
const ENTRIES = [
  { name: "trim", exportName: "trim", forbidden: ["dist/web/"] },
];

/** 임시 저장소를 만들어 `run(repo)`를 실행하고 정리한다. */
async function withRepo(overrides, run) {
  const repo = createTempRepo(bundleFiles(overrides));
  try {
    return await run(repo);
  } finally {
    repo.cleanup();
  }
}

const baselinePath = (repo) => join(repo.root, BUNDLE_BASELINE_FILE);
const readBaseline = (repo) =>
  JSON.parse(readFileSync(baselinePath(repo), "utf8"));
const writeBaseline = (repo, value) =>
  writeFileSync(baselinePath(repo), JSON.stringify(value));

/** baseline을 만든 뒤 검사를 실행한다. */
async function writeThenCheck(repo, entries = ENTRIES) {
  const written = await runBundleCheck(repo.root, { write: true, entries });
  assert.equal(written.ok, true, written.problems.join("\n"));
  return runBundleCheck(repo.root, { entries });
}

describe("check:bundle 게이트", () => {
  it("정상 패키지는 baseline을 쓴 뒤 통과한다", async () => {
    await withRepo({}, async (repo) => {
      const result = await writeThenCheck(repo);
      assert.deepEqual(
        { ok: result.ok, problems: result.problems },
        { ok: true, problems: [] },
      );
      assert.deepEqual(readBaseline(repo).entries.trim.modules, [
        "dist/string/trim.js",
      ]);
    });
  });

  it("baseline이 없으면 실패한다", async () => {
    await withRepo({}, async (repo) => {
      const result = await runBundleCheck(repo.root, { entries: ENTRIES });
      assert.equal(result.ok, false);
      assert.match(result.problems[0], /bundle-baseline\.json이 없다/);
    });
  });

  it("배포 대상이 1개가 아니면 실패한다", async () => {
    await withRepo(
      {
        "packages/lib/package.json": {
          name: "@test/lib",
          version: "1.0.0",
          private: true,
        },
      },
      async (repo) => {
        const result = await runBundleCheck(repo.root, { entries: ENTRIES });
        assert.equal(result.ok, false);
        assert.match(result.problems[0], /1개를 가정한다.*현재 0개/);
      },
    );
  });

  it("배포 package.json에 sideEffects: false가 없으면 실패한다", async () => {
    await withRepo(
      {
        "packages/lib/package.json": {
          name: "@test/lib",
          version: "1.0.0",
          type: "module",
          files: ["dist"],
          exports: {
            ".": { types: "./dist/index.d.ts", default: "./dist/index.js" },
          },
        },
      },
      async (repo) => {
        const result = await runBundleCheck(repo.root, {
          write: true,
          entries: ENTRIES,
        });
        assert.equal(result.ok, false);
        assert.match(
          result.problems.join("\n"),
          /sideEffects가 false가 아니다\(현재 undefined\)/,
        );
        assert.equal(existsSync(baselinePath(repo)), false);
      },
    );
  });

  describe("최상위 부작용", () => {
    const effect = {
      "packages/lib/dist/web/open.js":
        'document.title = "x";\nexport const open = () => 1;\n',
    };

    it("sideEffects 선언에 가려진 최상위 DOM 접근은 실패한다", async () => {
      await withRepo(effect, async (repo) => {
        const result = await runBundleCheck(repo.root, { entries: ENTRIES });
        assert.equal(result.ok, false);
        assert.match(
          result.problems.join("\n"),
          /entry trim: sideEffects 선언을 무시하면 모듈이 더 남는다.*dist\/web\/open\.js/,
        );
      });
    });

    it("실패하면 --write는 baseline을 쓰지 않는다", async () => {
      await withRepo(effect, async (repo) => {
        const result = await runBundleCheck(repo.root, {
          write: true,
          entries: ENTRIES,
        });
        assert.equal(result.ok, false);
        assert.equal(existsSync(baselinePath(repo)), false);
      });
    });
  });

  describe("금지 모듈", () => {
    const leaking = {
      "packages/lib/dist/string/trim.js":
        'import { open } from "../web/open.js";\nexport const trim = (value) => open() + value.trim();\n',
    };

    it("trim 번들에 dist/web/ 모듈이 남으면 실패한다", async () => {
      await withRepo(leaking, async (repo) => {
        const result = await runBundleCheck(repo.root, { entries: ENTRIES });
        assert.equal(result.ok, false);
        assert.match(
          result.problems.join("\n"),
          /entry trim: 금지된 dist\/web\/ 모듈.*dist\/web\/open\.js/,
        );
      });
    });

    it("금지 모듈이 있으면 --write는 baseline을 쓰지 않는다", async () => {
      await withRepo(leaking, async (repo) => {
        const result = await runBundleCheck(repo.root, {
          write: true,
          entries: ENTRIES,
        });
        assert.equal(result.ok, false);
        assert.equal(existsSync(baselinePath(repo)), false);
      });
    });
  });

  it("대조군이 요구 모듈을 못 찾으면 실패한다", async () => {
    await withRepo({}, async (repo) => {
      const result = await runBundleCheck(repo.root, {
        entries: [
          { name: "trim", exportName: "trim", required: ["dist/web/"] },
        ],
      });
      assert.equal(result.ok, false);
      assert.match(result.problems.join("\n"), /대조군이 요구하는 dist\/web\//);
    });
  });

  describe("baseline 대조", () => {
    it("포함 모듈 목록이 다르면 실패한다", async () => {
      await withRepo({}, async (repo) => {
        const written = await runBundleCheck(repo.root, {
          write: true,
          entries: ENTRIES,
        });
        assert.equal(written.ok, true);
        const baseline = readBaseline(repo);
        baseline.entries.trim.modules = ["dist/string/other.js"];
        writeBaseline(repo, baseline);

        const result = await runBundleCheck(repo.root, { entries: ENTRIES });
        assert.equal(result.ok, false);
        assert.match(
          result.problems.join("\n"),
          /entry trim: 포함 모듈이 baseline과 다르다/,
        );
      });
    });

    it("entry 목록이 다르면 실패한다", async () => {
      await withRepo({}, async (repo) => {
        await writeThenCheck(repo);
        const result = await runBundleCheck(repo.root, {
          entries: [...ENTRIES, { name: "open", exportName: "open" }],
        });
        assert.equal(result.ok, false);
        assert.match(result.problems.join("\n"), /entry 목록/);
      });
    });

    for (const [제목, 변경, 패턴] of [
      [
        "번들러 버전",
        (b) => (b.bundler.version = "0.0.1"),
        /번들러 버전\(0\.0\.1\)/,
      ],
      ["target", (b) => (b.options.target = "es2020"), /target\(es2020\)/],
      ["minify", (b) => (b.options.minify = false), /minify\(false\)/],
    ]) {
      it(`baseline의 ${제목} 값이 다르면 실패한다`, async () => {
        await withRepo({}, async (repo) => {
          await writeThenCheck(repo);
          const baseline = readBaseline(repo);
          변경(baseline);
          writeBaseline(repo, baseline);

          const result = await runBundleCheck(repo.root, { entries: ENTRIES });
          assert.equal(result.ok, false);
          assert.match(result.problems.join("\n"), 패턴);
        });
      });
    }

    it("bytes만 달라지면 통과하고 참고 메시지를 남긴다", async () => {
      await withRepo({}, async (repo) => {
        await writeThenCheck(repo);
        writeFileSync(
          join(repo.root, "packages/lib/dist/string/trim.js"),
          "export const trim = (value) => value.trim().normalize();\n",
        );

        const result = await runBundleCheck(repo.root, { entries: ENTRIES });
        assert.equal(result.ok, true, result.problems.join("\n"));
        assert.match(
          result.notes.join("\n"),
          /entry trim: bytes가 baseline과 다르다/,
        );
      });
    });
  });
});
