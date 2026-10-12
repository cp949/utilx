import { describe, expect, it } from "vitest";
import {
  prependUnique,
  rotateLeft,
  rotateRight,
  swapItems,
  swapValues,
} from "../src/array/index.js";

describe("prependUnique", () => {
  it("배열에 없는 값만 앞에 추가하고 items의 순서를 유지한다", () => {
    expect(prependUnique([2, 3], [1, 2, 0], { inplace: false })).toEqual([
      1, 0, 2, 3,
    ]);
  });

  it("items 안의 중복도 한 번만 추가한다", () => {
    expect(prependUnique([3], [1, 1, 2], { inplace: false })).toEqual([
      1, 2, 3,
    ]);
  });

  it("원래 배열의 중복은 손대지 않는다", () => {
    expect(prependUnique([2, 2], [1], { inplace: false })).toEqual([1, 2, 2]);
  });

  it("NaN은 NaN과 같은 값으로 본다", () => {
    expect(
      prependUnique([Number.NaN], [Number.NaN], { inplace: false }),
    ).toEqual([Number.NaN]);
  });

  it("추가할 값이 없으면 같은 내용의 새 배열을 돌려준다", () => {
    const arr = [1];
    const result = prependUnique(arr, [1], { inplace: false });
    expect(result).toEqual([1]);
    expect(result).not.toBe(arr);
  });

  it("inplace가 false이면 원본을 바꾸지 않는다", () => {
    const arr: readonly number[] = Object.freeze([2]);
    expect(prependUnique(arr, [1], { inplace: false })).toEqual([1, 2]);
    expect(arr).toEqual([2]);
  });

  it("inplace가 true이면 전달한 배열을 수정하고 같은 배열을 돌려준다", () => {
    const arr = [2];
    const result = prependUnique(arr, [1], { inplace: true });
    expect(result).toBe(arr);
    expect(arr).toEqual([1, 2]);
  });
});

describe("rotateLeft / rotateRight", () => {
  it("왼쪽으로 돌리면 앞의 항목이 뒤로 간다", () => {
    expect(rotateLeft([1, 2, 3, 4], 1, { inplace: false })).toEqual([
      2, 3, 4, 1,
    ]);
    expect(rotateLeft([1, 2, 3, 4], 3, { inplace: false })).toEqual([
      4, 1, 2, 3,
    ]);
  });

  it("오른쪽으로 돌리면 뒤의 항목이 앞으로 온다", () => {
    expect(rotateRight([1, 2, 3, 4], 1, { inplace: false })).toEqual([
      4, 1, 2, 3,
    ]);
    expect(rotateRight([1, 2, 3, 4], 3, { inplace: false })).toEqual([
      2, 3, 4, 1,
    ]);
  });

  it("count가 길이 이상이면 나머지만큼 돌린다", () => {
    expect(rotateLeft([1, 2, 3], 4, { inplace: false })).toEqual([2, 3, 1]);
    expect(rotateLeft([1, 2, 3], 3, { inplace: false })).toEqual([1, 2, 3]);
    expect(rotateRight([1, 2, 3], 7, { inplace: false })).toEqual([3, 1, 2]);
  });

  it("count가 음수이면 반대 방향으로 돌린다", () => {
    expect(rotateLeft([1, 2, 3, 4], -1, { inplace: false })).toEqual([
      4, 1, 2, 3,
    ]);
    expect(rotateRight([1, 2, 3, 4], -1, { inplace: false })).toEqual([
      2, 3, 4, 1,
    ]);
  });

  it("count가 0이면 그대로다", () => {
    expect(rotateLeft([1, 2, 3], 0, { inplace: false })).toEqual([1, 2, 3]);
    expect(rotateRight([1, 2, 3], 0, { inplace: false })).toEqual([1, 2, 3]);
  });

  it("빈 배열은 undefined를 끼워 넣지 않고 그대로다", () => {
    expect(rotateLeft([], 3, { inplace: false })).toEqual([]);
    expect(rotateRight([], 3, { inplace: false })).toEqual([]);
  });

  it("항목이 하나인 배열은 그대로다", () => {
    expect(rotateLeft([1], 5, { inplace: false })).toEqual([1]);
  });

  it("count가 정수가 아니면 RangeError다", () => {
    expect(() => rotateLeft([1, 2], 1.5, { inplace: false })).toThrow(
      RangeError,
    );
    expect(() => rotateRight([1, 2], Number.NaN, { inplace: false })).toThrow(
      RangeError,
    );
    expect(() => rotateLeft([1, 2], Infinity, { inplace: false })).toThrow(
      RangeError,
    );
  });

  it("inplace가 false이면 원본을 바꾸지 않는다", () => {
    const arr: readonly number[] = Object.freeze([1, 2, 3]);
    expect(rotateLeft(arr, 1, { inplace: false })).toEqual([2, 3, 1]);
    expect(arr).toEqual([1, 2, 3]);
  });

  it("inplace가 true이면 전달한 배열을 수정하고 같은 배열을 돌려준다", () => {
    const left = [1, 2, 3, 4, 5];
    expect(rotateLeft(left, 2, { inplace: true })).toBe(left);
    expect(left).toEqual([3, 4, 5, 1, 2]);

    const right = [1, 2, 3, 4, 5];
    expect(rotateRight(right, 2, { inplace: true })).toBe(right);
    expect(right).toEqual([4, 5, 1, 2, 3]);
  });

  it("길이와 count의 모든 조합에서 slice로 만든 결과와 같다", () => {
    for (let length = 0; length <= 7; length++) {
      const arr = Array.from({ length }, (_, i) => i);
      for (let count = -9; count <= 9; count++) {
        const k = length === 0 ? 0 : ((count % length) + length) % length;
        const expected = [...arr.slice(k), ...arr.slice(0, k)];
        expect(rotateLeft(arr, count, { inplace: false })).toEqual(expected);
        expect(rotateRight(arr, -count, { inplace: false })).toEqual(expected);
      }
    }
  });
});

describe("swapItems", () => {
  it("두 위치의 항목을 서로 바꾼다", () => {
    expect(swapItems(["a", "b", "c"], 0, 2, { inplace: false })).toEqual([
      "c",
      "b",
      "a",
    ]);
  });

  it("음수 인덱스는 뒤에서부터 센다", () => {
    expect(swapItems(["a", "b", "c"], 0, -1, { inplace: false })).toEqual([
      "c",
      "b",
      "a",
    ]);
  });

  it("인덱스가 범위 밖이면 바꾸지 않는다", () => {
    expect(swapItems(["a", "b"], 0, 5, { inplace: false })).toEqual(["a", "b"]);
    expect(swapItems(["a", "b"], -3, 0, { inplace: false })).toEqual([
      "a",
      "b",
    ]);
  });

  it("정수가 아닌 인덱스는 바꾸지 않고 속성도 만들지 않는다", () => {
    const arr = ["a", "b"];
    const result = swapItems(arr, 0, 1.5, { inplace: true });
    expect(result).toEqual(["a", "b"]);
    expect(Object.keys(result)).toEqual(["0", "1"]);
  });

  it("같은 위치끼리는 그대로다", () => {
    expect(swapItems(["a", "b"], 1, 1, { inplace: false })).toEqual(["a", "b"]);
  });

  it("바꾸지 않아도 inplace가 false이면 새 배열을 돌려준다", () => {
    const arr = ["a", "b"];
    expect(swapItems(arr, 0, 9, { inplace: false })).not.toBe(arr);
  });

  it("inplace가 false이면 원본을 바꾸지 않는다", () => {
    const arr: readonly string[] = Object.freeze(["a", "b"]);
    expect(swapItems(arr, 0, 1, { inplace: false })).toEqual(["b", "a"]);
    expect(arr).toEqual(["a", "b"]);
  });

  it("inplace가 true이면 전달한 배열을 수정하고 같은 배열을 돌려준다", () => {
    const arr = ["a", "b"];
    expect(swapItems(arr, 0, 1, { inplace: true })).toBe(arr);
    expect(arr).toEqual(["b", "a"]);
  });
});

describe("swapValues", () => {
  it("두 값의 첫 위치를 서로 바꾼다", () => {
    expect(
      swapValues(["a", "b", "a", "c"], "a", "c", { inplace: false }),
    ).toEqual(["c", "b", "a", "a"]);
  });

  it("둘 중 하나라도 없으면 undefined이고 배열은 그대로다", () => {
    const arr = ["a", "b"];
    expect(swapValues(arr, "a", "z", { inplace: false })).toBeUndefined();
    expect(swapValues(arr, "z", "a", { inplace: true })).toBeUndefined();
    expect(arr).toEqual(["a", "b"]);
  });

  it("두 값이 같고 배열에 있으면 그대로 돌려준다", () => {
    expect(swapValues(["a", "b"], "a", "a", { inplace: false })).toEqual([
      "a",
      "b",
    ]);
  });

  it("두 값이 같아도 배열에 없으면 undefined다", () => {
    expect(swapValues(["a"], "z", "z", { inplace: false })).toBeUndefined();
  });

  it("NaN도 바꿀 수 있다", () => {
    const result = swapValues([Number.NaN, 1], Number.NaN, 1, {
      inplace: false,
    });
    expect(result).toEqual([1, Number.NaN]);
  });

  it("inplace가 false이면 원본을 바꾸지 않는다", () => {
    const arr: readonly string[] = Object.freeze(["a", "b"]);
    expect(swapValues(arr, "a", "b", { inplace: false })).toEqual(["b", "a"]);
    expect(arr).toEqual(["a", "b"]);
  });

  it("inplace가 true이면 전달한 배열을 수정하고 같은 배열을 돌려준다", () => {
    const arr = ["a", "b"];
    expect(swapValues(arr, "a", "b", { inplace: true })).toBe(arr);
    expect(arr).toEqual(["b", "a"]);
  });
});

describe("inplace 옵션 타입", () => {
  // 컴파일 오류가 나야 하는 호출이다. 런타임에는 실행하지 않는다.
  it("readonly 배열은 inplace: true로 받지 않는다", () => {
    const typeChecks = (frozen: readonly number[]) => {
      // @ts-expect-error readonly 배열은 직접 수정할 수 없다
      prependUnique(frozen, [1], { inplace: true });
      // @ts-expect-error readonly 배열은 직접 수정할 수 없다
      rotateLeft(frozen, 1, { inplace: true });
      // @ts-expect-error readonly 배열은 직접 수정할 수 없다
      swapItems(frozen, 0, 1, { inplace: true });
      // @ts-expect-error readonly 배열은 직접 수정할 수 없다
      swapValues(frozen, 0, 1, { inplace: true });
    };
    expect(typeof typeChecks).toBe("function");
  });
});
