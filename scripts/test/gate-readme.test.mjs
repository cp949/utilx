import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, it } from "node:test";
import {
  findRelativeLinks,
  runReadmeCheck,
  syncReadme,
} from "../sync-readme.mjs";
import { baseRepoFiles, createTempRepo } from "./helpers.mjs";

/** 임시 저장소에서 `body`를 실행하고 항상 정리한다. */
function withRepo(files, body) {
  const repo = createTempRepo(baseRepoFiles(files));
  try {
    return body(repo.root);
  } finally {
    repo.cleanup();
  }
}

describe("check:readme 게이트", () => {
  it("루트와 패키지 README가 같으면 통과한다", () => {
    withRepo(
      { "README.md": "# lib\n", "packages/lib/README.md": "# lib\n" },
      (root) => {
        assert.deepEqual(runReadmeCheck(root), { ok: true, problems: [] });
      },
    );
  });

  it("한 글자만 달라도 실패한다", () => {
    withRepo(
      { "README.md": "# lib\n", "packages/lib/README.md": "# lib \n" },
      (root) => {
        const result = runReadmeCheck(root);
        assert.equal(result.ok, false);
        assert.match(result.problems[0], /packages\/lib\/README\.md가 루트/);
      },
    );
  });

  it("줄바꿈 형식만 달라도 실패한다", () => {
    withRepo(
      { "README.md": "a\nb\n", "packages/lib/README.md": "a\r\nb\r\n" },
      (root) => {
        assert.equal(runReadmeCheck(root).ok, false);
      },
    );
  });

  it("패키지 README가 없으면 실패한다", () => {
    withRepo({ "README.md": "# lib\n" }, (root) => {
      const result = runReadmeCheck(root);
      assert.equal(result.ok, false);
      assert.match(result.problems[0], /packages\/lib\/README\.md가 없다/);
    });
  });

  it("루트 README가 없으면 실패한다", () => {
    withRepo({ "packages/lib/README.md": "# lib\n" }, (root) => {
      const result = runReadmeCheck(root);
      assert.equal(result.ok, false);
      assert.match(result.problems[0], /루트 README\.md가 없다/);
    });
  });

  it("배포 대상 패키지가 0개이면 실패한다", () => {
    withRepo(
      {
        "README.md": "# lib\n",
        "packages/lib/package.json": {
          name: "@test/lib",
          version: "1.0.0",
          private: true,
        },
      },
      (root) => {
        const result = runReadmeCheck(root);
        assert.equal(result.ok, false);
        assert.match(result.problems[0], /배포 대상 패키지/);
      },
    );
  });

  it("private 패키지의 README는 검사하지 않는다", () => {
    withRepo(
      {
        "README.md": "# lib\n",
        "packages/lib/README.md": "# lib\n",
        "packages/internal/package.json": {
          name: "@test/internal",
          version: "1.0.0",
          private: true,
        },
        "packages/internal/README.md": "# 다른 내용\n",
      },
      (root) => {
        assert.equal(runReadmeCheck(root).ok, true);
      },
    );
  });
  it("루트 README에 상대 링크가 있으면 두 README가 같아도 실패한다", () => {
    const text = "# lib\n\n[문서](docs/a.md)\n";
    withRepo({ "README.md": text, "packages/lib/README.md": text }, (root) => {
      const result = runReadmeCheck(root);
      assert.equal(result.ok, false);
      assert.match(
        result.problems[0],
        /README\.md:3의 상대 링크 `docs\/a\.md`/,
      );
    });
  });
});

describe("상대 링크 검출", () => {
  it("인라인 링크·이미지·참조 정의의 상대 경로를 찾는다", () => {
    const text = [
      "[a](docs/a.md)",
      "![b](./img/b.png)",
      "[c]: ../c.md",
      "[d](<docs/d.md>)",
    ].join("\n");
    assert.deepEqual(
      findRelativeLinks(text).map((link) => link.target),
      ["docs/a.md", "./img/b.png", "../c.md", "docs/d.md"],
    );
  });

  it("절대 URL, mailto, 문서 안 앵커는 허용한다", () => {
    const text = [
      "[a](https://github.com/x/y/blob/main/docs/a.md)",
      "[b](http://example.com)",
      "[c](mailto:a@example.com)",
      "[d](#브라우저-검증)",
      "[e]: https://example.com",
    ].join("\n");
    assert.deepEqual(findRelativeLinks(text), []);
  });

  it("코드 블록과 인라인 코드 안의 괄호는 링크로 보지 않는다", () => {
    const text = ["```ts", "fns[0](arg);", "```", "`arr[0](x)` 호출"].join(
      "\n",
    );
    assert.deepEqual(findRelativeLinks(text), []);
  });

  it("줄 번호를 1부터 센다", () => {
    assert.deepEqual(findRelativeLinks("# t\r\n\r\n[a](a.md)"), [
      { line: 3, target: "a.md" },
    ]);
  });
});

describe("sync:readme", () => {
  it("다른 패키지 README를 루트 내용으로 덮어쓰고 검사를 통과시킨다", () => {
    withRepo(
      { "README.md": "# 원본\n", "packages/lib/README.md": "# 옛 사본\n" },
      (root) => {
        assert.deepEqual(syncReadme(root), ["packages/lib/README.md"]);
        assert.equal(
          readFileSync(join(root, "packages/lib/README.md"), "utf8"),
          "# 원본\n",
        );
        assert.equal(runReadmeCheck(root).ok, true);
      },
    );
  });

  it("이미 같으면 바꾼 파일이 없다", () => {
    withRepo(
      { "README.md": "# lib\n", "packages/lib/README.md": "# lib\n" },
      (root) => {
        assert.deepEqual(syncReadme(root), []);
      },
    );
  });
});
