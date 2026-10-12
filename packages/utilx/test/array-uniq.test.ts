import { describe, expect, it } from "vitest";
import { uniq, uniqBy } from "../src/array/index.js";

describe("uniq", () => {
  it("중복을 빼고 처음 나온 항목만 남긴다", () => {
    expect(uniq([1, 2, 2, 3, 1], { inplace: false })).toEqual([1, 2, 3]);
  });

  it("순서를 유지한다", () => {
    expect(uniq(["b", "a", "b", "c", "a"], { inplace: false })).toEqual([
      "b",
      "a",
      "c",
    ]);
  });

  it("NaN은 NaN과 같은 값으로 본다", () => {
    expect(uniq([Number.NaN, Number.NaN, 1], { inplace: false })).toEqual([
      Number.NaN,
      1,
    ]);
  });

  it("빈 배열은 빈 배열이다", () => {
    expect(uniq([], { inplace: false })).toEqual([]);
  });

  it("중복이 없어도 inplace가 false이면 새 배열을 돌려준다", () => {
    const arr = [1, 2];
    const result = uniq(arr, { inplace: false });
    expect(result).toEqual([1, 2]);
    expect(result).not.toBe(arr);
  });

  it("inplace가 false이면 원본을 바꾸지 않는다", () => {
    const arr: readonly number[] = Object.freeze([1, 1]);
    expect(uniq(arr, { inplace: false })).toEqual([1]);
    expect(arr).toEqual([1, 1]);
  });

  it("inplace가 true이면 전달한 배열을 수정하고 같은 배열을 돌려준다", () => {
    const arr = [1, 2, 2, 3, 1];
    expect(uniq(arr, { inplace: true })).toBe(arr);
    expect(arr).toEqual([1, 2, 3]);
    expect(arr.length).toBe(3);
  });

  it("readonly 배열은 inplace: true로 받지 않는다", () => {
    // 컴파일 오류가 나야 하는 호출이다. 런타임에는 실행하지 않는다.
    const typeChecks = (frozen: readonly number[]) => {
      // @ts-expect-error readonly 배열은 직접 수정할 수 없다
      uniq(frozen, { inplace: true });
    };
    expect(typeof typeChecks).toBe("function");
  });
});

describe("uniqBy", () => {
  const users = [
    { id: 1, name: "a" },
    { id: 2, name: "b" },
    { id: 1, name: "c" },
  ];

  it("속성 이름으로 키를 정한다", () => {
    expect(uniqBy(users, "id", { inplace: false })).toEqual([
      { id: 1, name: "a" },
      { id: 2, name: "b" },
    ]);
  });

  it("함수로 키를 정한다", () => {
    expect(
      uniqBy(["a", "B", "A", "b"], (s) => s.toLowerCase(), { inplace: false }),
    ).toEqual(["a", "B"]);
  });

  it("키가 같은 항목 중 처음 나온 것을 남긴다", () => {
    expect(uniqBy(users, "id", { inplace: false })[0]).toBe(users[0]);
  });

  it("함수에는 항목만 넘긴다", () => {
    const calls: unknown[][] = [];
    uniqBy(
      [1, 2],
      (...args: unknown[]) => {
        calls.push(args);
        return args[0];
      },
      { inplace: false },
    );
    expect(calls).toEqual([[1], [2]]);
  });

  it("키는 SameValueZero로 비교한다", () => {
    expect(
      uniqBy([{ v: Number.NaN }, { v: Number.NaN }], "v", { inplace: false }),
    ).toHaveLength(1);
  });

  it("inplace가 false이면 원본을 바꾸지 않는다", () => {
    const copy = [...users];
    uniqBy(users, "id", { inplace: false });
    expect(users).toEqual(copy);
  });

  it("inplace가 true이면 전달한 배열을 수정하고 같은 배열을 돌려준다", () => {
    const arr = [...users];
    expect(uniqBy(arr, "id", { inplace: true })).toBe(arr);
    expect(arr).toEqual([
      { id: 1, name: "a" },
      { id: 2, name: "b" },
    ]);
  });

  it("readonly 배열은 inplace: true로 받지 않는다", () => {
    // 컴파일 오류가 나야 하는 호출이다. 런타임에는 실행하지 않는다.
    const typeChecks = (frozen: readonly { id: number }[]) => {
      // @ts-expect-error readonly 배열은 직접 수정할 수 없다
      uniqBy(frozen, "id", { inplace: true });
    };
    expect(typeof typeChecks).toBe("function");
  });
});
