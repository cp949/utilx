import { describe, expect, it } from "vitest";
import {
  byteCountInUnit,
  formatByteCount,
  formatByteCountToParts,
} from "../src/bytes/index.js";

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

describe("formatByteCount: fractionDigits", () => {
  it("수를 주면 최대 소수 자릿수이고 끝의 0은 지운다", () => {
    expect(formatByteCount(1234567, { fractionDigits: 2 })).toBe("1.18 MB");
    expect(formatByteCount(1536, { fractionDigits: 2 })).toBe("1.5 KB");
    expect(formatByteCount(1024, { fractionDigits: 2 })).toBe("1 KB");
  });

  it("10 이상에도 적용한다", () => {
    expect(formatByteCount(150 * 1024 + 700, { fractionDigits: 1 })).toBe(
      "150.7 KB",
    );
  });

  it("0이면 정수로 표기한다", () => {
    expect(formatByteCount(1536, { fractionDigits: 0 })).toBe("2 KB");
  });

  it("{ min, max }는 최소 자릿수까지 0으로 채운다", () => {
    expect(formatByteCount(1536, { fractionDigits: { min: 2, max: 2 } })).toBe(
      "1.50 KB",
    );
    expect(formatByteCount(1024, { fractionDigits: { min: 1, max: 3 } })).toBe(
      "1.0 KB",
    );
    expect(
      formatByteCount(1234567, { fractionDigits: { min: 1, max: 3 } }),
    ).toBe("1.177 MB");
  });

  it("첫 단위(바이트)는 항상 정수다", () => {
    expect(formatByteCount(512, { fractionDigits: { min: 2, max: 2 } })).toBe(
      "512 bytes",
    );
  });

  it("반올림 결과가 base에 닿으면 다음 단위로 올린다", () => {
    expect(formatByteCount(1024 * 1024 - 1, { fractionDigits: 2 })).toBe(
      "1 MB",
    );
  });

  it("옵션이 없으면 기존 규칙과 같다", () => {
    for (const size of [0, 1, 999, 1536, 10 * 1024, 123456789, 1024 ** 5]) {
      expect(formatByteCount(size, {})).toBe(formatByteCount(size));
    }
  });

  it("올바르지 않은 값은 RangeError다", () => {
    expect(() => formatByteCount(1, { fractionDigits: -1 })).toThrow(
      RangeError,
    );
    expect(() => formatByteCount(1, { fractionDigits: 1.5 })).toThrow(
      RangeError,
    );
    expect(() => formatByteCount(1, { fractionDigits: 21 })).toThrow(
      RangeError,
    );
    expect(() => formatByteCount(1, { fractionDigits: Number.NaN })).toThrow(
      RangeError,
    );
    expect(() =>
      formatByteCount(1, { fractionDigits: { min: 3, max: 2 } }),
    ).toThrow(RangeError);
  });
});

describe("formatByteCount: unit", () => {
  it("단위를 고정하고 환산한다", () => {
    expect(formatByteCount(3 * 1024 ** 3, { unit: "MB" })).toBe("3072 MB");
    expect(formatByteCount(512, { unit: "KB" })).toBe("0.5 KB");
    expect(formatByteCount(5 * 1024 ** 2, { unit: "bytes" })).toBe(
      "5242880 bytes",
    );
  });

  it("반올림 결과가 base에 닿아도 단위를 올리지 않는다", () => {
    expect(formatByteCount(1024 * 1024 - 1, { unit: "KB" })).toBe("1024 KB");
  });

  it("고정한 단위와 소수 자릿수를 함께 쓴다", () => {
    expect(
      formatByteCount(1536 * 1024 ** 2, { unit: "GB", fractionDigits: 2 }),
    ).toBe("1.5 GB");
  });

  it("바이트로 고정하면 1바이트만 단수형이다", () => {
    expect(formatByteCount(1, { unit: "bytes" })).toBe("1 byte");
    expect(formatByteCount(1, { unit: "KB" })).toBe("0 KB");
  });

  it("음수는 고정한 단위로 환산한다", () => {
    expect(formatByteCount(-2048, { unit: "KB" })).toBe("-2 KB");
    expect(formatByteCount(-1, { unit: "KB" })).toBe("0 KB");
  });

  it("사용자 지정 units 안의 라벨로 고정한다", () => {
    const units = ["바이트", "킬로바이트"];
    expect(formatByteCount(2048, { units, unit: "킬로바이트" })).toBe(
      "2 킬로바이트",
    );
  });

  it("units에 없는 단위는 RangeError다", () => {
    expect(() => formatByteCount(1, { unit: "KiB" })).toThrow(RangeError);
    expect(() => formatByteCount(1, { units: ["B", "K"], unit: "KB" })).toThrow(
      RangeError,
    );
  });
});

describe("formatByteCountToParts", () => {
  it("수와 단위를 나눠 돌려준다", () => {
    expect(formatByteCountToParts(1536)).toEqual({ value: 1.5, unit: "KB" });
    expect(formatByteCountToParts(0)).toEqual({ value: 0, unit: "bytes" });
    expect(formatByteCountToParts(1)).toEqual({ value: 1, unit: "byte" });
  });

  it("formatByteCount와 같은 규칙으로 계산한다", () => {
    const sizes = [0, 1, 2, 1023, 1536, 10 * 1024, 1024 ** 2 - 1, 1024 ** 9];
    for (const size of sizes) {
      const { value, unit } = formatByteCountToParts(size);
      expect(`${String(value)} ${unit}`).toBe(formatByteCount(size));
    }
  });

  it("옵션을 formatByteCount와 똑같이 받는다", () => {
    expect(formatByteCountToParts(5 * 1024 ** 3, { unit: "MB" })).toEqual({
      value: 5120,
      unit: "MB",
    });
    expect(formatByteCountToParts(1234567, { fractionDigits: 2 })).toEqual({
      value: 1.18,
      unit: "MB",
    });
  });

  it("끝의 0을 채우지 않은 수를 돌려준다", () => {
    expect(
      formatByteCountToParts(1536, { fractionDigits: { min: 2, max: 2 } }),
    ).toEqual({ value: 1.5, unit: "KB" });
  });

  it("음수는 바이트 단위 그대로다", () => {
    expect(formatByteCountToParts(-4096)).toEqual({
      value: -4096,
      unit: "bytes",
    });
  });

  it("잘못된 입력은 RangeError다", () => {
    expect(() => formatByteCountToParts(Number.NaN)).toThrow(RangeError);
    expect(() => formatByteCountToParts(1, { unit: "x" })).toThrow(RangeError);
  });
});

describe("byteCountInUnit", () => {
  it("지정한 단위로 환산한 수를 돌려준다", () => {
    expect(byteCountInUnit(3 * 1024 ** 3, "GB")).toBe(3);
    expect(byteCountInUnit(2048, "KB")).toBe(2);
    expect(byteCountInUnit(5, "bytes")).toBe(5);
  });

  it("기본 반올림은 정수다", () => {
    expect(byteCountInUnit(1.5 * 1024 ** 3, "GB")).toBe(2);
    expect(byteCountInUnit(1.4 * 1024 ** 3, "GB")).toBe(1);
  });

  it("fractionDigits자리까지 반올림한다", () => {
    expect(byteCountInUnit(1536 * 1024 ** 2, "GB", { fractionDigits: 1 })).toBe(
      1.5,
    );
    expect(byteCountInUnit(1234567890, "GB", { fractionDigits: 2 })).toBe(1.15);
  });

  it("base 1000과 사용자 지정 units를 쓴다", () => {
    expect(byteCountInUnit(1500, "KB", { base: 1000 })).toBe(2);
    expect(byteCountInUnit(3000, "K", { base: 1000, units: ["B", "K"] })).toBe(
      3,
    );
  });

  it("단위를 올리거나 내리지 않는다", () => {
    expect(byteCountInUnit(1, "GB", { fractionDigits: 3 })).toBe(0);
    expect(byteCountInUnit(2 * 1024 ** 3, "KB")).toBe(2 * 1024 ** 2);
  });

  it("0과 음수를 다룬다", () => {
    expect(byteCountInUnit(0, "GB")).toBe(0);
    expect(byteCountInUnit(-2048, "KB")).toBe(-2);
    expect(Object.is(byteCountInUnit(-1, "GB"), 0)).toBe(true);
  });

  it("합산에 쓸 수 있는 수를 돌려준다", () => {
    const sum =
      byteCountInUnit(1.5 * 1024 ** 3, "GB", { fractionDigits: 1 }) +
      byteCountInUnit(0.25 * 1024 ** 3, "GB", { fractionDigits: 1 });
    expect(sum).toBe(1.5 + 0.3);
  });

  it("올바르지 않은 입력은 RangeError다", () => {
    expect(() => byteCountInUnit(Number.NaN, "GB")).toThrow(RangeError);
    expect(() => byteCountInUnit(1, "GiB")).toThrow(RangeError);
    expect(() => byteCountInUnit(1, "GB", { fractionDigits: -1 })).toThrow(
      RangeError,
    );
    expect(() =>
      byteCountInUnit(1, "GB", { base: 512 as unknown as 1000 }),
    ).toThrow(RangeError);
    expect(() => byteCountInUnit(1, "GB", { units: [] })).toThrow(RangeError);
  });
});
