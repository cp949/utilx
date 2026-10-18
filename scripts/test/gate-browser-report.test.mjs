import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { buildReport, describeOs, validateReport } from "../browser-report.mjs";

const OS = describeOs({ platform: "linux", release: "6.6", arch: "x64" });

/** 정상 시나리오 하나. 필요한 필드만 덮어쓴다. */
function scenario(overrides = {}) {
  return {
    title: "다운로드 › 클릭",
    file: "e2e/specs/download.spec.ts",
    status: "passed",
    durationMs: 10,
    annotations: [
      { type: "browserVersion", description: "153.0.8010.12" },
      { type: "origin", description: "http://127.0.0.1:4601" },
      { type: "permissions", description: "none" },
    ],
    ...overrides,
  };
}

function reportOf(tests, project = "chromium-latest") {
  return buildReport({
    project,
    generatedAt: "2026-01-01T00:00:00.000Z",
    os: OS,
    tests,
  });
}

describe("describeOs", () => {
  it("os-release의 PRETTY_NAME을 distro로 담는다", () => {
    const os = describeOs({
      platform: "linux",
      release: "6.6",
      arch: "x64",
      osReleaseText:
        'NAME="Debian"\nPRETTY_NAME="Debian GNU/Linux 10 (buster)"\n',
    });
    assert.equal(os.distro, "Debian GNU/Linux 10 (buster)");
  });

  it("os-release가 없으면 distro를 담지 않는다", () => {
    assert.equal("distro" in OS, false);
  });
});

describe("buildReport", () => {
  it("시나리오 상태를 passed, failed, skipped로 집계한다", () => {
    const report = reportOf([
      scenario({ status: "passed" }),
      scenario({ status: "failed" }),
      scenario({ status: "timedOut" }),
      scenario({ status: "skipped" }),
    ]);
    assert.deepEqual(report.summary, {
      total: 4,
      passed: 1,
      failed: 2,
      skipped: 1,
    });
  });

  it("annotation에서 브라우저 버전, origin, 권한을 읽는다", () => {
    const report = reportOf([scenario()]);
    assert.equal(report.browser.version, "153.0.8010.12");
    assert.equal(report.scenarios[0].origin, "http://127.0.0.1:4601");
    assert.equal(report.scenarios[0].permissions, "none");
  });

  it("어느 project도 Chrome 75를 실행했다고 표기하지 않는다", () => {
    for (const project of ["chromium-latest", "chrome83"]) {
      assert.equal(
        reportOf([scenario()], project).evidence.chrome75Executed,
        false,
      );
    }
  });

  it("chrome83은 하한 근사 증거로, 최신 Chromium은 latest로 구분한다", () => {
    assert.equal(
      reportOf([scenario()], "chrome83").evidence.kind,
      "floor-proxy",
    );
    assert.equal(
      reportOf([scenario()], "chromium-latest").evidence.kind,
      "latest",
    );
  });
});

describe("validateReport", () => {
  it("모든 조건이 기록되면 문제가 없다", () => {
    assert.deepEqual(validateReport(reportOf([scenario()])), []);
  });

  it("시나리오가 없으면 실패한다", () => {
    assert.deepEqual(validateReport(reportOf([])), [
      "실행된 시나리오가 없다",
      "브라우저 버전이 기록되지 않았다",
    ]);
  });

  it("브라우저 버전 기록이 없으면 실패한다", () => {
    const report = reportOf([scenario({ annotations: [] })]);
    assert.ok(
      validateReport(report).includes("브라우저 버전이 기록되지 않았다"),
    );
  });

  it("브라우저 버전이 둘 이상이면 실패한다", () => {
    const other = scenario({
      annotations: [
        { type: "browserVersion", description: "83.0.4103.116" },
        { type: "origin", description: "http://127.0.0.1:4601" },
        { type: "permissions", description: "none" },
      ],
    });
    const problems = validateReport(reportOf([scenario(), other]));
    assert.ok(
      problems.some((problem) =>
        problem.startsWith("브라우저 버전이 둘 이상이다"),
      ),
    );
  });

  it("origin이나 권한 기록이 빠진 시나리오를 찾는다", () => {
    const report = reportOf([
      scenario(),
      scenario({
        title: "빠진 시나리오",
        annotations: [{ type: "browserVersion", description: "153.0.8010.12" }],
      }),
    ]);
    assert.deepEqual(validateReport(report), [
      "origin이 기록되지 않았다: 빠진 시나리오",
      "권한 조건이 기록되지 않았다: 빠진 시나리오",
    ]);
  });

  it("건너뛴 시나리오는 origin·권한 기록을 요구하지 않는다", () => {
    const report = reportOf([
      scenario(),
      scenario({ status: "skipped", annotations: [] }),
    ]);
    assert.deepEqual(validateReport(report), []);
  });

  it("알 수 없는 project는 실패한다", () => {
    const report = reportOf([scenario()], "firefox");
    assert.ok(validateReport(report).includes("알 수 없는 project: firefox"));
  });

  it("OS 정보가 비면 실패한다", () => {
    const report = {
      ...reportOf([scenario()]),
      os: { platform: "", release: "", arch: "" },
    };
    assert.ok(validateReport(report).includes("OS 정보가 기록되지 않았다"));
  });
});
