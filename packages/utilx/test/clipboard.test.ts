import { describe, expect, it, vi } from "vitest";
import { copyTextToClipboard } from "../src/web/index.js";

describe("copyTextToClipboard", () => {
  it("writeText가 성공하면 true다", async () => {
    const writeText = vi.fn(() => Promise.resolve());
    vi.stubGlobal("navigator", { clipboard: { writeText } });

    await expect(copyTextToClipboard("복사")).resolves.toBe(true);
    expect(writeText).toHaveBeenCalledWith("복사");
  });

  it("빈 문자열도 쓴다", async () => {
    const writeText = vi.fn(() => Promise.resolve());
    vi.stubGlobal("navigator", { clipboard: { writeText } });

    await expect(copyTextToClipboard("")).resolves.toBe(true);
    expect(writeText).toHaveBeenCalledWith("");
  });

  it("writeText가 거부되면 false다", async () => {
    const writeText = vi.fn(() =>
      Promise.reject(new DOMException("거부", "NotAllowedError")),
    );
    vi.stubGlobal("navigator", { clipboard: { writeText } });

    await expect(copyTextToClipboard("x")).resolves.toBe(false);
  });

  it("writeText가 동기 예외를 던지면 false다", async () => {
    const writeText = vi.fn(() => {
      throw new Error("동기 예외");
    });
    vi.stubGlobal("navigator", { clipboard: { writeText } });

    await expect(copyTextToClipboard("x")).resolves.toBe(false);
  });

  it("navigator.clipboard가 없으면 false다", async () => {
    vi.stubGlobal("navigator", {});
    await expect(copyTextToClipboard("x")).resolves.toBe(false);
  });

  it("writeText가 함수가 아니면 false다", async () => {
    vi.stubGlobal("navigator", { clipboard: {} });
    await expect(copyTextToClipboard("x")).resolves.toBe(false);
  });

  it("navigator가 없으면 false다", async () => {
    vi.stubGlobal("navigator", undefined);
    await expect(copyTextToClipboard("x")).resolves.toBe(false);
  });

  it("clipboard getter가 예외를 던져도 false다", async () => {
    vi.stubGlobal("navigator", {
      get clipboard(): never {
        throw new Error("getter");
      },
    });
    await expect(copyTextToClipboard("x")).resolves.toBe(false);
  });
});
