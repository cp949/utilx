import { describe, expect, it } from "vitest";
import { limitMaxLength, strlen, truncateMiddle } from "../src/string/index.js";

/** 짝이 맞지 않는 서로게이트가 있는지 검사한다. */
const hasLoneSurrogate = (text: string): boolean =>
  /[\ud800-\udbff](?![\udc00-\udfff])|(?<![\ud800-\udbff])[\udc00-\udfff]/.test(
    text,
  );

describe("strlen", () => {
  it("문자열 길이를 돌려준다", () => {
    expect(strlen("abc")).toBe(3);
    expect(strlen("")).toBe(0);
    expect(strlen("가나")).toBe(2);
  });

  it("null과 undefined는 0이다", () => {
    expect(strlen(null)).toBe(0);
    expect(strlen(undefined)).toBe(0);
  });

  it("UTF-16 코드 유닛 수를 센다", () => {
    expect(strlen("😀")).toBe(2);
  });
});

describe("limitMaxLength", () => {
  it("최대 길이까지만 남긴다", () => {
    expect(limitMaxLength("abcdef", 3)).toBe("abc");
    expect(limitMaxLength("abc", 3)).toBe("abc");
    expect(limitMaxLength("abc", 10)).toBe("abc");
    expect(limitMaxLength("abc", 0)).toBe("");
  });

  it("null과 undefined는 빈 문자열이다", () => {
    expect(limitMaxLength(null, 3)).toBe("");
    expect(limitMaxLength(undefined, 3)).toBe("");
  });

  it("이모지를 반으로 자르지 않는다", () => {
    expect(limitMaxLength("a😀b", 2)).toBe("a");
    expect(limitMaxLength("a😀b", 3)).toBe("a😀");
    expect(hasLoneSurrogate(limitMaxLength("😀😀😀", 3))).toBe(false);
  });

  it.each([-1, 1.5, Number.NaN, Number.POSITIVE_INFINITY])(
    "maxLength %s는 RangeError다",
    (maxLength) => {
      expect(() => limitMaxLength("abc", maxLength)).toThrow(RangeError);
    },
  );
});

describe("truncateMiddle", () => {
  const text = "This is a long string that needs truncating.";

  it("가운데를 생략 표시로 줄인다", () => {
    expect(truncateMiddle(text, { length: 20 })).toBe("This is a...ncating.");
    expect(truncateMiddle(text, { length: 20 })).toHaveLength(20);
  });

  it("omission을 바꿀 수 있다", () => {
    expect(truncateMiddle("abcdefghij", { length: 7, omission: "~" })).toBe(
      "abc~hij",
    );
  });

  it("기본 길이는 30, 기본 생략 표시는 ...이다", () => {
    const long = "a".repeat(50);

    expect(truncateMiddle(long)).toBe(`${"a".repeat(14)}...${"a".repeat(13)}`);
    expect(truncateMiddle(long)).toHaveLength(30);
  });

  it("길이 이하이면 그대로 돌려준다", () => {
    expect(truncateMiddle("abc", { length: 3 })).toBe("abc");
    expect(truncateMiddle("", { length: 5 })).toBe("");
  });

  it("omission이 length 이상이면 omission을 length까지 자른다", () => {
    expect(truncateMiddle("abcdefghij", { length: 2 })).toBe("..");
    expect(truncateMiddle("abcdefghij", { length: 3 })).toBe("...");
    expect(truncateMiddle("abcdefghij", { length: 0 })).toBe("");
  });

  it("이모지를 반으로 자르지 않는다", () => {
    const emojis = "😀".repeat(6);

    for (let length = 4; length <= 11; length += 1) {
      const result = truncateMiddle(emojis, { length });
      expect(hasLoneSurrogate(result)).toBe(false);
      expect(result.length).toBeLessThanOrEqual(length);
    }
  });

  it.each([-1, 1.5, Number.NaN])("length %s는 RangeError다", (length) => {
    expect(() => truncateMiddle("abc", { length })).toThrow(RangeError);
  });
});
