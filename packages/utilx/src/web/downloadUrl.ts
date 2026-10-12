/**
 * URL을 내려받는다. `fileName`을 생략하면 브라우저가 URL이나 응답 헤더로 파일 이름을 정한다.
 *
 * 같은 출처의 URL, `blob:`, `data:` URL에서 동작한다. 다른 출처의 URL은 브라우저가 `download` 속성을 무시해
 * 내려받지 않고 해당 주소로 이동할 수 있다. 이때는 서버가 `Content-Disposition: attachment`를 보내야 한다.
 *
 * @example
 * downloadUrl('/reports/2026.pdf', '2026-report.pdf');
 */
export function downloadUrl(url: string, fileName = ""): void {
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  anchor.style.display = "none";
  document.body.appendChild(anchor);
  try {
    anchor.click();
  } finally {
    document.body.removeChild(anchor);
  }
}
