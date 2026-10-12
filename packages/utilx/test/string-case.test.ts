import { describe, expect, it } from "vitest";
import {
  camelCase,
  capitalize,
  kebabToConstant,
  kebabToPascal,
  pascalCase,
  uncapitalize,
} from "../src/string/index.js";

describe("capitalize / uncapitalize", () => {
  it("첫 글자만 바꾸고 나머지는 그대로 둔다", () => {
    expect(capitalize("fooBar")).toBe("FooBar");
    expect(capitalize("FOO")).toBe("FOO");
    expect(uncapitalize("FooBar")).toBe("fooBar");
    expect(uncapitalize("FOO")).toBe("fOO");
  });

  it("빈 문자열은 빈 문자열이다", () => {
    expect(capitalize("")).toBe("");
    expect(uncapitalize("")).toBe("");
  });

  it("서로게이트 쌍으로 된 첫 글자도 바꾼다", () => {
    expect(capitalize("𐐨x")).toBe("𐐀x");
    expect(uncapitalize("𐐀X")).toBe("𐐨X");
  });

  it("대소문자가 없는 글자는 그대로다", () => {
    expect(capitalize("가나")).toBe("가나");
    expect(capitalize("1a")).toBe("1a");
  });
});

describe("pascalCase", () => {
  it("각 단어를 소문자로 만든 뒤 첫 글자를 대문자로 이어 붙인다", () => {
    expect(pascalCase("foo", "bar")).toBe("FooBar");
    expect(pascalCase("API", "key")).toBe("ApiKey");
  });

  it("빈 단어는 무시하고 단어가 없으면 빈 문자열이다", () => {
    expect(pascalCase("foo", "", "bar")).toBe("FooBar");
    expect(pascalCase()).toBe("");
    expect(pascalCase("")).toBe("");
  });
});

describe("camelCase", () => {
  it("첫 단어는 소문자, 나머지는 PascalCase로 잇는다", () => {
    expect(camelCase("foo", "bar", "baz")).toBe("fooBarBaz");
    expect(camelCase("FOO", "bar")).toBe("fooBar");
  });

  it("단어 하나는 소문자가 된다", () => {
    expect(camelCase("FOO")).toBe("foo");
  });

  it("빈 단어는 무시하고 단어가 없으면 빈 문자열이다", () => {
    expect(camelCase("", "foo", "bar")).toBe("fooBar");
    expect(camelCase()).toBe("");
  });
});

describe("kebabToPascal / kebabToConstant", () => {
  it("kebab-case를 PascalCase로 바꾼다", () => {
    expect(kebabToPascal("foo-bar")).toBe("FooBar");
    expect(kebabToPascal("foo")).toBe("Foo");
    expect(kebabToPascal("api-key-v2")).toBe("ApiKeyV2");
  });

  it("kebab-case를 CONSTANT_CASE로 바꾼다", () => {
    expect(kebabToConstant("foo-bar")).toBe("FOO_BAR");
    expect(kebabToConstant("foo")).toBe("FOO");
  });

  it("빈 단어는 무시한다", () => {
    expect(kebabToPascal("-foo--bar-")).toBe("FooBar");
    expect(kebabToConstant("-foo--bar-")).toBe("FOO_BAR");
    expect(kebabToPascal("")).toBe("");
    expect(kebabToConstant("")).toBe("");
  });
});
