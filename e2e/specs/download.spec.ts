import { expect, test } from "../fixtures.js";

/**
 * 버튼 id, 기대 파일명, 기대 내용, object URL로 만든 Blob의 기대 MIME.
 * 내용은 바이트 단위로 비교한다. 디스크 파일에는 MIME이 남지 않아 `URL.createObjectURL`에 넘긴 Blob의 `type`을 본다.
 * `mimeType`이 없으면 object URL을 만들지 않는 경로(`downloadUrl`)다.
 */
const CASES: {
  title: string;
  button: string;
  fileName: string;
  body: Buffer;
  mimeType?: string;
}[] = [
  {
    title: "downloadBlob: ASCII 파일명",
    button: "dl-blob-ascii",
    mimeType: "text/plain",
    fileName: "hello.txt",
    body: Buffer.from("hello"),
  },
  {
    title: "downloadBlob: 한글 파일명과 한글 내용",
    button: "dl-blob-korean",
    mimeType: "text/plain;charset=utf-8",
    fileName: "보고서 2026.txt",
    body: Buffer.from("안녕하세요", "utf8"),
  },
  {
    title: "downloadBlob: 0~255 바이너리 내용",
    button: "dl-blob-binary",
    mimeType: "application/octet-stream",
    fileName: "bytes.bin",
    body: Buffer.from(Uint8Array.from({ length: 256 }, (_, index) => index)),
  },
  {
    title: "downloadText: 한글 UTF-8 내용과 mimeType 옵션",
    button: "dl-text-korean",
    mimeType: "text/csv;charset=utf-8",
    fileName: "데이터.csv",
    body: Buffer.from("한글,데이터\n1,2", "utf8"),
  },
  {
    title: "downloadText: 기본 MIME",
    button: "dl-text-default",
    mimeType: "text/plain;charset=utf-8",
    fileName: "plain.txt",
    body: Buffer.from("plain text"),
  },
  {
    title: "downloadUrl: 같은 출처 URL에 파일명 지정",
    button: "dl-url-named",
    fileName: "renamed.txt",
    body: Buffer.from("sample file\n"),
  },
  {
    title: "downloadUrl: 파일명을 생략하면 URL의 마지막 경로를 쓴다",
    button: "dl-url-unnamed",
    fileName: "sample.txt",
    body: Buffer.from("sample file\n"),
  },
];

test.describe("실제 클릭 다운로드", () => {
  for (const { title, button, fileName, body, mimeType } of CASES) {
    test(title, async ({ page, openHarness, captureDownload }) => {
      // Blob의 type만 기록하고 원본을 그대로 호출한다.
      await page.addInitScript(() => {
        const blobTypes: string[] = [];
        const create = URL.createObjectURL.bind(URL);
        URL.createObjectURL = (obj) => {
          if (obj instanceof Blob) blobTypes.push(obj.type);
          return create(obj);
        };
        window.__scratch = { blobTypes };
      });
      await openHarness();

      const saved = await captureDownload(() => page.click(`#${button}`));

      expect(saved.fileName).toBe(fileName);
      expect(saved.body.equals(body)).toBe(true);
      expect(
        await page.evaluate(() => window.__scratch.blobTypes as string[]),
      ).toEqual(mimeType === undefined ? [] : [mimeType]);
    });
  }
});
