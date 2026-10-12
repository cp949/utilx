import { describe, expect, it } from "vitest";
import { isNil, isNotNil } from "../src/nullish/index.js";

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
