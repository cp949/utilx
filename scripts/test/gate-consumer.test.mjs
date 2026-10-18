import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { runConsumerCheck } from "../check-consumer.mjs";
import { baseRepoFiles, createTempRepo } from "./helpers.mjs";

/** 정상 상태의 배포 패키지 파일. 값이 `null`인 항목은 빼고 쓴다. */
function consumerFiles(overrides = {}) {
  const files = baseRepoFiles({
    "packages/lib/package.json": {
      name: "@test/lib",
      version: "1.0.0",
      type: "module",
      files: ["dist"],
      exports: {
        ".": { types: "./dist/index.d.ts", default: "./dist/index.js" },
      },
    },
    "packages/lib/README.md": "# lib\n",
    "packages/lib/LICENSE": "MIT\n",
    "packages/lib/dist/index.js": 'export { a } from "./a.js";\n',
    "packages/lib/dist/index.d.ts": 'export { a, listen } from "./a.js";\n',
    "packages/lib/dist/a.js":
      "export const a = 1;\nexport function listen() {}\n",
    // 실제 선언처럼 DOM 타입을 쓴다. DOM lib 요구 조건 검사가 이 타입에 의존한다.
    "packages/lib/dist/a.d.ts":
      "export declare const a: number;\nexport declare function listen(signal: AbortSignal): void;\n",
    ...overrides,
  });
  return Object.fromEntries(
    Object.entries(files).filter(([, content]) => content !== null),
  );
}

/** 임시 저장소에서 `runConsumerCheck`를 실행한다. */
function checkWith(overrides = {}) {
  const repo = createTempRepo(consumerFiles(overrides));
  try {
    return runConsumerCheck(repo.root);
  } finally {
    repo.cleanup();
  }
}

/** `package.json`의 일부를 바꾼 파일 집합. */
function manifestWith(extra) {
  return {
    "packages/lib/package.json": {
      name: "@test/lib",
      version: "1.0.0",
      type: "module",
      files: ["dist"],
      exports: {
        ".": { types: "./dist/index.d.ts", default: "./dist/index.js" },
      },
      ...extra,
    },
  };
}

/** 실패해야 하는 사례를 검사하고 문제 메시지를 돌려준다. */
function assertFails(overrides, pattern) {
  const result = checkWith(overrides);
  assert.equal(result.ok, false, "실패해야 하는데 통과했다");
  assert.match(result.problems.join("\n"), pattern);
  return result.problems;
}

describe("check:consumer 게이트", () => {
  it("정상 패키지는 통과한다", () => {
    assert.deepEqual(checkWith(), { ok: true, problems: [] });
  });

  it("배포 대상 0개는 실패한다", () => {
    const result = checkWith(manifestWith({ private: true }));
    assert.equal(result.ok, false);
    assert.match(result.problems[0], /배포 대상 패키지.*없다/);
  });

  describe("tarball 파일 집합", () => {
    it("README.md가 없으면 실패한다", () => {
      assertFails(
        { "packages/lib/README.md": null },
        /README\.md가 tarball에 없다/,
      );
    });

    it("LICENSE가 없으면 실패한다", () => {
      assertFails({ "packages/lib/LICENSE": null }, /LICENSE가 tarball에 없다/);
    });

    it("소스가 포함되면 실패한다", () => {
      assertFails(
        {
          ...manifestWith({ files: ["dist", "src"] }),
          "packages/lib/src/a.ts": "export const a = 1;\n",
        },
        /허용 목록.*밖의 파일이 포함됐다: src\/a\.ts/,
      );
    });
  });

  describe("exports", () => {
    it("exports 필드가 없으면 실패한다", () => {
      assertFails(manifestWith({ exports: undefined }), /exports 필드가 없다/);
    });

    it("JS 대상 파일이 없으면 실패한다", () => {
      assertFails(
        manifestWith({
          exports: {
            ".": { types: "./dist/index.d.ts", default: "./dist/nope.js" },
          },
        }),
        /대상 파일이 tarball에 없다: \.\/dist\/nope\.js/,
      );
    });

    it("선언 파일이 빠지면 실패한다", () => {
      assertFails(
        { "packages/lib/dist/index.d.ts": null },
        /대상 파일이 tarball에 없다: \.\/dist\/index\.d\.ts/,
      );
    });

    it("types 조건이 없으면 실패한다", () => {
      assertFails(
        manifestWith({ exports: { ".": "./dist/index.js" } }),
        /types 조건의 \.d\.ts 대상이 없다/,
      );
    });

    it("./로 시작하지 않는 대상은 실패한다", () => {
      assertFails(
        manifestWith({
          exports: {
            ".": { types: "dist/index.d.ts", default: "dist/index.js" },
          },
        }),
        /\.\/로 시작하지 않는다/,
      );
    });

    it("공개 서브패스가 없으면 실패한다", () => {
      assertFails(
        manifestWith({ exports: { ".": null } }),
        /exports에 공개 서브패스가 없다/,
      );
    });

    it("null로 막은 서브패스는 공개 대상으로 검사하지 않는다", () => {
      const result = checkWith(
        manifestWith({
          exports: {
            ".": { types: "./dist/index.d.ts", default: "./dist/index.js" },
            "./internal": null,
          },
        }),
      );
      assert.deepEqual(result, { ok: true, problems: [] });
    });

    it("패턴 대상은 실패한다", () => {
      assertFails(
        manifestWith({
          exports: {
            ".": { types: "./dist/*.d.ts", default: "./dist/*.js" },
          },
        }),
        /패턴 대상은 지원하지 않는다/,
      );
    });
  });

  describe("내부 상대 경로", () => {
    it("JS의 상대 import가 깨지면 실패한다", () => {
      assertFails(
        { "packages/lib/dist/index.js": 'export { a } from "./gone.js";\n' },
        /dist\/index\.js: .*\.\/gone\.js/,
      );
    });

    it("선언 파일의 상대 import가 깨지면 실패한다", () => {
      assertFails(
        {
          "packages/lib/dist/index.d.ts":
            'export { a, listen } from "./gone.js";\n',
        },
        /dist\/index\.d\.ts: .*\.\/gone\.js/,
      );
    });

    it("선언 파일의 import() 타입 경로가 깨져도 실패한다", () => {
      assertFails(
        {
          "packages/lib/dist/a.d.ts":
            'export declare const a: import("./gone.js").T;\nexport declare function listen(signal: AbortSignal): void;\n',
        },
        /dist\/a\.d\.ts: .*\.\/gone\.js/,
      );
    });

    it("패키지 밖을 가리키는 상대 import는 실패한다", () => {
      assertFails(
        { "packages/lib/dist/index.js": 'export { a } from "../../a.js";\n' },
        /dist\/index\.js: 패키지 밖을 가리키는 상대 import다: \.\.\/\.\.\/a\.js/,
      );
    });

    it("주석 안의 예제 import는 검사하지 않는다", () => {
      const result = checkWith({
        "packages/lib/dist/a.js":
          '/** @example\n * import { x } from "./example.js";\n */\n// import { y } from "./other.js";\nexport const a = 1;\nexport function listen() {}\n',
      });
      assert.deepEqual(result, { ok: true, problems: [] });
    });
  });

  describe("DOM 없는 ESM import", () => {
    it("import 시점에 document에 접근하면 실패한다", () => {
      assertFails(
        {
          "packages/lib/dist/a.js":
            "export const a = document.title;\nexport function listen() {}\n",
        },
        /DOM 없는 bare ESM import가 실패했다/,
      );
    });
  });

  describe("TypeScript 소비자", () => {
    it("선언 파일에 타입 오류가 있으면 실패한다", () => {
      assertFails(
        {
          "packages/lib/dist/a.d.ts":
            "export declare const a: Missing;\nexport declare function listen(signal: AbortSignal): void;\n",
        },
        /TypeScript 소비자\(nodenext, DOM lib 포함\) 컴파일이 실패했다/,
      );
    });

    it("DOM lib 없이도 컴파일되면 요구 조건 기록이 낡았다고 실패한다", () => {
      assertFails(
        {
          "packages/lib/dist/a.d.ts":
            "export declare const a: number;\nexport declare function listen(): void;\n",
        },
        /DOM lib 없이 skipLibCheck:false 컴파일이 통과했다/,
      );
    });
  });
});
