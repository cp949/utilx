import { describe, expect, it } from "vitest";
import { blobToFile } from "../src/web/index.js";

describe("blobToFile", () => {
  it("파일 이름과 blob의 타입을 가진 File을 만든다", async () => {
    const blob = new Blob(["hello"], { type: "text/plain" });
    const file = blobToFile(blob, "hello.txt");

    expect(file).toBeInstanceOf(File);
    expect(file.name).toBe("hello.txt");
    expect(file.type).toBe("text/plain");
    expect(file.size).toBe(5);
    expect(await file.text()).toBe("hello");
  });

  it("blob의 타입이 비어 있으면 application/octet-stream이다", () => {
    const file = blobToFile(new Blob(["x"]), "x.bin");
    expect(file.type).toBe("application/octet-stream");
  });

  it("options.type이 blob의 타입보다 우선한다", () => {
    const blob = new Blob(["x"], { type: "text/plain" });
    expect(blobToFile(blob, "x.zip", { type: "application/zip" }).type).toBe(
      "application/zip",
    );
  });

  it("options.type이 빈 문자열이면 blob의 타입을 쓴다", () => {
    const blob = new Blob(["x"], { type: "image/png" });
    expect(blobToFile(blob, "x.png", { type: "" }).type).toBe("image/png");
  });

  it("File을 넘기면 이름만 바꾼 새 File을 만든다", async () => {
    const original = new File(["abc"], "old.txt", { type: "text/plain" });
    const renamed = blobToFile(original, "new.txt");

    expect(renamed).not.toBe(original);
    expect(renamed.name).toBe("new.txt");
    expect(renamed.type).toBe("text/plain");
    expect(await renamed.text()).toBe("abc");
  });
});
