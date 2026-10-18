import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { join } from "node:path";
import {
  createFixtureServer,
  resolveInside,
  routePath,
} from "../browser-fixture-server.mjs";
import { createTempRepo } from "./helpers.mjs";

describe("resolveInside", () => {
  const root = "/srv/fixture";

  it("루트 아래 경로는 실제 파일 경로로 바꾼다", () => {
    assert.equal(
      resolveInside(root, "/files/a.txt"),
      "/srv/fixture/files/a.txt",
    );
  });

  it("`..`로 루트 밖을 가리켜도 루트 안의 경로로 고정한다", () => {
    assert.equal(resolveInside(root, "/../secret"), "/srv/fixture/secret");
    assert.equal(resolveInside(root, "/%2e%2e/secret"), "/srv/fixture/secret");
    assert.equal(resolveInside(root, "/a/../../secret"), "/srv/fixture/secret");
  });

  it("접두사만 같은 형제 디렉터리로 나가지 않는다", () => {
    const resolved = resolveInside(root, "/../fixture-other/a.txt");
    assert.equal(resolved, "/srv/fixture/fixture-other/a.txt");
  });

  it("NUL 문자와 잘못된 인코딩은 거부한다", () => {
    assert.equal(resolveInside(root, "/a%00b"), null);
    assert.equal(resolveInside(root, "/%E0%A4%A"), null);
  });
});

describe("routePath", () => {
  const dirs = { fixtureDir: "/f", distDir: "/d" };

  it("/ 는 index.html로 보낸다", () => {
    assert.deepEqual(routePath("/", dirs), {
      root: "/f",
      relative: "/index.html",
    });
  });

  it("/dist/ 아래는 dist 디렉터리로 보낸다", () => {
    assert.deepEqual(routePath("/dist/index.js", dirs), {
      root: "/d",
      relative: "/index.js",
    });
  });

  it("dist로 시작하는 다른 이름은 fixture로 보낸다", () => {
    assert.deepEqual(routePath("/distant.js", dirs), {
      root: "/f",
      relative: "/distant.js",
    });
  });
});

describe("createFixtureServer", () => {
  it("fixture와 dist를 서빙하고, 없는 파일은 404이며, 루트 밖 파일은 서빙하지 않는다", async () => {
    const repo = createTempRepo({
      "fixture/index.html": "<p>index</p>",
      "fixture/files/sample.txt": "sample",
      "dist/index.js": "export {};",
      "secret.txt": "secret",
    });
    const server = createFixtureServer({
      fixtureDir: join(repo.root, "fixture"),
      distDir: join(repo.root, "dist"),
    });
    await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
    const { port } = server.address();
    const get = (path) => fetch(`http://127.0.0.1:${String(port)}${path}`);

    try {
      const index = await get("/");
      assert.equal(index.status, 200);
      assert.match(index.headers.get("content-type"), /^text\/html/);
      assert.equal(await index.text(), "<p>index</p>");

      const dist = await get("/dist/index.js");
      assert.match(dist.headers.get("content-type"), /^text\/javascript/);
      assert.equal(await dist.text(), "export {};");

      assert.equal((await get("/files/sample.txt")).status, 200);
      assert.equal((await get("/missing.txt")).status, 404);

      // 루트 밖의 secret.txt는 어떤 경로로도 내려가지 않는다.
      for (const path of [
        "/../secret.txt",
        "/dist/%2e%2e/secret.txt",
        "/dist/../secret.txt",
      ]) {
        const response = await get(path);
        assert.equal(response.status, 404, path);
      }
      assert.equal((await get("/a%00b")).status, 400);
    } finally {
      await new Promise((resolve) => server.close(resolve));
      repo.cleanup();
    }
  });
});
