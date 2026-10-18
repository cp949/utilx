import { defineConfig, devices } from "@playwright/test";

/** fixture 서버 포트. `scripts/browser-fixture-server.mjs`의 `DEFAULT_PORT`와 같아야 한다. */
const PORT = 4601;

/** 비보안 컨텍스트를 만들기 위한 호스트. 브라우저가 이 이름을 루프백으로 매핑한다. */
const INSECURE_HOST = "insecure.test";

const hostResolverRule = `--host-resolver-rules=MAP ${INSECURE_HOST} 127.0.0.1`;

export default defineConfig({
  testDir: "./e2e/specs",
  // 리포트(test-results/browser-report-*.json)가 Playwright의 출력 정리에 지워지지 않게 하위 디렉터리를 쓴다.
  outputDir: "./test-results/playwright",
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [["list"], ["./e2e/report-reporter.mjs"]],
  use: {
    baseURL: `http://127.0.0.1:${String(PORT)}`,
  },
  webServer: {
    command: "node scripts/browser-fixture-server.mjs",
    url: `http://127.0.0.1:${String(PORT)}/`,
    reuseExistingServer: false,
    timeout: 30_000,
    env: { FIXTURE_PORT: String(PORT) },
  },
  projects: [
    {
      // Playwright가 관리하는 최신 Chromium. 하한 증거가 아니다.
      name: "chromium-latest",
      use: {
        ...devices["Desktop Chrome"],
        launchOptions: { args: [hostResolverRule] },
      },
    },
    {
      // Debian snapshot의 Chrome 83(docker/chrome83). 공식 하한은 Chrome 75지만
      // Playwright가 호출하는 CDP Browser.setDownloadBehavior가 Chrome 82부터 있어
      // 75는 Playwright로 실행할 수 없다. 83 결과를 75 통과로 표기하지 않는다.
      name: "chrome83",
      use: {
        ...devices["Desktop Chrome"],
        launchOptions: {
          executablePath:
            process.env.CHROME83_EXECUTABLE ?? "/usr/bin/chromium",
          args: ["--no-sandbox", hostResolverRule],
        },
      },
    },
  ],
});
