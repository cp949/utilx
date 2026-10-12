import { describe, expect, it } from "vitest";
import { isDeepEqual, isShallowEqual } from "../src/equality/index.js";

describe("isShallowEqual", () => {
  it("원시값은 Object.is로 비교한다", () => {
    expect(isShallowEqual(1, 1)).toBe(true);
    expect(isShallowEqual("a", "a")).toBe(true);
    expect(isShallowEqual(1, 2)).toBe(false);
    expect(isShallowEqual(1, "1")).toBe(false);
    expect(isShallowEqual(Number.NaN, Number.NaN)).toBe(true);
    expect(isShallowEqual(0, -0)).toBe(false);
    expect(isShallowEqual(null, undefined)).toBe(false);
  });

  it("같은 키와 같은 값이면 true다", () => {
    expect(isShallowEqual({ a: 1, b: "x" }, { b: "x", a: 1 })).toBe(true);
    expect(isShallowEqual({}, {})).toBe(true);
  });

  it("값이 다르거나 키 개수가 다르면 false다", () => {
    expect(isShallowEqual({ a: 1 }, { a: 2 })).toBe(false);
    expect(isShallowEqual({ a: 1 }, { a: 1, b: 2 })).toBe(false);
    expect(isShallowEqual({ a: 1, b: 2 }, { a: 1 })).toBe(false);
  });

  it("키가 같은 이름이 아니면 false다(값이 undefined여도)", () => {
    expect(isShallowEqual({ a: undefined }, { b: undefined })).toBe(false);
  });

  it("중첩된 값은 참조로 비교한다", () => {
    const inner = { x: 1 };

    expect(isShallowEqual({ a: inner }, { a: inner })).toBe(true);
    expect(isShallowEqual({ a: { x: 1 } }, { a: { x: 1 } })).toBe(false);
  });

  it("배열은 요소를 비교하고 객체와 구분한다", () => {
    expect(isShallowEqual([1, 2], [1, 2])).toBe(true);
    expect(isShallowEqual([1, 2], [1, 3])).toBe(false);
    expect(isShallowEqual([1], [1, 2])).toBe(false);
    expect(isShallowEqual([], {})).toBe(false);
    expect(isShallowEqual({ 0: 1, length: 1 }, [1])).toBe(false);
  });

  it("같은 참조가 아닌 Date, Map, Set, 클래스 인스턴스는 다르다", () => {
    class Point {
      constructor(public x: number) {}
    }

    expect(isShallowEqual(new Date(1), new Date(2))).toBe(false);
    expect(isShallowEqual(new Map(), new Map())).toBe(false);
    expect(isShallowEqual(new Set(), new Set())).toBe(false);
    expect(isShallowEqual(new Point(1), new Point(1))).toBe(false);

    const date = new Date(1);
    expect(isShallowEqual(date, date)).toBe(true);
  });

  it("프로토타입에서 상속한 키는 같은 키로 보지 않는다", () => {
    const withProto = Object.create({ a: 1 }) as Record<string, unknown>;

    expect(isShallowEqual({ a: 1 }, withProto)).toBe(false);
  });
});

describe("isDeepEqual", () => {
  it("원시값은 Object.is로 비교한다", () => {
    expect(isDeepEqual(1, 1)).toBe(true);
    expect(isDeepEqual(Number.NaN, Number.NaN)).toBe(true);
    expect(isDeepEqual(0, -0)).toBe(false);
    expect(isDeepEqual("a", "b")).toBe(false);
    expect(isDeepEqual(null, undefined)).toBe(false);
    expect(isDeepEqual(null, {})).toBe(false);
  });

  it("중첩된 객체와 배열을 재귀적으로 비교한다", () => {
    expect(
      isDeepEqual({ a: [1, { b: 2 }], c: "x" }, { c: "x", a: [1, { b: 2 }] }),
    ).toBe(true);
    expect(isDeepEqual({ a: [1, { b: 2 }] }, { a: [1, { b: 3 }] })).toBe(false);
    expect(isDeepEqual({ a: [1, 2] }, { a: [1, 2, 3] })).toBe(false);
  });

  it("배열과 객체를 구분한다", () => {
    expect(isDeepEqual([], {})).toBe(false);
    expect(isDeepEqual([1], { 0: 1 })).toBe(false);
  });

  it("키 개수나 이름이 다르면 false다", () => {
    expect(isDeepEqual({ a: 1 }, { a: 1, b: 2 })).toBe(false);
    expect(isDeepEqual({ a: undefined }, { b: undefined })).toBe(false);
  });

  it("Date는 시각으로 비교한다", () => {
    expect(isDeepEqual(new Date(1), new Date(1))).toBe(true);
    expect(isDeepEqual(new Date(1), new Date(2))).toBe(false);
    expect(isDeepEqual(new Date(Number.NaN), new Date(Number.NaN))).toBe(true);
    expect({ at: new Date(1) }).not.toEqual({ at: new Date(2) });
    expect(isDeepEqual({ at: new Date(1) }, { at: new Date(2) })).toBe(false);
  });

  it("RegExp는 source와 flags로 비교한다", () => {
    expect(isDeepEqual(/a/g, /a/g)).toBe(true);
    expect(isDeepEqual(/a/g, /a/i)).toBe(false);
    expect(isDeepEqual(/a/, /b/)).toBe(false);
  });

  it("Map은 키와 값을 깊게 비교한다", () => {
    expect(
      isDeepEqual(new Map([["k", { v: 1 }]]), new Map([["k", { v: 1 }]])),
    ).toBe(true);
    expect(
      isDeepEqual(new Map([["k", { v: 1 }]]), new Map([["k", { v: 2 }]])),
    ).toBe(false);
    expect(isDeepEqual(new Map([["a", 1]]), new Map([["b", 1]]))).toBe(false);
    expect(isDeepEqual(new Map(), new Map([["a", 1]]))).toBe(false);
  });

  it("Set은 요소를 SameValueZero로 비교한다", () => {
    expect(isDeepEqual(new Set([1, 2]), new Set([2, 1]))).toBe(true);
    expect(isDeepEqual(new Set([1, 2]), new Set([1, 3]))).toBe(false);
    expect(isDeepEqual(new Set([{ a: 1 }]), new Set([{ a: 1 }]))).toBe(false);
  });

  it("서로 다른 종류의 객체는 다르다", () => {
    expect(isDeepEqual(new Map(), new Set())).toBe(false);
    expect(isDeepEqual(new Date(0), {})).toBe(false);
  });

  it("같은 참조가 아닌 클래스 인스턴스는 다르다", () => {
    class Point {
      constructor(public x: number) {}
    }
    const point = new Point(1);

    expect(isDeepEqual(new Point(1), new Point(1))).toBe(false);
    expect(isDeepEqual(point, point)).toBe(true);
  });

  it("순환 참조를 처리한다", () => {
    type Node = { name: string; self?: Node };
    const a: Node = { name: "n" };
    a.self = a;
    const b: Node = { name: "n" };
    b.self = b;
    const c: Node = { name: "other" };
    c.self = c;

    expect(isDeepEqual(a, b)).toBe(true);
    expect(isDeepEqual(a, c)).toBe(false);
  });

  it("같은 객체를 두 번 참조하는 구조도 비교한다", () => {
    const shared = { x: 1 };

    expect(
      isDeepEqual({ a: shared, b: shared }, { a: { x: 1 }, b: { x: 1 } }),
    ).toBe(true);
  });
});
