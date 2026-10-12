import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { downloadBlob } from "../src/web/index.js";

interface FakeAnchor {
  href: string;
  download: string;
  style: { display: string };
  click: () => void;
}

describe("downloadBlob", () => {
  const calls: string[] = [];
  let anchor: FakeAnchor;
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
    vi.stubGlobal("URL", {
      createObjectURL: vi.fn(() => "blob:fake"),
      revokeObjectURL,
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("앵커를 만들어 클릭하고 바로 제거한다", () => {
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
