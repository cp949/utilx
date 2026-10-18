import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  buildImageArgs,
  buildRunArgs,
  resolveContainerRuntime,
} from "../browser-container.mjs";
import {
  assertDistBuilt,
  parseProject,
  playwrightCommand,
} from "../run-browser.mjs";
import { createTempRepo } from "./helpers.mjs";

describe("parseProject", () => {
  it("등록된 project 이름을 돌려준다", () => {
    assert.equal(parseProject(["chromium-latest"]), "chromium-latest");
    assert.equal(parseProject(["chrome83"]), "chrome83");
  });

  it("인자가 없거나 알 수 없는 project면 실패한다", () => {
    assert.throws(() => parseProject([]), /project는 하나만 받는다/);
    assert.throws(() => parseProject(["firefox"]), /받은 값: firefox/);
  });

  it("project를 둘 이상 받으면 실패한다", () => {
    assert.throws(
      () => parseProject(["chrome83", "chromium-latest"]),
      /project는 하나만 받는다/,
    );
  });
});

describe("assertDistBuilt", () => {
  it("dist/index.js가 없으면 pnpm build 안내와 함께 실패한다", () => {
    const repo = createTempRepo({ "packages/utilx/package.json": {} });
    try {
      assert.throws(() => assertDistBuilt(repo.root), /pnpm build/);
    } finally {
      repo.cleanup();
    }
  });

  it("dist/index.js가 있으면 통과한다", () => {
    const repo = createTempRepo({
      "packages/utilx/dist/index.js": "export {};\n",
    });
    try {
      assert.doesNotThrow(() => assertDistBuilt(repo.root));
    } finally {
      repo.cleanup();
    }
  });
});

describe("playwrightCommand", () => {
  it("project 하나만 지정해 Playwright CLI를 실행한다", () => {
    const [node, cli, subcommand, project] = playwrightCommand("chrome83");
    assert.equal(node, "node");
    assert.ok(cli.endsWith("cli.js"));
    assert.equal(subcommand, "test");
    assert.equal(project, "--project=chrome83");
  });
});

describe("resolveContainerRuntime", () => {
  it("podman이 있으면 podman을 고른다", () => {
    assert.equal(
      resolveContainerRuntime((name) => name === "podman"),
      "podman",
    );
  });

  it("podman이 없으면 docker가 있어도 대체하지 않고 실패한다", () => {
    assert.throws(
      () => resolveContainerRuntime((name) => name === "docker"),
      /podman을 찾을 수 없다.*docker로 대체하지 않는다/,
    );
  });
});

describe("컨테이너 인자", () => {
  it("이미지 빌드는 이름과 컨텍스트를 지정한다", () => {
    assert.deepEqual(buildImageArgs({ contextDir: "/repo/docker/chrome83" }), [
      "build",
      "-t",
      "utilx-chrome83",
      "/repo/docker/chrome83",
    ]);
  });

  it("실행은 호스트 네트워크, 호스트 사용자, 저장소 마운트를 쓰고 컨테이너 재진입 표시를 넣는다", () => {
    const args = buildRunArgs({
      repoRoot: "/work/utilx",
      uid: 1000,
      gid: 1001,
      command: ["node", "scripts/run-browser.mjs", "chrome83"],
    });
    assert.deepEqual(args.slice(0, 3), ["run", "--rm", "--network"]);
    assert.ok(args.includes("host"));
    assert.ok(args.includes("1000:1001"));
    assert.ok(args.includes("/work/utilx:/repo"));
    assert.ok(args.includes("UTILX_BROWSER_CONTAINER=1"));
    assert.deepEqual(args.slice(-4), [
      "utilx-chrome83",
      "node",
      "scripts/run-browser.mjs",
      "chrome83",
    ]);
  });
});
