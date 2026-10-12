import { describe, expect, it } from "vitest";
import { joinUrl } from "../src/url/index.js";

describe("joinUrl", () => {
  it("쿼리를 붙인 단순한 URL을 잇는다", () => {
    expect(joinUrl("http://www.google.com/", "foo/bar", "?test=123")).toBe(
      "http://www.google.com/foo/bar?test=123",
    );
  });

  it("해시뱅(#!)을 유지한다", () => {
    expect(
      joinUrl(...["http://www.google.com", "#!", "foo/bar", "?test=123"]),
    ).toBe("http://www.google.com/#!/foo/bar?test=123");
  });

  it("프로토콜만 있는 첫 조각을 다음 조각과 합친다", () => {
    expect(joinUrl("http:", "www.google.com/", "foo/bar", "?test=123")).toBe(
      "http://www.google.com/foo/bar?test=123",
    );
  });

  it("슬래시가 붙은 프로토콜 조각을 합친다", () => {
    expect(joinUrl("http://", "www.google.com/", "foo/bar", "?test=123")).toBe(
      "http://www.google.com/foo/bar?test=123",
    );
  });

  it("중복 슬래시를 하나로 합친다", () => {
    expect(joinUrl("http:", "www.google.com///", "foo/bar", "?test=123")).toBe(
      "http://www.google.com/foo/bar?test=123",
    );
  });

  it("인코딩된 URL과 루트 조각 사이의 슬래시를 정리한다", () => {
    expect(
      joinUrl(
        "http:",
        "www.google.com///",
        "foo/bar",
        "?url=http%3A//Ftest.com",
      ),
    ).toBe("http://www.google.com/foo/bar?url=http%3A//Ftest.com");
    expect(joinUrl("http://a.com/23d04b3/", "/b/c.html")).toBe(
      "http://a.com/23d04b3/b/c.html",
    );
    expect(joinUrl("/foo", "/", "bar", "?test=123")).toBe("/foo/bar?test=123");
  });

  it("해시를 마지막에 붙인다", () => {
    expect(
      joinUrl("http:", "www.google.com///", "foo/bar", "?test=123", "#faaaaa"),
    ).toBe("http://www.google.com/foo/bar?test=123#faaaaa");
  });

  it("프로토콜 상대 URL을 유지한다", () => {
    expect(joinUrl("//www.google.com", "foo/bar", "?test=123")).toBe(
      "//www.google.com/foo/bar?test=123",
    );
  });

  it("file 프로토콜의 슬래시 두 개를 맞춘다", () => {
    expect(joinUrl("file:/", "android_asset", "foo/bar")).toBe(
      "file://android_asset/foo/bar",
    );
    expect(joinUrl("file:", "/android_asset", "foo/bar")).toBe(
      "file://android_asset/foo/bar",
    );
  });

  it("file 프로토콜의 슬래시 세 개를 유지한다", () => {
    expect(joinUrl("file:", "///android_asset", "foo/bar")).toBe(
      "file:///android_asset/foo/bar",
    );
    expect(joinUrl("file:///", "android_asset", "foo/bar")).toBe(
      "file:///android_asset/foo/bar",
    );
    expect(joinUrl("file:///", "//android_asset", "foo/bar")).toBe(
      "file:///android_asset/foo/bar",
    );
    expect(joinUrl("file:///android_asset", "foo/bar")).toBe(
      "file:///android_asset/foo/bar",
    );
  });

  it("여러 쿼리 조각을 &로 합친다", () => {
    expect(
      joinUrl("http:", "www.google.com///", "foo/bar", "?test=123", "?key=456"),
    ).toBe("http://www.google.com/foo/bar?test=123&key=456");
    expect(
      joinUrl(
        "http:",
        "www.google.com///",
        "foo/bar",
        "?test=123",
        "?boom=value",
        "&key=456",
      ),
    ).toBe("http://www.google.com/foo/bar?test=123&boom=value&key=456");
    expect(
      joinUrl("http://example.org/x", "?a=1", "?b=2", "?c=3", "?d=4"),
    ).toBe("http://example.org/x?a=1&b=2&c=3&d=4");
    expect(
      joinUrl("http:", "www.google.com///", "foo/bar", "&test=123", "&key=456"),
    ).toBe("http://www.google.com/foo/bar?test=123&key=456");
    expect(
      joinUrl("http:", "www.google.com///", "foo/bar", "&test=123", "?key=456"),
    ).toBe("http://www.google.com/foo/bar?test=123&key=456");
  });

  it("비어 있는 쿼리 조각을 버린다", () => {
    expect(joinUrl("http://google.com", "?")).toBe("http://google.com");
    expect(joinUrl("http://google.com", "&")).toBe("http://google.com");
  });

  it("경로 조각 끝의 중복 슬래시를 정리하고 마지막 슬래시는 유지한다", () => {
    expect(joinUrl("http://example.org", "a//", "b//", "A//", "B//")).toBe(
      "http://example.org/a/b/A/B/",
    );
  });

  it("경로의 콜론을 프로토콜로 보지 않는다", () => {
    expect(joinUrl("http://example.org/", ":foo:", "bar")).toBe(
      "http://example.org/:foo:/bar",
    );
  });

  it("루트 슬래시와 상대 경로를 잇는다", () => {
    expect(joinUrl("/", "test")).toBe("/test");
  });

  it("콜론이 있는 첫 조각을 프로토콜로 보지 않는다", () => {
    expect(joinUrl("/users/:userId", "/cars/:carId")).toBe(
      "/users/:userId/cars/:carId",
    );
  });

  it("프로토콜 뒤의 슬래시 개수를 맞춘다", () => {
    expect(joinUrl("http://example.org", "a")).toBe("http://example.org/a");
    expect(joinUrl("http:", "//example.org", "a")).toBe("http://example.org/a");
    expect(joinUrl("http:///example.org", "a")).toBe("http://example.org/a");
    expect(joinUrl("file:///example.org", "a")).toBe("file:///example.org/a");
    expect(joinUrl("file:example.org", "a")).toBe("file://example.org/a");
    expect(joinUrl("file:/", "example.org", "a")).toBe("file://example.org/a");
    expect(joinUrl("file:", "/example.org", "a")).toBe("file://example.org/a");
    expect(joinUrl("file:", "//example.org", "a")).toBe("file://example.org/a");
  });

  it("빈 문자열 조각을 건너뛴다", () => {
    expect(joinUrl("http://foobar.com", "", "test")).toBe(
      "http://foobar.com/test",
    );
    expect(joinUrl("", "http://foobar.com", "", "test")).toBe(
      "http://foobar.com/test",
    );
  });

  it("해시 안의 ?는 쿼리로 바꾸지 않는다", () => {
    expect(joinUrl("http://example.com", "#a?b?c")).toBe(
      "http://example.com#a?b?c",
    );
  });

  it("?로 끝나는 조각과 다음 조각을 이어 붙인다", () => {
    expect(joinUrl("http://example.com", "/foo/bar?", "test=123")).toBe(
      "http://example.com/foo/bar?test=123",
    );
  });

  it("#로 끝나는 조각과 다음 조각을 이어 붙인다", () => {
    expect(joinUrl("http://example.com", "/foo/bar#", "some-hash")).toBe(
      "http://example.com/foo/bar#some-hash",
    );
  });

  it("앞의 빈 문자열을 건너뛰고 선행 슬래시를 유지한다", () => {
    expect(joinUrl("", "/test")).toBe("/test");
  });

  it("IPv6 호스트로 시작하는 첫 조각을 유지한다", () => {
    expect(joinUrl("[2601:195:c381:3560::f42a]/", "/test")).toBe(
      "[2601:195:c381:3560::f42a]/test",
    );
  });

  it("IPv4가 섞인 IPv6 호스트를 유지한다", () => {
    expect(joinUrl("[2601:195:c381:3560::0.0.244.42]", "/test")).toBe(
      "[2601:195:c381:3560::0.0.244.42]/test",
    );
  });

  it("프로토콜 다음의 IPv6 호스트를 합친다", () => {
    expect(joinUrl("https://", "[2601:195:c381:3560::f42a]/", "/test")).toBe(
      "https://[2601:195:c381:3560::f42a]/test",
    );
  });
});

describe("joinUrl: 사용처 경계 사례", () => {
  it("루트 조각을 보존한다", () => {
    expect(joinUrl("/", "a")).toBe("/a");
    expect(joinUrl("/")).toBe("/");
  });

  it("앞의 빈 조각을 건너뛰어도 선행 슬래시를 유지한다", () => {
    expect(joinUrl("", "/a", "b")).toBe("/a/b");
  });

  it("뒤의 빈 조각을 건너뛰어도 끝 슬래시를 유지한다", () => {
    expect(joinUrl("https://example.com", "a/", "")).toBe(
      "https://example.com/a/",
    );
  });

  it("기준 URL과 경로 사이의 슬래시를 하나로 맞춘다", () => {
    expect(joinUrl("https://x.com/", "/a")).toBe("https://x.com/a");
    expect(joinUrl("https://x.com/api/", "/v1?x=1", "&y=2")).toBe(
      "https://x.com/api/v1?x=1&y=2",
    );
  });

  it("조각이 하나면 그대로 돌려준다", () => {
    expect(joinUrl("a")).toBe("a");
    expect(joinUrl("https://x.com/a/")).toBe("https://x.com/a/");
  });
});

describe("joinUrl: 원본에서 고친 결함", () => {
  it("조각이 없거나 모두 비어 있으면 빈 문자열이다", () => {
    expect(joinUrl()).toBe("");
    expect(joinUrl("")).toBe("");
    expect(joinUrl("", "")).toBe("");
  });

  it("해시로 시작하는 첫 조각에 undefined를 붙이지 않는다", () => {
    expect(joinUrl("#h")).toBe("#h");
    expect(joinUrl("#top", "x")).toBe("#top/x");
  });

  it("쿼리로 시작하는 첫 조각의 ?를 유지한다", () => {
    expect(joinUrl("?a=1")).toBe("?a=1");
    expect(joinUrl("?a=1", "&b=2")).toBe("?a=1&b=2");
  });

  it("해시가 둘 이상이어도 첫 해시 뒤를 모두 보존한다", () => {
    expect(joinUrl("a#b#c")).toBe("a#b#c");
    expect(joinUrl("a", "#b", "#c")).toBe("a#b#c");
  });

  it("비어 있는 해시는 버린다", () => {
    expect(joinUrl("http://x.com", "a", "#")).toBe("http://x.com/a");
  });
});

describe("joinUrl: 입력 검증", () => {
  it("문자열이 아닌 조각은 TypeError다", () => {
    expect(() => joinUrl(true as unknown as string)).toThrow(TypeError);
    expect(() => joinUrl("http://x.com/", 1 as unknown as string)).toThrow(
      "URL 조각은 문자열이어야 한다: 1",
    );
    expect(() =>
      joinUrl("http://x.com/", undefined as unknown as string, "test"),
    ).toThrow(TypeError);
    expect(() =>
      joinUrl("http://x.com/", null as unknown as string, "test"),
    ).toThrow("null");
    expect(() =>
      joinUrl("http://x.com/", { foo: 123 } as unknown as string, "test"),
    ).toThrow("[object Object]");
  });

  it("빈 문자열 앞에 문자열이 아닌 조각이 있어도 TypeError다", () => {
    expect(() => joinUrl("", null as unknown as string)).toThrow(TypeError);
  });

  it("전달한 배열을 바꾸지 않는다", () => {
    const input = ["http:", "www.google.com/", "foo/bar", "?test=123"];
    const expected = [...input];

    joinUrl(...input);

    expect(input).toEqual(expected);
  });
});
