/**
 * Playwright reporter. 시나리오 결과를 모아 `test-results/browser-report-<project>.json`을 쓴다.
 * 실행 조건(브라우저 버전, origin, 권한) 기록이 비어 있으면 실행을 실패로 바꾼다.
 */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { arch, platform, release } from "node:os";
import { dirname, join, relative } from "node:path";
import {
  buildReport,
  describeOs,
  validateReport,
} from "../scripts/browser-report.mjs";

function readOsRelease() {
  try {
    return readFileSync("/etc/os-release", "utf8");
  } catch {
    return undefined;
  }
}

export default class ReportReporter {
  constructor() {
    /** project 이름 → 시나리오 결과. */
    this.byProject = new Map();
    this.rootDir = process.cwd();
  }

  onBegin(config) {
    // config.rootDir은 testDir이라 저장소 루트가 아니다. 설정 파일이 있는 디렉터리를 루트로 쓴다.
    this.rootDir = config.configFile
      ? dirname(config.configFile)
      : process.cwd();
  }

  onTestEnd(test, result) {
    const project = test.parent.project()?.name ?? "";
    const tests = this.byProject.get(project) ?? [];
    tests.push({
      title: test.titlePath().slice(3).join(" › "),
      file: relative(this.rootDir, test.location.file),
      status: result.status,
      durationMs: result.duration,
      annotations: test.annotations,
    });
    this.byProject.set(project, tests);
  }

  onEnd() {
    const outputDir = join(this.rootDir, "test-results");
    mkdirSync(outputDir, { recursive: true });
    let failed = false;

    for (const [project, tests] of this.byProject) {
      const report = buildReport({
        project,
        generatedAt: new Date().toISOString(),
        os: describeOs({
          platform: platform(),
          release: release(),
          arch: arch(),
          osReleaseText: readOsRelease(),
        }),
        tests,
      });
      const file = join(outputDir, `browser-report-${project}.json`);
      writeFileSync(file, `${JSON.stringify(report, null, 2)}\n`);
      console.log(`브라우저 검증 리포트: ${file}`);

      const problems = validateReport(report);
      for (const problem of problems) console.error(`리포트 오류: ${problem}`);
      if (problems.length > 0) failed = true;
    }

    return failed ? { status: "failed" } : undefined;
  }
}
