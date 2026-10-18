// 배포 dist를 그대로 로드해 버튼에 연결한다. 시나리오가 직접 호출할 수 있게 모듈 전체를 노출한다.
import * as utilx from "/dist/index.js";

/** 바이너리 다운로드 검증용 바이트열. 0~255가 모두 들어 있어 인코딩 변환이 있으면 바로 드러난다. */
const BINARY_BYTES = Uint8Array.from({ length: 256 }, (_, index) => index);

const handlers = {
  "dl-blob-ascii": () =>
    utilx.downloadBlob(
      new Blob(["hello"], { type: "text/plain" }),
      "hello.txt",
    ),
  "dl-blob-korean": () =>
    utilx.downloadBlob(
      new Blob(["안녕하세요"], { type: "text/plain;charset=utf-8" }),
      "보고서 2026.txt",
    ),
  "dl-blob-binary": () =>
    utilx.downloadBlob(
      new Blob([BINARY_BYTES], { type: "application/octet-stream" }),
      "bytes.bin",
    ),
  "dl-text-korean": () =>
    utilx.downloadText("한글,데이터\n1,2", "데이터.csv", {
      mimeType: "text/csv;charset=utf-8",
    }),
  "dl-text-default": () => utilx.downloadText("plain text", "plain.txt"),
  "dl-url-named": () => utilx.downloadUrl("/files/sample.txt", "renamed.txt"),
  "dl-url-unnamed": () => utilx.downloadUrl("/files/sample.txt"),
  copy: async () => {
    const copied = await utilx.copyTextToClipboard("복사한 텍스트");
    document.getElementById("copy-result").textContent = String(copied);
  },
};

for (const [id, handler] of Object.entries(handlers)) {
  document.getElementById(id).addEventListener("click", handler);
}

window.__utilx = utilx;
window.__ready = true;
