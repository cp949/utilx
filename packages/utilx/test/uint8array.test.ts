import { runInNewContext } from "node:vm";
import { describe, expect, it } from "vitest";
import {
  areUint8ArraysEqual,
  compareUint8Arrays,
  concatUint8Arrays,
  includesUint8Array,
  indexOfUint8Array,
  isUint8Array,
  toUint8Array,
} from "../src/binary/index.js";

const bytes = (...values: number[]) => new Uint8Array(values);

describe("isUint8Array", () => {
  it("Uint8Array와 Buffer는 true다", () => {
    expect(isUint8Array(new Uint8Array(1))).toBe(true);
    expect(isUint8Array(Buffer.from("a"))).toBe(true);
  });

  it("다른 realm에서 만든 Uint8Array도 true다", () => {
    const foreign: unknown = runInNewContext("new Uint8Array(2)");

    expect(foreign instanceof Uint8Array).toBe(false);
    expect(isUint8Array(foreign)).toBe(true);
  });

  it.each([
    [null],
    [undefined],
    [0],
    ["a"],
    [[1]],
    [new ArrayBuffer(1)],
    [new Uint16Array(1)],
    [{}],
  ])("%j는 false다", (value) => {
    expect(isUint8Array(value)).toBe(false);
  });
});

describe("toUint8Array", () => {
  it("ArrayBuffer를 복사 없이 감싼다", () => {
    const buffer = new ArrayBuffer(4);
    const view = toUint8Array(buffer);

    view[0] = 7;

    expect(view.buffer).toBe(buffer);
    expect(new Uint8Array(buffer)[0]).toBe(7);
  });

  it("view의 offset과 길이를 유지한다", () => {
    const buffer = new Uint8Array([1, 2, 3, 4, 5]).buffer;
    const view = toUint8Array(new DataView(buffer, 1, 3));

    expect([...view]).toEqual([2, 3, 4]);
    expect(view.buffer).toBe(buffer);
  });

  it("다른 TypedArray는 바이트 단위로 본다", () => {
    expect(toUint8Array(new Uint16Array([0x0102])).length).toBe(2);
  });

  it("Buffer를 순수 Uint8Array로 바꾼다", () => {
    const view = toUint8Array(Buffer.from([1, 2]));

    expect(Buffer.isBuffer(view)).toBe(false);
    expect([...view]).toEqual([1, 2]);
  });

  it("ArrayBuffer도 view도 아니면 TypeError다", () => {
    expect(() => toUint8Array({} as ArrayBuffer)).toThrow(TypeError);
    expect(() => toUint8Array("a" as unknown as ArrayBuffer)).toThrow(
      TypeError,
    );
  });
});

describe("concatUint8Arrays", () => {
  it("순서대로 이어 붙인 새 배열을 만든다", () => {
    const a = bytes(1, 2);
    const result = concatUint8Arrays([a, bytes(), bytes(3)]);

    expect([...result]).toEqual([1, 2, 3]);
    expect(result.buffer).not.toBe(a.buffer);
  });

  it("빈 목록은 길이 0이다", () => {
    expect(concatUint8Arrays([]).length).toBe(0);
  });
});

describe("areUint8ArraysEqual", () => {
  it("길이와 내용이 같으면 true다", () => {
    expect(areUint8ArraysEqual(bytes(1, 2), bytes(1, 2))).toBe(true);
    expect(areUint8ArraysEqual(bytes(), bytes())).toBe(true);
  });

  it("내용이나 길이가 다르면 false다", () => {
    expect(areUint8ArraysEqual(bytes(1, 2), bytes(1, 3))).toBe(false);
    expect(areUint8ArraysEqual(bytes(1, 2), bytes(1))).toBe(false);
  });

  it("같은 참조는 true다", () => {
    const a = bytes(1);

    expect(areUint8ArraysEqual(a, a)).toBe(true);
  });
});

describe("compareUint8Arrays", () => {
  it("첫 번째로 다른 바이트로 순서를 정한다", () => {
    expect(compareUint8Arrays(bytes(1, 9), bytes(2))).toBe(-1);
    expect(compareUint8Arrays(bytes(2), bytes(1, 9))).toBe(1);
  });

  it("앞부분이 같으면 짧은 쪽이 먼저다", () => {
    expect(compareUint8Arrays(bytes(1), bytes(1, 0))).toBe(-1);
    expect(compareUint8Arrays(bytes(1, 0), bytes(1))).toBe(1);
  });

  it("같으면 0이다", () => {
    expect(compareUint8Arrays(bytes(1, 2), bytes(1, 2))).toBe(0);
    expect(compareUint8Arrays(bytes(), bytes())).toBe(0);
  });

  it("sort의 비교 함수로 쓸 수 있다", () => {
    const sorted = [bytes(3), bytes(1, 2), bytes(1)].sort(compareUint8Arrays);

    expect(sorted.map((it) => [...it])).toEqual([[1], [1, 2], [3]]);
  });
});

describe("indexOfUint8Array / includesUint8Array", () => {
  const array = bytes(1, 2, 3, 2, 3);

  it("처음 나오는 위치를 돌려준다", () => {
    expect(indexOfUint8Array(array, bytes(2, 3))).toBe(1);
    expect(indexOfUint8Array(array, bytes(1))).toBe(0);
    expect(indexOfUint8Array(array, bytes(3))).toBe(2);
  });

  it("끝에 있는 바이트열도 찾는다", () => {
    expect(indexOfUint8Array(bytes(1, 2, 3), bytes(2, 3))).toBe(1);
    expect(indexOfUint8Array(array, array)).toBe(0);
  });

  it("없으면 -1이다", () => {
    expect(indexOfUint8Array(array, bytes(3, 1))).toBe(-1);
    expect(indexOfUint8Array(array, bytes(1, 2, 3, 2, 3, 4))).toBe(-1);
    expect(indexOfUint8Array(bytes(), bytes(1))).toBe(-1);
  });

  it("빈 검색 대상은 0이다", () => {
    expect(indexOfUint8Array(array, bytes())).toBe(0);
    expect(indexOfUint8Array(bytes(), bytes())).toBe(0);
  });

  it("includesUint8Array는 포함 여부를 돌려준다", () => {
    expect(includesUint8Array(array, bytes(3, 2))).toBe(true);
    expect(includesUint8Array(array, bytes(9))).toBe(false);
  });
});
