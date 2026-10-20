import { describe, expect, it } from "vitest";
import { chunk } from "../src/array/index.js";

describe("chunk", () => {
  it("size개씩 자르고 마지막 조각은 짧을 수 있다", () => {
    expect(chunk([1, 2, 3, 4, 5], 2)).toEqual([[1, 2], [3, 4], [5]]);
  });

  it("길이가 size의 배수이면 모든 조각이 size개다", () => {
    expect(chunk([1, 2, 3, 4], 2)).toEqual([
      [1, 2],
      [3, 4],
    ]);
  });

  it("size가 길이보다 크면 조각 하나다", () => {
    expect(chunk([1, 2, 3], 10)).toEqual([[1, 2, 3]]);
  });

  it("size가 1이면 항목마다 조각이다", () => {
    expect(chunk([1, 2, 3], 1)).toEqual([[1], [2], [3]]);
  });

  it("빈 배열은 빈 배열이다", () => {
    expect(chunk([], 3)).toEqual([]);
  });

  it("원본을 바꾸지 않고 조각은 새 배열이다", () => {
    const source = [1, 2, 3];
    const result = chunk(source, 2);
    result[0]?.push(99);
    expect(source).toEqual([1, 2, 3]);
  });

  it("readonly 배열을 받는다", () => {
    const source: readonly string[] = ["a", "b", "c"];
    expect(chunk(source, 2)).toEqual([["a", "b"], ["c"]]);
  });

  it.each([0, -1, 1.5, NaN, Infinity, -Infinity])(
    "size가 %j이면 RangeError다",
    (size) => {
      expect(() => chunk([1, 2, 3], size)).toThrow(RangeError);
    },
  );
});
