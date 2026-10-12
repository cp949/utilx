import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { downloadBlob, downloadText, downloadUrl } from "../src/web/index.js";

interface FakeAnchor {
  href: string;
  download: string;
  style: { display: string };
  click: () => void;
}

const calls: string[] = [];
let anchor: FakeAnchor;
let createObjectURL: ReturnType<typeof vi.fn>;
let revokeObjectURL: ReturnType<typeof vi.fn>;

beforeEach(() => {
  vi.useFakeTimers();
  calls.length = 0;
  anchor = {
    href: "",
    download: "",
    style: { display: "" },
    click: () => {
      calls.push("click");
    },
  };
  createObjectURL = vi.fn(() => "blob:fake");
  revokeObjectURL = vi.fn();
  vi.stubGlobal("document", {
    createElement: vi.fn(() => anchor),
    body: {
      appendChild: vi.fn(() => {
        calls.push("append");
      }),
      removeChild: vi.fn(() => {
        calls.push("remove");
      }),
    },
  });
  vi.stubGlobal("URL", { createObjectURL, revokeObjectURL });
});

afterEach(() => {
  vi.useRealTimers();
});

describe("downloadUrl", () => {
  it("download 속성을 설정한 앵커를 클릭하고 바로 제거한다", () => {
    downloadUrl("/reports/a.pdf", "report.pdf");

    expect(anchor.href).toBe("/reports/a.pdf");
    expect(anchor.download).toBe("report.pdf");
    expect(calls).toEqual(["append", "click", "remove"]);
  });

  it("파일 이름을 생략해도 download 속성을 빈 값으로 설정한다", () => {
    downloadUrl("/reports/a.pdf");

    expect(anchor.download).toBe("");
  });

  it("click이 예외를 던져도 앵커를 제거한다", () => {
    anchor.click = () => {
      throw new Error("click 실패");
    };

    expect(() => {
      downloadUrl("/a");
    }).toThrow("click 실패");
    expect(calls).toEqual(["append", "remove"]);
  });

  it("object URL을 해제하지 않는다", () => {
    downloadUrl("blob:other", "a.txt");
    vi.advanceTimersByTime(60000);

    expect(revokeObjectURL).not.toHaveBeenCalled();
  });
});

describe("downloadBlob", () => {
  it("object URL로 앵커를 만들어 클릭하고 바로 제거한다", () => {
    downloadBlob(new Blob(["x"]), "a.txt");

    expect(anchor.href).toBe("blob:fake");
    expect(anchor.download).toBe("a.txt");
    expect(calls).toEqual(["append", "click", "remove"]);
  });

  it("object URL은 클릭 직후가 아니라 지연 뒤에 해제한다", () => {
    downloadBlob(new Blob(["x"]), "a.txt");

    expect(revokeObjectURL).not.toHaveBeenCalled();
    vi.advanceTimersByTime(40000);
    expect(revokeObjectURL).toHaveBeenCalledExactlyOnceWith("blob:fake");
  });

  it("click이 예외를 던져도 앵커를 제거하고 URL을 해제한다", () => {
    anchor.click = () => {
      throw new Error("click 실패");
    };

    expect(() => {
      downloadBlob(new Blob(["x"]), "a.txt");
    }).toThrow("click 실패");
    expect(calls).toEqual(["append", "remove"]);
    vi.advanceTimersByTime(40000);
    expect(revokeObjectURL).toHaveBeenCalledOnce();
  });
});

describe("downloadText", () => {
  const blobPassedToCreateObjectURL = (): Blob =>
    createObjectURL.mock.calls[0]?.[0] as Blob;

  it("UTF-8 텍스트 Blob으로 내려받는다", async () => {
    downloadText("안녕\nhello", "greeting.txt");

    const blob = blobPassedToCreateObjectURL();
    expect(anchor.download).toBe("greeting.txt");
    expect(blob.type).toBe("text/plain;charset=utf-8");
    expect(await blob.text()).toBe("안녕\nhello");
  });

  it("mimeType을 바꿀 수 있다", () => {
    downloadText("a,b", "data.csv", { mimeType: "text/csv;charset=utf-8" });

    expect(blobPassedToCreateObjectURL().type).toBe("text/csv;charset=utf-8");
  });

  it("downloadBlob처럼 object URL을 지연 뒤에 해제한다", () => {
    downloadText("x", "a.txt");

    expect(revokeObjectURL).not.toHaveBeenCalled();
    vi.advanceTimersByTime(40000);
    expect(revokeObjectURL).toHaveBeenCalledOnce();
  });
});
