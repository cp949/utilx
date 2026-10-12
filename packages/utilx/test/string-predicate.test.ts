import { describe, expect, it } from "vitest";
import { isDigitString, isNumericString } from "../src/string/index.js";

describe("isNumericString", () => {
  it.each(["0", "12", "-12.5", "+3", "0.5", ".5", "007", "-0"])(
    "%j는 숫자 표기다",
    (text) => {
      expect(isNumericString(text)).toBe(true);
    },
  );

  it.each([
    "",
    " ",
    " 1",
    "1 ",
    "1.",
    "-",
    "+",
    ".",
    "1e3",
    "0x10",
    "Infinity",
    "NaN",
    "1,000",
    "１２",
    "1.2.3",
    "--1",
  ])("%j는 숫자 표기가 아니다", (text) => {
    expect(isNumericString(text)).toBe(false);
  });

  it("null과 undefined는 false다", () => {
    expect(isNumericString(null)).toBe(false);
    expect(isNumericString(undefined)).toBe(false);
  });
});

describe("isDigitString", () => {
  it.each(["0", "0123", "9999"])("%j는 숫자로만 이루어져 있다", (text) => {
    expect(isDigitString(text)).toBe(true);
  });

  it.each(["", " ", "-1", "1.5", "1a", "１２", "1 2"])(
    "%j는 숫자로만 이루어져 있지 않다",
    (text) => {
      expect(isDigitString(text)).toBe(false);
    },
  );

  it("null과 undefined는 false다", () => {
    expect(isDigitString(null)).toBe(false);
    expect(isDigitString(undefined)).toBe(false);
  });
});
