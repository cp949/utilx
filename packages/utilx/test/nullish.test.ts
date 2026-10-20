import { describe, expect, it } from "vitest";
import { firstNotNil, isNil, isNotNil } from "../src/nullish/index.js";

describe("isNil / isNotNil", () => {
  it.each([[null], [undefined]])("%s는 nil이다", (value) => {
    expect(isNil(value)).toBe(true);
    expect(isNotNil(value)).toBe(false);
  });

  it.each([[0], [""], [false], [Number.NaN], [[]], [{}]])(
    "%j는 nil이 아니다",
    (value) => {
      expect(isNil(value)).toBe(false);
      expect(isNotNil(value)).toBe(true);
    },
  );

  it("filter(isNotNil)은 null과 undefined를 걸러내고 타입을 좁힌다", () => {
    const values: (string | null | undefined)[] = ["a", null, "b", undefined];

    const names: string[] = values.filter(isNotNil);

    expect(names).toEqual(["a", "b"]);
  });

  it("isNil의 false 분기에서 타입이 NonNullable로 좁혀진다", () => {
    const value = "x" as string | null | undefined;

    if (!isNil(value)) {
      const text: string = value;
      expect(text).toBe("x");
    }
  });
});

describe("firstNotNil", () => {
  it("null과 undefined가 아닌 첫 값을 돌려준다", () => {
    expect(firstNotNil(null, undefined, "hello", "world")).toBe("hello");
  });

  it("0, 빈 문자열, false, NaN은 nil이 아니므로 돌려준다", () => {
    expect(firstNotNil(undefined, null, 0, 1)).toBe(0);
    expect(firstNotNil(null, "", "a")).toBe("");
    expect(firstNotNil(null, false, true)).toBe(false);
    expect(firstNotNil(null, NaN, 1)).toBeNaN();
  });

  it("모두 nil이면 undefined다", () => {
    expect(firstNotNil(null, undefined, null)).toBeUndefined();
  });

  it("인자가 없으면 undefined다", () => {
    expect(firstNotNil()).toBeUndefined();
  });

  it("값 하나만 받아도 동작한다", () => {
    expect(firstNotNil("test")).toBe("test");
    expect(firstNotNil(null)).toBeUndefined();
  });

  it("반환 타입에서 null과 undefined를 제외한다", () => {
    const value: string | undefined = firstNotNil<string | null | undefined>(
      null,
      "a",
    );
    expect(value).toBe("a");
  });
});
