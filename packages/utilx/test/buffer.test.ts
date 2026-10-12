import { describe, expect, it } from "vitest";
import { BoundedBuffer } from "../src/buffer/index.js";

function filled(maxSize: number, values: number[]): BoundedBuffer<number> {
  const buffer = new BoundedBuffer<number>(maxSize);
  for (const value of values) buffer.push(value);
  return buffer;
}

describe("BoundedBuffer", () => {
  it("최대 개수를 넘으면 오래된 항목부터 버린다", () => {
    const buffer = filled(3, [1, 2, 3, 4]);

    expect(buffer.size).toBe(3);
    expect(buffer.toArray()).toEqual([2, 3, 4]);
    expect(buffer.peekOldest()).toBe(2);
    expect(buffer.peekNewest()).toBe(4);
  });

  it("shift는 가장 오래된 항목을 꺼내고 비면 undefined다", () => {
    const buffer = filled(3, [1, 2]);

    expect(buffer.shift()).toBe(1);
    expect(buffer.shift()).toBe(2);
    expect(buffer.shift()).toBeUndefined();
    expect(buffer.size).toBe(0);
  });

  it("비어 있으면 peek도 undefined다", () => {
    const buffer = new BoundedBuffer<number>(2);

    expect(buffer.peekOldest()).toBeUndefined();
    expect(buffer.peekNewest()).toBeUndefined();
  });

  it("null 값도 보관하고 비어 있음과 구분할 수 있다", () => {
    const buffer = new BoundedBuffer<number | null>(2);
    buffer.push(null);

    expect(buffer.peekNewest()).toBeNull();
    expect(buffer.size).toBe(1);
  });

  it("비운 뒤에도 다시 채울 수 있다", () => {
    const buffer = filled(2, [1, 2]);
    buffer.shift();
    buffer.shift();
    buffer.push(9);

    expect(buffer.toArray()).toEqual([9]);
    expect(buffer.peekOldest()).toBe(9);
    expect(buffer.peekNewest()).toBe(9);
  });

  it("clear는 항목만 비우고 maxSize는 유지한다", () => {
    const buffer = filled(3, [1, 2, 3]);
    buffer.clear();

    expect(buffer.size).toBe(0);
    expect(buffer.maxSize).toBe(3);
    expect(buffer.toArray()).toEqual([]);
  });

  it("오래된 항목부터 순회한다", () => {
    expect([...filled(3, [1, 2, 3])]).toEqual([1, 2, 3]);
  });

  it("toArray는 호출마다 새 배열을 돌려준다", () => {
    const buffer = filled(2, [1, 2]);

    expect(buffer.toArray()).not.toBe(buffer.toArray());
  });

  it("clone은 독립된 복사본이다", () => {
    const buffer = filled(3, [1, 2]);
    const copy = buffer.clone();
    copy.push(3);

    expect(buffer.toArray()).toEqual([1, 2]);
    expect(copy.toArray()).toEqual([1, 2, 3]);
    expect(copy.maxSize).toBe(3);
  });

  it("setMaxSize로 줄이면 오래된 항목부터 버린다", () => {
    const buffer = filled(3, [1, 2, 3]);
    buffer.setMaxSize(2);

    expect(buffer.maxSize).toBe(2);
    expect(buffer.toArray()).toEqual([2, 3]);
  });

  it("setMaxSize로 늘리면 더 보관한다", () => {
    const buffer = filled(2, [1, 2, 3]);
    buffer.setMaxSize(4);
    buffer.push(4);
    buffer.push(5);

    expect(buffer.toArray()).toEqual([2, 3, 4, 5]);
  });

  it.each([0, -1, 1.5, Number.NaN, Number.POSITIVE_INFINITY])(
    "maxSize %s는 RangeError다",
    (maxSize) => {
      expect(() => new BoundedBuffer<number>(maxSize)).toThrow(RangeError);
      expect(() => {
        new BoundedBuffer<number>(1).setMaxSize(maxSize);
      }).toThrow(RangeError);
    },
  );
});
