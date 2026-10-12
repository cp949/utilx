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
