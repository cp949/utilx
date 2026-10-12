import { describe, expect, it } from "vitest";
import { formatByteCount } from "../src/bytes/index.js";

describe("formatByteCount", () => {
  it("0과 1은 바이트 단위로 표기한다", () => {
    expect(formatByteCount(0)).toBe("0 bytes");
    expect(formatByteCount(1)).toBe("1 byte");
    expect(formatByteCount(2)).toBe("2 bytes");
    expect(formatByteCount(1023)).toBe("1023 bytes");
  });

  it("10 미만은 소수 첫째 자리까지, .0은 생략한다", () => {
    expect(formatByteCount(1024)).toBe("1 KB");
    expect(formatByteCount(1536)).toBe("1.5 KB");
    expect(formatByteCount(5 * 1024 * 1024)).toBe("5 MB");
  });

  it("10 이상은 정수로 표기한다", () => {
    expect(formatByteCount(10 * 1024)).toBe("10 KB");
    expect(formatByteCount(150 * 1024 + 700)).toBe("151 KB");
  });

  it("반올림 결과가 base에 닿으면 다음 단위로 올린다", () => {
    expect(formatByteCount(1024 * 1024 - 1)).toBe("1 MB");
    expect(formatByteCount(1024 * 1024 * 1024 - 1)).toBe("1 GB");
  });

  it("음수는 단위를 올리지 않는다", () => {
    expect(formatByteCount(-1)).toBe("-1 bytes");
    expect(formatByteCount(-4096)).toBe("-4096 bytes");
  });

  it("가장 큰 단위를 넘으면 그 단위로 계속 표기한다", () => {
    expect(formatByteCount(1024 ** 9)).toBe("1024 YB");
  });

  it("base 1000을 지정할 수 있다", () => {
    expect(formatByteCount(1000, { base: 1000 })).toBe("1 KB");
    expect(formatByteCount(1536, { base: 1000 })).toBe("1.5 KB");
    expect(formatByteCount(999, { base: 1000 })).toBe("999 bytes");
  });

  it("단위 라벨을 바꿀 수 있고 1바이트도 첫 라벨을 쓴다", () => {
    const units = ["바이트", "킬로바이트"];
    expect(formatByteCount(1, { units })).toBe("1 바이트");
    expect(formatByteCount(2048, { units })).toBe("2 킬로바이트");
    expect(formatByteCount(2048 * 1024, { units })).toBe("2048 킬로바이트");
  });

  it("유한하지 않은 값은 RangeError다", () => {
    expect(() => formatByteCount(Number.NaN)).toThrow(RangeError);
    expect(() => formatByteCount(Number.POSITIVE_INFINITY)).toThrow(RangeError);
  });

  it("잘못된 옵션은 RangeError다", () => {
    expect(() => formatByteCount(1, { base: 512 as unknown as 1000 })).toThrow(
      RangeError,
    );
    expect(() => formatByteCount(1, { units: [] })).toThrow(RangeError);
  });
});
