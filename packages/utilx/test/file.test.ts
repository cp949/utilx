import { describe, expect, it } from "vitest";
import { fileBaseName, fileExtension } from "../src/file/index.js";

describe("fileExtension", () => {
  it("마지막 점 뒤를 확장자로 돌려준다", () => {
    expect(fileExtension("a.png")).toBe("png");
    expect(fileExtension("a.tar.gz")).toBe("gz");
  });

  it("lowerCase로 소문자로 바꾼다", () => {
    expect(fileExtension("Photo.JPG")).toBe("JPG");
    expect(fileExtension("Photo.JPG", { lowerCase: true })).toBe("jpg");
  });

  it("withDot으로 점을 붙인다", () => {
    expect(fileExtension("a.png", { withDot: true })).toBe(".png");
    expect(fileExtension("A.PNG", { withDot: true, lowerCase: true })).toBe(
      ".png",
    );
  });

  it("확장자가 없으면 null이다", () => {
    expect(fileExtension("README")).toBeNull();
    expect(fileExtension("")).toBeNull();
    expect(fileExtension(".")).toBeNull();
    expect(fileExtension(".bashrc")).toBeNull();
    expect(fileExtension("file.")).toBeNull();
  });
});

describe("fileBaseName", () => {
  it("확장자를 뺀 이름을 돌려준다", () => {
    expect(fileBaseName("a.png")).toBe("a");
    expect(fileBaseName("a.tar.gz")).toBe("a.tar");
  });

  it("확장자가 없으면 이름을 그대로 돌려준다", () => {
    expect(fileBaseName("README")).toBe("README");
    expect(fileBaseName(".bashrc")).toBe(".bashrc");
    expect(fileBaseName("file.")).toBe("file.");
    expect(fileBaseName("")).toBe("");
  });

  it("fileExtension과 합치면 원래 이름이 된다", () => {
    const name = "report.final.pdf";
    expect(
      `${fileBaseName(name)}${fileExtension(name, { withDot: true })}`,
    ).toBe(name);
  });
});
