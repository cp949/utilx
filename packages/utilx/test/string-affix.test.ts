import { describe, expect, it } from "vitest";
import {
  removePrefix,
  removeSuffix,
  removeSurrounding,
  replaceAll,
} from "../src/string/index.js";

describe("removePrefix", () => {
  it("시작이 prefix이면 한 번만 제거한다", () => {
    expect(removePrefix("--flag", "-")).toBe("-flag");
    expect(removePrefix("foobar", "foo")).toBe("bar");
  });

  it("repeat이면 계속 붙어 있는 동안 제거한다", () => {
    expect(removePrefix("--flag", "-", { repeat: true })).toBe("flag");
    expect(removePrefix("abababc", "ab", { repeat: true })).toBe("c");
  });

  it("prefix가 아니거나 비어 있으면 원본을 돌려준다", () => {
    expect(removePrefix("flag", "-")).toBe("flag");
    expect(removePrefix("flag", "")).toBe("flag");
    expect(removePrefix("flag", "", { repeat: true })).toBe("flag");
    expect(removePrefix("", "-")).toBe("");
  });

  it("문자열 전체가 prefix이면 빈 문자열이 된다", () => {
    expect(removePrefix("--", "-", { repeat: true })).toBe("");
    expect(removePrefix("abc", "abc")).toBe("");
  });
});

describe("removeSuffix", () => {
  it("끝이 suffix이면 한 번만 제거한다", () => {
    expect(removeSuffix("a.json", ".json")).toBe("a");
    expect(removeSuffix("path//", "/")).toBe("path/");
  });

  it("repeat이면 계속 붙어 있는 동안 제거한다", () => {
    expect(removeSuffix("path///", "/", { repeat: true })).toBe("path");
  });

  it("suffix가 아니거나 비어 있으면 원본을 돌려준다", () => {
    expect(removeSuffix("a.json", ".xml")).toBe("a.json");
    expect(removeSuffix("a.json", "")).toBe("a.json");
    expect(removeSuffix("a.json", "", { repeat: true })).toBe("a.json");
  });
});

describe("removeSurrounding", () => {
  it("양쪽이 맞으면 제거한다", () => {
    expect(removeSurrounding('"hi"', '"')).toBe("hi");
    expect(removeSurrounding("[hi]", "[", "]")).toBe("hi");
  });

  it("한쪽만 맞으면 원본을 돌려준다", () => {
    expect(removeSurrounding('"hi', '"')).toBe('"hi');
    expect(removeSurrounding("hi]", "[", "]")).toBe("hi]");
  });

  it("prefix와 suffix가 겹치면 원본을 돌려준다", () => {
    expect(removeSurrounding('"', '"')).toBe('"');
    expect(removeSurrounding("ab", "ab", "ba")).toBe("ab");
  });

  it("빈 prefix나 suffix는 원본을 돌려준다", () => {
    expect(removeSurrounding("hi", "")).toBe("hi");
    expect(removeSurrounding("hi", "h", "")).toBe("hi");
  });

  it("딱 맞는 길이면 빈 문자열이 된다", () => {
    expect(removeSurrounding('""', '"')).toBe("");
  });
});

describe("replaceAll", () => {
  it("모든 일치를 바꾼다", () => {
    expect(replaceAll("a.b.c", ".", "/")).toBe("a/b/c");
    expect(replaceAll("aaaa", "aa", "b")).toBe("bb");
  });

  it("정규식 문자와 치환 특수 패턴을 해석하지 않는다", () => {
    expect(replaceAll("a.b", ".", "$&")).toBe("a$&b");
    expect(replaceAll("1+1+1", "+", "-")).toBe("1-1-1");
  });

  it("일치가 없으면 원본을 돌려준다", () => {
    expect(replaceAll("abc", "x", "y")).toBe("abc");
  });

  it("빈 search는 아무것도 바꾸지 않는다", () => {
    expect(replaceAll("abc", "", "-")).toBe("abc");
  });

  it("빈 replacement로 제거할 수 있다", () => {
    expect(replaceAll("a-b-c", "-", "")).toBe("abc");
  });
});
