import { describe, expect, it } from "vitest";
import { escapeHtml, escapeStringRegexp } from "../src/string/index.js";

describe("escapeHtml", () => {
  it("& < > \" '를 엔티티로 바꾼다", () => {
    expect(escapeHtml(`& < > " '`)).toBe("&amp; &lt; &gt; &quot; &#39;");
  });

  it("태그와 속성 값을 안전한 텍스트로 만든다", () => {
    expect(escapeHtml('<a href="x">Tom & Jerry</a>')).toBe(
      "&lt;a href=&quot;x&quot;&gt;Tom &amp; Jerry&lt;/a&gt;",
    );
  });

  it("이미 엔티티인 &도 다시 바꾼다", () => {
    expect(escapeHtml("&amp;")).toBe("&amp;amp;");
  });

  it("바꿀 문자가 없으면 그대로 돌려준다", () => {
    expect(escapeHtml("")).toBe("");
    expect(escapeHtml("가나다 abc 123")).toBe("가나다 abc 123");
  });

  it("바꾼 결과를 DOM 파서 없이 되돌리면 원문이 된다", () => {
    const text = `<img src="x" onerror='alert(1)'> & more`;
    const restored = escapeHtml(text)
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&amp;/g, "&");
    expect(restored).toBe(text);
  });
});

describe("escapeStringRegexp", () => {
  it("정규식 특수 문자를 이스케이프한다", () => {
    expect(escapeStringRegexp("How much $ for a 🦄?")).toBe(
      "How much \\$ for a 🦄\\?",
    );
    expect(escapeStringRegexp("a.b*c")).toBe("a\\.b\\*c");
  });

  it("하이픈은 \\x2d로 바꾼다", () => {
    expect(escapeStringRegexp("a-b")).toBe("a\\x2db");
  });

  it("특수 문자 전체를 글자 그대로 일치시킨다", () => {
    const special = "|\\{}()[]^$+*?.-";
    expect(new RegExp(escapeStringRegexp(special)).test(special)).toBe(true);
    expect(
      new RegExp(`^${escapeStringRegexp(special)}$`, "u").test(special),
    ).toBe(true);
  });

  it("문자 클래스 안에서도 글자 그대로 일치한다", () => {
    const re = new RegExp(`[${escapeStringRegexp("a-z")}]`, "u");
    expect(re.test("-")).toBe(true);
    expect(re.test("m")).toBe(false);
  });

  it("특수 문자가 없으면 그대로 돌려준다", () => {
    expect(escapeStringRegexp("")).toBe("");
    expect(escapeStringRegexp("abc 가나다")).toBe("abc 가나다");
  });
});
