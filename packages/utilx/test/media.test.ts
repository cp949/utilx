import { describe, expect, it, vi } from "vitest";
import { hasGetUserMedia, stopMediaStream } from "../src/web/index.js";

function fakeTrack(kind: "audio" | "video") {
  return { kind, stop: vi.fn() };
}

function fakeStream() {
  const audio = fakeTrack("audio");
  const video = fakeTrack("video");
  const tracks = [audio, video];
  const stream = {
    getTracks: () => [...tracks],
    getAudioTracks: () => tracks.filter((track) => track.kind === "audio"),
    getVideoTracks: () => tracks.filter((track) => track.kind === "video"),
    removeTrack: vi.fn((track: (typeof tracks)[number]) => {
      tracks.splice(tracks.indexOf(track), 1);
    }),
  };
  return { stream: stream as unknown as MediaStream, audio, video, tracks };
}

describe("stopMediaStream", () => {
  it("모든 트랙을 멈추고 스트림에서 뺀다", () => {
    const { stream, audio, video, tracks } = fakeStream();

    stopMediaStream(stream);

    expect(audio.stop).toHaveBeenCalledOnce();
    expect(video.stop).toHaveBeenCalledOnce();
    expect(tracks).toHaveLength(0);
  });

  it("audio만 지정하면 오디오 트랙만 멈춘다", () => {
    const { stream, audio, video, tracks } = fakeStream();

    stopMediaStream(stream, "audio");

    expect(audio.stop).toHaveBeenCalledOnce();
    expect(video.stop).not.toHaveBeenCalled();
    expect(tracks).toEqual([video]);
  });

  it("video만 지정하면 비디오 트랙만 멈춘다", () => {
    const { stream, audio, video, tracks } = fakeStream();

    stopMediaStream(stream, "video");

    expect(video.stop).toHaveBeenCalledOnce();
    expect(audio.stop).not.toHaveBeenCalled();
    expect(tracks).toEqual([audio]);
  });

  it("null과 undefined는 무시한다", () => {
    expect(() => {
      stopMediaStream(null);
      stopMediaStream(undefined);
    }).not.toThrow();
  });
});

describe("hasGetUserMedia", () => {
  it("getUserMedia가 있으면 true다", () => {
    vi.stubGlobal("navigator", {
      mediaDevices: { getUserMedia: () => Promise.resolve() },
    });

    expect(hasGetUserMedia()).toBe(true);
  });

  it("mediaDevices가 없으면 false다(보안 컨텍스트가 아닌 페이지)", () => {
    vi.stubGlobal("navigator", {});

    expect(hasGetUserMedia()).toBe(false);
  });

  it("getUserMedia가 함수가 아니면 false다", () => {
    vi.stubGlobal("navigator", { mediaDevices: {} });

    expect(hasGetUserMedia()).toBe(false);
  });

  it("navigator가 없으면 false다(서버)", () => {
    vi.stubGlobal("navigator", undefined);

    expect(hasGetUserMedia()).toBe(false);
  });
});
