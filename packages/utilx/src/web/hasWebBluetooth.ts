/**
 * 이 환경에서 Web Bluetooth API(`navigator.bluetooth`)를 쓸 수 있으면 `true`다.
 * `http://` 같은 보안 컨텍스트가 아닌 페이지와 지원하지 않는 브라우저에서는 `false`다. 서버(`navigator` 없음)에서도 `false`다.
 * 권한 승인이나 장치 유무는 확인하지 않는다.
 */
export function hasWebBluetooth(): boolean {
  return typeof navigator !== "undefined" && "bluetooth" in navigator;
}
