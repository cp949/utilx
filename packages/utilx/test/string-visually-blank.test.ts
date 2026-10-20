import { describe, expect, it } from "vitest";
import {
  isBlank,
  isNotVisuallyBlank,
  isVisuallyBlank,
} from "../src/string/index.js";

describe("isVisuallyBlank / isNotVisuallyBlank", () => {
  it.each([
    ["빈 문자열", ""],
    ["공백", "  "],
    ["탭과 개행", "\t\n"],
    ["NBSP", "\u00a0"],
    ["전각 공백", "\u3000"],
    ["얇은 공백 포함", "     "],
    ["줄 구분자", "\u2028"],
    ["NEL", "\u0085"],
    ["제로 너비 공백", "\u200b"],
    ["제로 너비 비접합자와 접합자", "\u200c\u200d"],
    ["워드 조이너", "\u2060"],
    ["BOM", "\ufeff"],
    ["소프트 하이픈", "\u00ad"],
    ["방향 표시", "\u200e\u200f"],
    ["한글 채움 문자", "\u3164"],
    ["한글 초성·중성 채움 문자", "\u115f\u1160"],
    ["반각 한글 채움 문자", "\uffa0"],
    ["변형 선택자", "\ufe0f"],
    ["점자 빈칸", "\u2800"],
    ["보이지 않는 문자 혼합", " \u200b\u3164\t\u2800"],
    ["null", null],
    ["undefined", undefined],
  ])("%s는 blank다", (_name, value) => {
    expect(isVisuallyBlank(value)).toBe(true);
    expect(isNotVisuallyBlank(value)).toBe(false);
  });

  it.each([
    ["영문", "a"],
    ["숫자 0", "0"],
    ["한글", "가"],
    ["이모지", "😀"],
    ["앞뒤 공백이 있는 글자", " a "],
    ["보이지 않는 문자 사이의 글자", "\u200ba\u200b"],
    ["마침표", "."],
    ["널 문자", "\u0000"],
    ["점자 문자", "⠁"],
  ])("%s는 blank가 아니다", (_name, value) => {
    expect(isVisuallyBlank(value)).toBe(false);
    expect(isNotVisuallyBlank(value)).toBe(true);
  });

  it("isBlank가 false인 보이지 않는 문자도 blank로 본다", () => {
    expect(isBlank("\u200b")).toBe(false);
    expect(isVisuallyBlank("\u200b")).toBe(true);
  });

  it("isBlank가 true인 값은 모두 blank다", () => {
    for (const value of ["", " ", "\u3000", "\ufeff", null, undefined]) {
      expect(isBlank(value)).toBe(true);
      expect(isVisuallyBlank(value)).toBe(true);
    }
  });
});
