/**
 * 이 환경에서 `navigator.mediaDevices.getUserMedia`를 쓸 수 있으면 `true`다.
 * `http://` 같은 보안 컨텍스트가 아닌 페이지에서는 `navigator.mediaDevices`가 없어 `false`다.
 * 서버(`navigator` 없음)에서도 `false`다.
 */
export function hasGetUserMedia(): boolean {
  return (
    typeof navigator !== "undefined" &&
    !!navigator.mediaDevices &&
    typeof navigator.mediaDevices.getUserMedia === "function"
  );
}
