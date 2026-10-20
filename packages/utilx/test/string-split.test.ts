import { describe, expect, it } from "vitest";
import {
  splitFirst,
  splitLast,
  substringAfter,
  substringAfterLast,
  substringBefore,
  substringBeforeLast,
} from "../src/string/index.js";

describe("splitFirst", () => {
  it("처음 나오는 구분자로 나눈다", () => {
    expect(splitFirst("foo.tar.gz", ".")).toEqual(["foo", "tar.gz"]);
  });

  it("구분자가 여러 글자여도 구분자 길이만큼 건너뛴다", () => {
    expect(splitFirst("a::b::c", "::")).toEqual(["a", "b::c"]);
  });

  it("구분자가 끝에 있으면 뒤쪽은 빈 문자열이다", () => {
    expect(splitFirst("foo.", ".")).toEqual(["foo", ""]);
  });

  it("구분자가 맨 앞에 있으면 앞쪽은 빈 문자열이다", () => {
    expect(splitFirst(".foo", ".")).toEqual(["", "foo"]);
  });

  it("구분자가 없으면 뒤쪽은 undefined다", () => {
    expect(splitFirst("foo", ".")).toEqual(["foo", undefined]);
    expect(splitFirst("", ".")).toEqual(["", undefined]);
  });

  it("빈 구분자는 없는 것으로 본다", () => {
    expect(splitFirst("abc", "")).toEqual(["abc", undefined]);
  });
});

describe("splitLast", () => {
  it("마지막으로 나오는 구분자로 나눈다", () => {
    expect(splitLast("foo.tar.gz", ".")).toEqual(["foo.tar", "gz"]);
  });

  it("구분자가 여러 글자여도 구분자 길이만큼 건너뛴다", () => {
    expect(splitLast("a::b::c", "::")).toEqual(["a::b", "c"]);
  });

  it("구분자가 끝에 있으면 뒤쪽은 빈 문자열이다", () => {
    expect(splitLast("foo.", ".")).toEqual(["foo", ""]);
  });

  it("구분자가 없으면 뒤쪽은 undefined다", () => {
    expect(splitLast("foo", ".")).toEqual(["foo", undefined]);
    expect(splitLast("", ".")).toEqual(["", undefined]);
  });

  it("빈 구분자는 없는 것으로 본다", () => {
    expect(splitLast("abc", "")).toEqual(["abc", undefined]);
  });
});

describe("substringBefore / substringAfter", () => {
  it("처음 나오는 구분자의 앞뒤를 돌려준다", () => {
    expect(substringBefore("a.b.c", ".")).toBe("a");
    expect(substringAfter("a.b.c", ".")).toBe("b.c");
  });

  it("구분자가 여러 글자여도 구분자 길이만큼 건너뛴다", () => {
    expect(substringBefore("a::b::c", "::")).toBe("a");
    expect(substringAfter("a::b::c", "::")).toBe("b::c");
  });

  it("구분자가 없으면 text 전체를 돌려준다", () => {
    expect(substringBefore("abc", ".")).toBe("abc");
    expect(substringAfter("abc", ".")).toBe("abc");
  });

  it("구분자가 없으면 missingDelimiterValue를 돌려준다", () => {
    expect(substringBefore("abc", ".", "none")).toBe("none");
    expect(substringAfter("abc", ".", "none")).toBe("none");
  });

  it("missingDelimiterValue가 빈 문자열이어도 그 값을 돌려준다", () => {
    expect(substringBefore("abc", ".", "")).toBe("");
    expect(substringAfter("abc", ".", "")).toBe("");
  });

  it("missingDelimiterValue에 undefined를 넘기면 생략한 것과 같다", () => {
    expect(substringBefore("abc", ".", undefined)).toBe("abc");
    expect(substringAfter("abc", ".", undefined)).toBe("abc");
  });

  it("구분자가 맨 끝이나 맨 앞에 있으면 빈 문자열이 나온다", () => {
    expect(substringAfter("abc.", ".")).toBe("");
    expect(substringBefore(".abc", ".")).toBe("");
  });

  it("빈 구분자와 빈 text는 구분자가 없는 것으로 본다", () => {
    expect(substringBefore("abc", "", "none")).toBe("none");
    expect(substringAfter("abc", "", "none")).toBe("none");
    expect(substringBefore("", ".", "none")).toBe("none");
    expect(substringAfter("", ".", "none")).toBe("none");
  });
});

describe("substringBeforeLast / substringAfterLast", () => {
  it("마지막으로 나오는 구분자의 앞뒤를 돌려준다", () => {
    expect(substringBeforeLast("a.b.c", ".")).toBe("a.b");
    expect(substringAfterLast("a.b.c", ".")).toBe("c");
  });

  it("구분자가 여러 글자여도 구분자 길이만큼 건너뛴다", () => {
    expect(substringBeforeLast("a::b::c", "::")).toBe("a::b");
    expect(substringAfterLast("a::b::c", "::")).toBe("c");
  });

  it("구분자가 없으면 text 전체 또는 missingDelimiterValue를 돌려준다", () => {
    expect(substringBeforeLast("abc", ".")).toBe("abc");
    expect(substringAfterLast("abc", ".")).toBe("abc");
    expect(substringBeforeLast("abc", ".", "")).toBe("");
    expect(substringAfterLast("abc", ".", "")).toBe("");
    expect(substringBeforeLast("abc", ".", "none")).toBe("none");
    expect(substringAfterLast("abc", ".", "none")).toBe("none");
  });

  it("빈 구분자는 구분자가 없는 것으로 본다", () => {
    expect(substringBeforeLast("abc", "", "none")).toBe("none");
    expect(substringAfterLast("abc", "", "none")).toBe("none");
  });
});
