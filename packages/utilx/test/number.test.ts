import { describe, expect, it } from "vitest";
import {
  parseIntegerOrUndefined,
  parseNumberOrUndefined,
} from "../src/number/index.js";

describe("parseNumberOrUndefined", () => {
  it("10진수 표기를 수로 바꾼다", () => {
    expect(parseNumberOrUndefined("12")).toBe(12);
    expect(parseNumberOrUndefined("-12.5")).toBe(-12.5);
    expect(parseNumberOrUndefined("+3")).toBe(3);
    expect(parseNumberOrUndefined(".5")).toBe(0.5);
  });

  it("앞뒤 공백은 무시한다", () => {
    expect(parseNumberOrUndefined("  12.5 ")).toBe(12.5);
    expect(parseNumberOrUndefined("　7　")).toBe(7);
  });

  it("빈 문자열과 공백뿐인 문자열은 undefined다", () => {
    expect(parseNumberOrUndefined("")).toBeUndefined();
    expect(parseNumberOrUndefined("   ")).toBeUndefined();
  });

  it("null과 undefined는 undefined다", () => {
    expect(parseNumberOrUndefined(null)).toBeUndefined();
    expect(parseNumberOrUndefined(undefined)).toBeUndefined();
  });

  it("숫자 뒤에 문자가 붙으면 undefined다", () => {
    expect(parseNumberOrUndefined("12abc")).toBeUndefined();
    expect(parseNumberOrUndefined("1 2")).toBeUndefined();
  });

  it("지수, 16진수, Infinity, NaN, 천 단위 구분자, 전각 숫자는 받지 않는다", () => {
    expect(parseNumberOrUndefined("1e3")).toBeUndefined();
    expect(parseNumberOrUndefined("0x10")).toBeUndefined();
    expect(parseNumberOrUndefined("Infinity")).toBeUndefined();
    expect(parseNumberOrUndefined("NaN")).toBeUndefined();
    expect(parseNumberOrUndefined("1,234")).toBeUndefined();
    expect(parseNumberOrUndefined("１２")).toBeUndefined();
  });

  it("유한한 범위를 넘는 수는 undefined다", () => {
    expect(parseNumberOrUndefined("9".repeat(400))).toBeUndefined();
  });

  it("-0은 0으로 돌려준다", () => {
    expect(Object.is(parseNumberOrUndefined("-0"), 0)).toBe(true);
    expect(Object.is(parseNumberOrUndefined("-0.0"), 0)).toBe(true);
  });
});

describe("parseIntegerOrUndefined", () => {
  it("정수 표기를 수로 바꾼다", () => {
    expect(parseIntegerOrUndefined("42")).toBe(42);
    expect(parseIntegerOrUndefined("-7")).toBe(-7);
    expect(parseIntegerOrUndefined(" 0 ")).toBe(0);
  });

  it("값이 정수이면 1.0도 받는다", () => {
    expect(parseIntegerOrUndefined("1.0")).toBe(1);
  });

  it("소수는 undefined다", () => {
    expect(parseIntegerOrUndefined("1.5")).toBeUndefined();
  });

  it("안전 정수 범위를 넘으면 undefined다", () => {
    expect(parseIntegerOrUndefined("9007199254740991")).toBe(
      Number.MAX_SAFE_INTEGER,
    );
    expect(parseIntegerOrUndefined("9007199254740993")).toBeUndefined();
  });

  it("소수부가 반올림으로 사라지는 입력은 1이 된다", () => {
    expect(parseIntegerOrUndefined("1.0000000000000001")).toBe(1);
  });

  it("숫자 표기가 아니면 undefined다", () => {
    expect(parseIntegerOrUndefined("")).toBeUndefined();
    expect(parseIntegerOrUndefined("12abc")).toBeUndefined();
    expect(parseIntegerOrUndefined("0x10")).toBeUndefined();
    expect(parseIntegerOrUndefined("1e3")).toBeUndefined();
    expect(parseIntegerOrUndefined(null)).toBeUndefined();
  });

  it("min과 max 범위 밖이면 undefined다", () => {
    expect(parseIntegerOrUndefined("0", { min: 1 })).toBeUndefined();
    expect(parseIntegerOrUndefined("1", { min: 1 })).toBe(1);
    expect(parseIntegerOrUndefined("11", { max: 10 })).toBeUndefined();
    expect(parseIntegerOrUndefined("10", { max: 10 })).toBe(10);
    expect(parseIntegerOrUndefined("5", { min: 5, max: 5 })).toBe(5);
  });

  it("min이 max보다 크면 RangeError다", () => {
    expect(() => parseIntegerOrUndefined("1", { min: 2, max: 1 })).toThrow(
      RangeError,
    );
  });

  it("min과 max가 유한한 수가 아니면 RangeError다", () => {
    expect(() => parseIntegerOrUndefined("1", { min: Number.NaN })).toThrow(
      RangeError,
    );
    expect(() =>
      parseIntegerOrUndefined("1", { max: Number.POSITIVE_INFINITY }),
    ).toThrow(RangeError);
  });

  it("입력이 undefined여도 잘못된 옵션은 RangeError다", () => {
    expect(() =>
      parseIntegerOrUndefined(undefined, { min: 2, max: 1 }),
    ).toThrow(RangeError);
  });

  it("-0은 0으로 돌려준다", () => {
    expect(Object.is(parseIntegerOrUndefined("-0"), 0)).toBe(true);
  });
});
