import { describe, expect, it } from "vitest";
import {
  isBlank,
  isNotBlank,
  trim,
  trimToUndefined,
} from "../src/string/index.js";

describe("trim", () => {
  it("앞뒤 공백을 제거한다", () => {
    expect(trim("  a b  ")).toBe("a b");
  });

  it("null과 undefined는 빈 문자열이 된다", () => {
    expect(trim(null)).toBe("");
    expect(trim(undefined)).toBe("");
  });

  it("전각 공백, NBSP, BOM도 공백으로 본다", () => {
    expect(trim("\u3000a\u00a0")).toBe("a");
    expect(trim("\uFEFFa\uFEFF")).toBe("a");
  });
});

describe("trimToUndefined", () => {
  it("공백을 제거한 값을 돌려준다", () => {
    expect(trimToUndefined("  a ")).toBe("a");
  });

  it("비었거나 공백뿐이면 undefined다", () => {
    expect(trimToUndefined("")).toBeUndefined();
    expect(trimToUndefined("   ")).toBeUndefined();
    expect(trimToUndefined(null)).toBeUndefined();
    expect(trimToUndefined(undefined)).toBeUndefined();
  });
});

describe("isBlank / isNotBlank", () => {
  it.each([[""], ["  "], ["\u3000"], [null], [undefined]])(
    "%j는 blank다",
    (value) => {
      expect(isBlank(value)).toBe(true);
      expect(isNotBlank(value)).toBe(false);
    },
  );

  it.each([["a"], [" a "], ["0"]])("%j는 blank가 아니다", (value) => {
    expect(isBlank(value)).toBe(false);
    expect(isNotBlank(value)).toBe(true);
  });
});
