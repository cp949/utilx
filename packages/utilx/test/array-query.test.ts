import { describe, expect, expectTypeOf, it } from "vitest";
import {
  firstItem,
  firstItems,
  isEmpty,
  isNotEmpty,
  isValidIndexRange,
  lastItem,
  lastItems,
  lengthOf,
  limitItems,
  zipMap,
} from "../src/array/index.js";

describe("lengthOf", () => {
  it("배열과 length가 있는 값의 길이를 돌려준다", () => {
    expect(lengthOf([1, 2, 3])).toBe(3);
    expect(lengthOf([])).toBe(0);
    expect(lengthOf("가나다")).toBe(3);
  });

  it("null과 undefined는 0이다", () => {
    expect(lengthOf(null)).toBe(0);
    expect(lengthOf(undefined)).toBe(0);
  });
});

describe("isEmpty / isNotEmpty", () => {
  it("빈 배열은 isEmpty가 true이고 isNotEmpty가 false다", () => {
    expect(isEmpty([])).toBe(true);
    expect(isNotEmpty([])).toBe(false);
  });

  it("항목이 있으면 isEmpty가 false이고 isNotEmpty가 true다", () => {
    expect(isEmpty([0])).toBe(false);
    expect(isNotEmpty([0])).toBe(true);
    expect(isEmpty([undefined])).toBe(false);
  });

  it("null과 undefined는 비어 있는 것으로 본다", () => {
    expect(isEmpty(null)).toBe(true);
    expect(isEmpty(undefined)).toBe(true);
    expect(isNotEmpty(null)).toBe(false);
    expect(isNotEmpty(undefined)).toBe(false);
  });

  it("length가 있는 문자열도 받는다", () => {
    expect(isEmpty("")).toBe(true);
    expect(isNotEmpty("a")).toBe(true);
  });
});

describe("firstItem", () => {
  it("첫 번째 항목을 돌려준다", () => {
    expect(firstItem([1, 2, 3])).toBe(1);
  });

  it("빈 배열이면 undefined다", () => {
    expect(firstItem([])).toBeUndefined();
  });
});

describe("firstItems", () => {
  it("앞에서부터 count개를 원래 순서로 돌려준다", () => {
    expect(firstItems([1, 2, 3, 4], 2)).toEqual([1, 2]);
  });

  it("count가 길이보다 크면 모든 항목을 새 배열로 돌려준다", () => {
    const arr = [1, 2];
    const result = firstItems(arr, 5);
    expect(result).toEqual([1, 2]);
    expect(result).not.toBe(arr);
  });

  it("count가 0이면 빈 배열이다", () => {
    expect(firstItems([1, 2], 0)).toEqual([]);
  });

  it("count가 0 이상의 정수가 아니면 RangeError다", () => {
    expect(() => firstItems([1], -1)).toThrow(RangeError);
    expect(() => firstItems([1], 1.5)).toThrow(RangeError);
    expect(() => firstItems([1], Number.NaN)).toThrow(RangeError);
  });
});

describe("lastItem", () => {
  it("마지막 항목을 돌려준다", () => {
    expect(lastItem([1, 2, 3])).toBe(3);
  });

  it("빈 배열이면 undefined다", () => {
    expect(lastItem([])).toBeUndefined();
  });

  it("마지막 항목이 undefined여도 그 값을 돌려준다", () => {
    expect(lastItem([1, undefined])).toBeUndefined();
  });
});

describe("lastItems", () => {
  it("뒤에서부터 count개를 원래 순서로 돌려준다", () => {
    expect(lastItems([1, 2, 3, 4], 2)).toEqual([3, 4]);
  });

  it("count가 길이보다 크면 모든 항목을 새 배열로 돌려준다", () => {
    const arr = [1, 2];
    const result = lastItems(arr, 5);
    expect(result).toEqual([1, 2]);
    expect(result).not.toBe(arr);
  });

  it("count가 0이면 빈 배열이다", () => {
    expect(lastItems([1, 2], 0)).toEqual([]);
  });

  it("빈 배열이면 빈 배열이다", () => {
    expect(lastItems([], 3)).toEqual([]);
  });

  it("count가 0 이상의 정수가 아니면 RangeError다", () => {
    expect(() => lastItems([1], -1)).toThrow(RangeError);
    expect(() => lastItems([1], 1.5)).toThrow(RangeError);
    expect(() => lastItems([1], Number.NaN)).toThrow(RangeError);
  });
});

describe("isValidIndexRange", () => {
  it.each([
    [0, 3],
    [0, 1],
    [2, 3],
    [1, 2],
  ])("[%i, %i)은 유효하다", (start, end) => {
    expect(isValidIndexRange([1, 2, 3], start, end)).toBe(true);
  });

  it.each([
    [-1, 2],
    [0, 4],
    [4, 5],
    [2, 2],
    [2, 1],
    [0.5, 2],
    [0, 2.5],
    [Number.NaN, 2],
  ])("[%s, %s)은 유효하지 않다", (start, end) => {
    expect(isValidIndexRange([1, 2, 3], start, end)).toBe(false);
  });

  it("null과 undefined는 길이 0으로 보므로 유효한 구간이 없다", () => {
    expect(isValidIndexRange(null, 0, 1)).toBe(false);
    expect(isValidIndexRange(undefined, 0, 1)).toBe(false);
  });
});

describe("zipMap", () => {
  it("같은 위치의 항목을 튜플로 묶어 mapper에 넘긴다", () => {
    const result = zipMap(
      [
        [1, 2],
        [10, 20],
        [100, 200],
      ],
      ([a, b, c]) => (a ?? 0) + (b ?? 0) + (c ?? 0),
    );
    expect(result).toEqual([111, 222]);
  });

  it("가장 긴 배열의 길이만큼 만들고 짧은 배열의 빈 자리는 undefined다", () => {
    const result = zipMap([["a", "b", "c"], [1]], (items) => items);
    expect(result).toEqual([
      ["a", 1],
      ["b", undefined],
      ["c", undefined],
    ]);
  });

  it("서로 다른 항목 타입을 튜플로 추론한다", () => {
    const result = zipMap([["a"], [1]] as [string[], number[]], ([s, n]) => {
      expectTypeOf(s).toEqualTypeOf<string | undefined>();
      expectTypeOf(n).toEqualTypeOf<number | undefined>();
      return `${s}${n}`;
    });
    expect(result).toEqual(["a1"]);
  });

  it("mapper가 인자를 받지 않아도 컴파일된다", () => {
    expect(zipMap([[1], [2]], () => "x")).toEqual(["x"]);
  });

  it("배열이 없으면 빈 배열이다", () => {
    expect(zipMap([], () => 1)).toEqual([]);
  });

  it("모든 배열이 비어 있으면 mapper를 호출하지 않는다", () => {
    let calls = 0;
    zipMap([[], []], () => (calls += 1));
    expect(calls).toBe(0);
  });

  it("원본 배열을 바꾸지 않는다", () => {
    const a = [1, 2];
    const b = [3];
    zipMap([a, b], (items) => items);
    expect(a).toEqual([1, 2]);
    expect(b).toEqual([3]);
  });
});

describe("limitItems", () => {
  it("maxCount를 넘으면 뒤쪽을 버린다", () => {
    expect(limitItems([1, 2, 3, 4], 2, { inplace: false })).toEqual([1, 2]);
  });

  it("maxCount를 넘지 않으면 그대로 두되 새 배열을 돌려준다", () => {
    const arr = [1, 2];
    const result = limitItems(arr, 5, { inplace: false });
    expect(result).toEqual([1, 2]);
    expect(result).not.toBe(arr);
  });

  it("maxCount가 0이면 빈 배열이다", () => {
    expect(limitItems([1, 2], 0, { inplace: false })).toEqual([]);
  });

  it("maxCount가 0 이상의 정수가 아니면 RangeError다", () => {
    expect(() => limitItems([1], -1, { inplace: false })).toThrow(RangeError);
    expect(() => limitItems([1], 1.5, { inplace: true })).toThrow(RangeError);
    expect(() => limitItems([1], Number.NaN, { inplace: false })).toThrow(
      RangeError,
    );
  });

  it("inplace가 false이면 원본을 바꾸지 않는다", () => {
    const arr: readonly number[] = Object.freeze([1, 2, 3]);
    expect(limitItems(arr, 1, { inplace: false })).toEqual([1]);
    expect(arr).toEqual([1, 2, 3]);
  });

  it("inplace가 true이면 전달한 배열을 수정하고 같은 배열을 돌려준다", () => {
    const arr = [1, 2, 3];
    expect(limitItems(arr, 1, { inplace: true })).toBe(arr);
    expect(arr).toEqual([1]);
  });

  it("readonly 배열은 inplace: true로 받지 않는다", () => {
    // 컴파일 오류가 나야 하는 호출이다. 런타임에는 실행하지 않는다.
    const typeChecks = (frozen: readonly number[]) => {
      // @ts-expect-error readonly 배열은 직접 수정할 수 없다
      limitItems(frozen, 1, { inplace: true });
    };
    expect(typeof typeChecks).toBe("function");
  });
});
