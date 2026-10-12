/**
 * 카메라·마이크(`getUserMedia`) 스트림 유틸이다.
 */

/**
 * 스트림의 트랙을 멈추고 스트림에서 뺀다. 카메라·마이크 장치를 놓아 표시등이 꺼진다.
 * `stream`이 `null`/`undefined`이면 아무것도 하지 않는다.
 *
 * @param kind 지정하면 해당 종류의 트랙만 멈춘다. 생략하면 모든 트랙이다
 *
 * @example
 * stopMediaStream(stream); // 오디오·비디오 모두
 * stopMediaStream(stream, 'video'); // 비디오만
 */
export function stopMediaStream(
  stream: MediaStream | null | undefined,
  kind?: "audio" | "video",
): void {
  if (!stream) return;

  const tracks =
    kind === "audio"
      ? stream.getAudioTracks()
      : kind === "video"
        ? stream.getVideoTracks()
        : stream.getTracks();
  for (const track of tracks) {
    track.stop();
    stream.removeTrack(track);
  }
}

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
