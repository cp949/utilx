import { describe, expect, it } from "vitest";
import { firstNotBlank, firstNotEmpty } from "../src/string/index.js";

describe("firstNotBlank", () => {
  it("공백이 아닌 문자가 있는 첫 문자열을 돌려준다", () => {
    expect(firstNotBlank("", "  ", "hello", "world")).toBe("hello");
  });

  it("null과 undefined를 건너뛴다", () => {
    expect(firstNotBlank(null, undefined, "first", "second")).toBe("first");
  });

  it("앞뒤 공백을 제거하지 않은 원본을 돌려준다", () => {
    expect(firstNotBlank("  ", " a ")).toBe(" a ");
  });

  it("전각 공백, NBSP, BOM만 있는 문자열은 건너뛴다", () => {
    expect(firstNotBlank("\u3000", "\u00a0", "\ufeff", "a")).toBe("a");
  });

  it("모두 공백이거나 비어 있으면 undefined다", () => {
    expect(firstNotBlank("", "  ", null, undefined)).toBeUndefined();
  });

  it("인자가 없으면 undefined다", () => {
    expect(firstNotBlank()).toBeUndefined();
  });

  it("값 하나만 받아도 동작한다", () => {
    expect(firstNotBlank("test")).toBe("test");
    expect(firstNotBlank("  ")).toBeUndefined();
  });
});

describe("firstNotEmpty", () => {
  it("길이가 1 이상인 첫 문자열을 돌려준다", () => {
    expect(firstNotEmpty("", "hello", "world")).toBe("hello");
  });

  it("null과 undefined를 건너뛴다", () => {
    expect(firstNotEmpty(null, undefined, "first")).toBe("first");
  });

  it("공백만 있는 문자열도 비어 있지 않은 것으로 본다", () => {
    expect(firstNotEmpty("", "  ", "hello")).toBe("  ");
  });

  it("모두 비어 있으면 undefined다", () => {
    expect(firstNotEmpty("", null, undefined)).toBeUndefined();
  });

  it("인자가 없으면 undefined다", () => {
    expect(firstNotEmpty()).toBeUndefined();
  });
});
