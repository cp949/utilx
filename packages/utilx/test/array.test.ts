import { describe, expect, it } from "vitest";
import {
  appendUnique,
  moveItem,
  removeFirst,
  updateFirst,
} from "../src/array/index.js";

describe("appendUnique", () => {
  it("배열에 없는 값만 끝에 추가한다", () => {
    expect(appendUnique([1, 2], [2, 3], { inplace: false })).toEqual([1, 2, 3]);
  });

  it("items 안의 중복도 한 번만 추가한다", () => {
    expect(appendUnique([1], [2, 2, 3, 2], { inplace: false })).toEqual([
      1, 2, 3,
    ]);
  });

  it("원래 배열의 중복은 손대지 않는다", () => {
    expect(appendUnique([1, 1], [2], { inplace: false })).toEqual([1, 1, 2]);
  });

  it("NaN은 NaN과 같은 값으로 본다", () => {
    expect(
      appendUnique([Number.NaN], [Number.NaN], { inplace: false }),
    ).toEqual([Number.NaN]);
  });

  it("추가할 값이 없으면 같은 내용의 새 배열을 돌려준다", () => {
    const arr = [1, 2];
    const result = appendUnique(arr, [], { inplace: false });
    expect(result).toEqual([1, 2]);
    expect(result).not.toBe(arr);
  });

  it("inplace가 false이면 원본을 바꾸지 않는다", () => {
    const arr: readonly number[] = Object.freeze([1]);
    expect(appendUnique(arr, [2], { inplace: false })).toEqual([1, 2]);
    expect(arr).toEqual([1]);
  });

  it("inplace가 true이면 전달한 배열을 수정하고 같은 배열을 돌려준다", () => {
    const arr = [1];
    const result = appendUnique(arr, [1, 2], { inplace: true });
    expect(result).toBe(arr);
    expect(arr).toEqual([1, 2]);
  });
});

describe("removeFirst", () => {
  it("값이 같은 첫 항목만 뺀다", () => {
    expect(removeFirst([1, 2, 1], 1, { inplace: false })).toEqual([2, 1]);
  });

  it("같은 값이 없으면 내용을 그대로 둔 새 배열을 돌려준다", () => {
    const arr = [1, 2];
    const result = removeFirst(arr, 3, { inplace: false });
    expect(result).toEqual([1, 2]);
    expect(result).not.toBe(arr);
  });

  it("NaN도 뺄 수 있다", () => {
    expect(
      removeFirst([1, Number.NaN], Number.NaN, { inplace: false }),
    ).toEqual([1]);
  });

  it("inplace가 false이면 원본을 바꾸지 않는다", () => {
    const arr: readonly string[] = Object.freeze(["a", "b"]);
    expect(removeFirst(arr, "a", { inplace: false })).toEqual(["b"]);
    expect(arr).toEqual(["a", "b"]);
  });

  it("inplace가 true이면 전달한 배열을 수정하고 같은 배열을 돌려준다", () => {
    const arr = ["a", "b"];
    const result = removeFirst(arr, "a", { inplace: true });
    expect(result).toBe(arr);
    expect(arr).toEqual(["b"]);
  });
});

describe("updateFirst", () => {
  const items = [
    { id: 1, on: false },
    { id: 2, on: false },
    { id: 2, on: false },
  ];

  it("조건에 맞는 첫 항목만 바꾼다", () => {
    const result = updateFirst(
      items,
      (it) => it.id === 2,
      (it) => ({ ...it, on: true }),
      { inplace: false },
    );
    expect(result).toEqual([
      { id: 1, on: false },
      { id: 2, on: true },
      { id: 2, on: false },
    ]);
    expect(items[1]).toEqual({ id: 2, on: false });
  });

  it("match와 update에 항목과 위치를 넘긴다", () => {
    const seen: number[] = [];
    updateFirst(
      ["a", "b"],
      (_item, index) => index === 1,
      (item, index) => {
        seen.push(index);
        return item;
      },
      { inplace: false },
    );
    expect(seen).toEqual([1]);
  });

  it("조건에 맞는 항목이 없으면 undefined이고 배열은 그대로다", () => {
    const arr = [1, 2];
    expect(
      updateFirst(
        arr,
        (it) => it === 9,
        (it) => it,
        { inplace: false },
      ),
    ).toBeUndefined();
    expect(
      updateFirst(
        arr,
        (it) => it === 9,
        (it) => it,
        { inplace: true },
      ),
    ).toBeUndefined();
    expect(arr).toEqual([1, 2]);
  });

  it("inplace가 true이면 전달한 배열을 수정하고 같은 배열을 돌려준다", () => {
    const arr = [1, 2];
    const result = updateFirst(
      arr,
      (it) => it === 2,
      (it) => it * 10,
      { inplace: true },
    );
    expect(result).toBe(arr);
    expect(arr).toEqual([1, 20]);
  });
});

describe("moveItem", () => {
  it("앞의 항목을 뒤로 옮긴다", () => {
    expect(moveItem(["a", "b", "c"], 0, 2, { inplace: false })).toEqual([
      "b",
      "c",
      "a",
    ]);
  });

  it("뒤의 항목을 앞으로 옮긴다", () => {
    expect(moveItem(["a", "b", "c"], 2, 0, { inplace: false })).toEqual([
      "c",
      "a",
      "b",
    ]);
  });

  it("fromIndex가 음수이면 뒤에서부터 센다", () => {
    expect(moveItem(["a", "b", "c"], -1, 0, { inplace: false })).toEqual([
      "c",
      "a",
      "b",
    ]);
  });

  it("fromIndex가 범위 밖이면 옮기지 않는다", () => {
    expect(moveItem(["a", "b"], 5, 0, { inplace: false })).toEqual(["a", "b"]);
    expect(moveItem(["a", "b"], -3, 0, { inplace: false })).toEqual(["a", "b"]);
  });

  it("fromIndex가 정수가 아니면 옮기지 않고 요소와 길이를 보존한다", () => {
    // -0.9999999999999999는 길이 3을 더하면 반올림되어 정수 2가 된다.
    const invalid = [
      NaN,
      Infinity,
      -Infinity,
      0.5,
      1.5,
      -0.5,
      -1.5,
      -0.9999999999999999,
    ];
    for (const fromIndex of invalid) {
      expect(moveItem([], fromIndex, 0, { inplace: false })).toEqual([]);
      const empty: string[] = [];
      expect(moveItem(empty, fromIndex, 0, { inplace: true })).toBe(empty);
      expect(empty).toEqual([]);

      const source = ["a", "b", "c"];
      const copied = moveItem(source, fromIndex, 0, { inplace: false });
      expect(copied).not.toBe(source);
      expect(copied).toEqual(["a", "b", "c"]);
      expect(source).toEqual(["a", "b", "c"]);

      const arr = ["a", "b", "c"];
      expect(moveItem(arr, fromIndex, 2, { inplace: true })).toBe(arr);
      expect(arr).toEqual(["a", "b", "c"]);
    }
  });

  it("toIndex는 splice의 보정 규칙을 따른다", () => {
    const move = (toIndex: number) =>
      moveItem(["a", "b", "c"], 0, toIndex, { inplace: false });
    expect(move(-1)).toEqual(["b", "a", "c"]);
    expect(move(Infinity)).toEqual(["b", "c", "a"]);
    expect(move(-Infinity)).toEqual(["a", "b", "c"]);
    expect(move(NaN)).toEqual(["a", "b", "c"]);
  });

  it("같은 위치로 옮기면 그대로다", () => {
    expect(moveItem(["a", "b"], 1, 1, { inplace: false })).toEqual(["a", "b"]);
  });

  it("toIndex가 길이를 넘으면 맨 뒤로 간다", () => {
    expect(moveItem(["a", "b", "c"], 0, 99, { inplace: false })).toEqual([
      "b",
      "c",
      "a",
    ]);
  });

  it("빈 배열은 그대로다", () => {
    expect(moveItem([], 0, 1, { inplace: false })).toEqual([]);
  });

  it("옮기지 않아도 inplace가 false이면 새 배열을 돌려준다", () => {
    const arr = ["a", "b"];
    expect(moveItem(arr, 5, 0, { inplace: false })).not.toBe(arr);
  });

  it("inplace가 false이면 원본을 바꾸지 않는다", () => {
    const arr: readonly string[] = Object.freeze(["a", "b", "c"]);
    expect(moveItem(arr, 0, 2, { inplace: false })).toEqual(["b", "c", "a"]);
    expect(arr).toEqual(["a", "b", "c"]);
  });

  it("inplace가 true이면 전달한 배열을 수정하고 같은 배열을 돌려준다", () => {
    const arr = ["a", "b", "c"];
    const result = moveItem(arr, 0, 2, { inplace: true });
    expect(result).toBe(arr);
    expect(arr).toEqual(["b", "c", "a"]);
  });
});

describe("inplace 옵션 타입", () => {
  // 컴파일 오류가 나야 하는 호출이다. 런타임에는 실행하지 않는다.
  it("readonly 배열은 inplace: true로 받지 않는다", () => {
    const typeChecks = (frozen: readonly number[]) => {
      // @ts-expect-error readonly 배열은 직접 수정할 수 없다
      appendUnique(frozen, [2], { inplace: true });
      // @ts-expect-error readonly 배열은 직접 수정할 수 없다
      removeFirst(frozen, 1, { inplace: true });
      // @ts-expect-error readonly 배열은 직접 수정할 수 없다
      moveItem(frozen, 0, 1, { inplace: true });
    };
    expect(typeof typeChecks).toBe("function");
  });

  it("옵션을 생략하거나 boolean 변수로 넘기면 컴파일되지 않는다", () => {
    const typeChecks = (arr: number[], flag: boolean) => {
      // @ts-expect-error 옵션은 필수다
      removeFirst(arr, 1);
      // @ts-expect-error inplace는 true나 false 리터럴이어야 한다
      removeFirst(arr, 1, { inplace: flag });
    };
    expect(typeof typeChecks).toBe("function");
  });
});
