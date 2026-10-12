/**
 * 텍스트를 클립보드에 쓴다. 성공하면 `true`, 쓸 수 없거나 거부되면 `false`다. 예외를 던지지 않는다.
 *
 * 다음은 모두 `false`다.
 * - `navigator`나 `navigator.clipboard.writeText`가 없다(서버, 보안 컨텍스트가 아닌 `http://` 페이지 등).
 * - `writeText`가 동기 예외를 던지거나 Promise를 거부한다(권한 거부, 문서 포커스 없음 등).
 *
 * `execCommand('copy')` 폴백은 두지 않는다.
 *
 * `navigator.clipboard`는 보안 컨텍스트(`https://`, `localhost`)에서만 노출된다. 쓰기 허용 조건은 브라우저마다 달라서
 * 버튼 클릭 같은 사용자 제스처 안에서 호출하는 것이 안전하다. 허용 여부는 호출해 보기 전에는 알 수 없다.
 *
 * @example
 * const copied = await copyTextToClipboard(code);
 * if (!copied) showToast('복사하지 못했습니다');
 */
export async function copyTextToClipboard(text: string): Promise<boolean> {
  if (typeof navigator === "undefined") return false;
  try {
    const clipboard = (navigator as { clipboard?: Clipboard }).clipboard;
    if (!clipboard || typeof clipboard.writeText !== "function") return false;
    await clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}
