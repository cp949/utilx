import { describe, expect, it } from "vitest";
import { isBlank, isNotBlank, trim, trimToUndef } from "../src/string/index.js";

describe("trim", () => {
  it("앞뒤 공백을 제거한다", () => {
    expect(trim("  a b  ")).toBe("a b");
  });

  it("null과 undefined는 빈 문자열이 된다", () => {
    expect(trim(null)).toBe("");
    expect(trim(undefined)).toBe("");
  });

  it("전각 공백, NBSP, BOM도 공백으로 본다", () => {
    expect(trim("　a ")).toBe("a");
    expect(trim("﻿a﻿")).toBe("a");
  });
});

describe("trimToUndef", () => {
  it("공백을 제거한 값을 돌려준다", () => {
    expect(trimToUndef("  a ")).toBe("a");
  });

  it("비었거나 공백뿐이면 undefined다", () => {
    expect(trimToUndef("")).toBeUndefined();
    expect(trimToUndef("   ")).toBeUndefined();
    expect(trimToUndef(null)).toBeUndefined();
    expect(trimToUndef(undefined)).toBeUndefined();
  });
});

describe("isBlank / isNotBlank", () => {
  it.each([[""], ["  "], ["　"], [null], [undefined]])(
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
