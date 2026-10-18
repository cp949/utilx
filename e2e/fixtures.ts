import { mkdtemp, readdir, readFile, rm, stat } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test as base, expect, type Page } from "@playwright/test";

/** 클립보드 권한 상태. `none`은 권한을 건드리지 않는다(헤드리스에서는 prompt → 거부). */
export type PermissionMode = "none" | "granted" | "denied";

/** 비보안 컨텍스트 검증용 origin. `playwright.config.ts`의 host-resolver 규칙과 짝이다. */
export const INSECURE_ORIGIN = "http://insecure.test:4601";

/** 내려받은 파일. 브라우저가 디스크에 저장한 실제 파일명과 내용이다. */
export interface DownloadedFile {
  fileName: string;
  body: Buffer;
}

/** 다운로드가 끝났다고 보는 조건을 확인하는 주기(ms). */
const DOWNLOAD_POLL_MS = 50;

/** 다운로드가 끝나기를 기다리는 최대 시간(ms). */
const DOWNLOAD_TIMEOUT_MS = 10_000;

/**
 * 저장 디렉터리에 완성된 파일이 하나 생길 때까지 기다린다.
 * 진행 중 파일(`.crdownload`)이 있거나 크기가 바뀌는 중이면 계속 기다린다.
 */
async function waitForDownloadedFile(dir: string): Promise<DownloadedFile> {
  const deadline = Date.now() + DOWNLOAD_TIMEOUT_MS;
  let previous = "";
  while (Date.now() < deadline) {
    const names = await readdir(dir);
    const done = names.filter((name) => !name.endsWith(".crdownload"));
    if (names.length === 1 && done.length === 1) {
      const fileName = done[0] as string;
      const snapshot = `${fileName}:${String((await stat(join(dir, fileName))).size)}`;
      // 같은 파일명과 크기가 연속 두 번 관찰되면 쓰기가 끝난 것으로 본다.
      if (snapshot === previous) {
        return { fileName, body: await readFile(join(dir, fileName)) };
      }
      previous = snapshot;
    }
    await new Promise((resolve) => setTimeout(resolve, DOWNLOAD_POLL_MS));
  }
  throw new Error(
    `다운로드가 ${String(DOWNLOAD_TIMEOUT_MS)}ms 안에 끝나지 않았다: ${dir}`,
  );
}

interface Fixtures {
  /** 시나리오가 쓰는 권한 조건. `test.use({ permissionMode })`로 정한다. */
  permissionMode: PermissionMode;
  /** harness 페이지를 열고 모듈 로드가 끝날 때까지 기다린다. 인자를 생략하면 baseURL을 연다. */
  openHarness: (origin?: string) => Promise<Page>;
  /**
   * `trigger`가 일으킨 다운로드를 임시 디렉터리에 저장하고 파일명과 내용을 돌려준다.
   * Chrome 83에는 Playwright가 쓰는 `Browser.downloadWillBegin` 이벤트가 없어 `download` 이벤트가 오지 않는다.
   * 두 project가 같은 경로를 쓰도록 CDP `Browser.setDownloadBehavior`로 저장 위치를 정하고 디스크의 결과를 읽는다.
   */
  captureDownload: (trigger: () => Promise<unknown>) => Promise<DownloadedFile>;
  /** 실행 조건(브라우저 버전, origin, 권한)을 테스트 annotation에 기록한다. 리포트가 이 값을 모은다. */
  recordConditions: void;
}

export const test = base.extend<Fixtures>({
  permissionMode: ["none", { option: true }],

  openHarness: async ({ page, baseURL }, use) => {
    await use(async (origin = baseURL) => {
      await page.addInitScript(() => {
        window.__scratch ??= {};
      });
      await page.goto(`${origin ?? ""}/`);
      await page.waitForFunction(() => window.__ready === true);
      return page;
    });
  },

  captureDownload: async ({ browser, page }, use) => {
    // page 인자는 컨텍스트를 먼저 만들기 위한 의존성이다.
    void page;
    const dir = await mkdtemp(join(tmpdir(), "utilx-download-"));
    const session = await browser.newBrowserCDPSession();
    const { browserContextIds } = await session.send(
      "Target.getBrowserContexts",
    );
    await Promise.all(
      browserContextIds.map((browserContextId) =>
        session.send("Browser.setDownloadBehavior", {
          behavior: "allow",
          downloadPath: dir,
          browserContextId,
        }),
      ),
    );

    await use(async (trigger) => {
      await trigger();
      return waitForDownloadedFile(dir);
    });

    await session.detach();
    await rm(dir, { recursive: true, force: true });
  },

  recordConditions: [
    async ({ page, context, browser, permissionMode }, use, testInfo) => {
      const origins = new Set<string>();
      page.on("framenavigated", (frame) => {
        if (frame === page.mainFrame() && frame.url().startsWith("http")) {
          origins.add(new URL(frame.url()).origin);
        }
      });

      if (permissionMode === "granted") {
        await context.grantPermissions(["clipboard-read", "clipboard-write"]);
      } else if (permissionMode === "denied") {
        // 빈 목록은 모든 권한을 명시적으로 거부한 상태가 된다.
        await context.grantPermissions([]);
      }

      await use();

      testInfo.annotations.push(
        { type: "browserVersion", description: browser.version() },
        { type: "origin", description: [...origins].join(",") },
        { type: "permissions", description: permissionMode },
      );
    },
    { auto: true },
  ],
});

export { expect };

declare global {
  interface Window {
    /** harness 모듈이 로드되면 `true`가 된다. */
    __ready?: boolean;
    /** 시나리오가 페이지 안에서 만든 상태를 보관한다. 호출 기록, cleanup 함수 등. */
    __scratch: Record<string, any>;
    /** 배포 dist의 전체 export. */
    __utilx: typeof import("../packages/utilx/src/index.js");
  }
}
