/**
 * 브라우저 검증 결과 리포트.
 *
 * Playwright reporter(`e2e/report-reporter.mjs`)가 시나리오 결과를 모아 `buildReport`로 리포트를 만들고,
 * `validateReport`가 실행 조건(브라우저 버전, OS, origin, 권한) 누락을 실패로 바꾼다.
 */

/** 리포트 형식 버전. 필드를 바꾸면 올린다. */
export const REPORT_SCHEMA_VERSION = 1;

/**
 * Playwright project별 증거 종류.
 * 최신 Chromium과 Chrome 83은 Chrome 75 하한의 직접 실행 결과가 아니다. 두 project 모두 75를 실행하지 않는다.
 */
export const BROWSER_PROJECTS = {
  "chromium-latest": {
    evidence: "latest",
    note: "Playwright가 관리하는 최신 Chromium 실행 결과다. Chrome 75 하한의 증거가 아니다.",
  },
  chrome83: {
    evidence: "floor-proxy",
    note: "하한에 가장 가까운 실행 증거다. Playwright가 Chrome 82 이상을 요구해 Chrome 75는 실행하지 못한다. 이 결과를 Chrome 75 통과로 해석하지 않는다.",
  },
};

/** 시나리오 상태. Playwright 결과 상태를 세 값으로 줄인다. */
const STATUS_BY_PLAYWRIGHT = {
  passed: "passed",
  skipped: "skipped",
};

/**
 * annotation 목록에서 type이 같은 마지막 값을 찾는다.
 *
 * @param {{ type: string, description?: string }[]} annotations
 * @param {string} type
 */
function annotationValue(annotations, type) {
  return annotations.findLast((item) => item.type === type)?.description;
}

/**
 * OS 정보를 리포트 형식으로 만든다. `/etc/os-release`의 `PRETTY_NAME`이 있으면 `distro`에 담는다.
 *
 * @param {{ platform: string, release: string, arch: string, osReleaseText?: string }} input
 */
export function describeOs({ platform, release, arch, osReleaseText }) {
  const pretty = osReleaseText?.match(/^PRETTY_NAME="?([^"\n]*)"?$/m)?.[1];
  return { platform, release, arch, ...(pretty ? { distro: pretty } : {}) };
}

/**
 * 시나리오 결과로 리포트를 만든다.
 *
 * @param {{
 *   project: string,
 *   generatedAt: string,
 *   os: ReturnType<typeof describeOs>,
 *   tests: {
 *     title: string,
 *     file: string,
 *     status: string,
 *     durationMs: number,
 *     annotations: { type: string, description?: string }[],
 *   }[],
 * }} input
 */
export function buildReport({ project, generatedAt, os, tests }) {
  const scenarios = tests.map((test) => ({
    title: test.title,
    file: test.file,
    status: STATUS_BY_PLAYWRIGHT[test.status] ?? "failed",
    durationMs: test.durationMs,
    origin: annotationValue(test.annotations, "origin") ?? "",
    permissions: annotationValue(test.annotations, "permissions") ?? "",
    browserVersion: annotationValue(test.annotations, "browserVersion") ?? "",
  }));

  const versions = [...new Set(scenarios.map((s) => s.browserVersion))].filter(
    (version) => version !== "",
  );
  const known = BROWSER_PROJECTS[project];

  return {
    schemaVersion: REPORT_SCHEMA_VERSION,
    project,
    generatedAt,
    evidence: {
      kind: known?.evidence ?? "unknown",
      chrome75Executed: false,
      note: known?.note ?? "",
    },
    os,
    browser: { name: "chromium", version: versions.join(",") },
    summary: {
      total: scenarios.length,
      passed: scenarios.filter((s) => s.status === "passed").length,
      failed: scenarios.filter((s) => s.status === "failed").length,
      skipped: scenarios.filter((s) => s.status === "skipped").length,
    },
    scenarios: scenarios.map(({ browserVersion: _version, ...rest }) => rest),
  };
}

/**
 * 리포트의 필수 기록을 검사한다. 문제가 없으면 빈 배열이다.
 * 시나리오 실패는 여기서 다루지 않는다. 실행 조건 기록이 비어 있는 경우만 찾는다.
 *
 * @param {ReturnType<typeof buildReport>} report
 * @returns {string[]}
 */
export function validateReport(report) {
  const problems = [];
  if (!(report.project in BROWSER_PROJECTS)) {
    problems.push(`알 수 없는 project: ${report.project}`);
  }
  if (report.summary.total === 0) {
    problems.push("실행된 시나리오가 없다");
  }
  if (report.browser.version === "") {
    problems.push("브라우저 버전이 기록되지 않았다");
  } else if (report.browser.version.includes(",")) {
    problems.push(`브라우저 버전이 둘 이상이다: ${report.browser.version}`);
  }
  if (!report.os.platform || !report.os.release) {
    problems.push("OS 정보가 기록되지 않았다");
  }
  for (const scenario of report.scenarios) {
    if (scenario.status === "skipped") continue;
    if (scenario.origin === "") {
      problems.push(`origin이 기록되지 않았다: ${scenario.title}`);
    }
    if (scenario.permissions === "") {
      problems.push(`권한 조건이 기록되지 않았다: ${scenario.title}`);
    }
  }
  return problems;
}
