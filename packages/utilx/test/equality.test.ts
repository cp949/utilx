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

  it("Map은 키를 SameValueZero로 찾고 값은 재귀 비교한다", () => {
    expect(
      isDeepEqual(new Map([["k", { v: 1 }]]), new Map([["k", { v: 1 }]])),
    ).toBe(true);
    expect(
      isDeepEqual(new Map([["k", { v: 1 }]]), new Map([["k", { v: 2 }]])),
    ).toBe(false);
    expect(isDeepEqual(new Map([["a", 1]]), new Map([["b", 1]]))).toBe(false);
    expect(isDeepEqual(new Map(), new Map([["a", 1]]))).toBe(false);
  });

  it("Map의 객체 키는 같은 참조여야 하고 값만 재귀 비교한다", () => {
    const key = { id: 1 };
    expect(
      isDeepEqual(new Map([[key, { v: 1 }]]), new Map([[key, { v: 1 }]])),
    ).toBe(true);
    expect(
      isDeepEqual(new Map([[key, { v: 1 }]]), new Map([[key, { v: 2 }]])),
    ).toBe(false);
    // 내용이 같아도 참조가 다른 객체 키는 다른 키다.
    expect(
      isDeepEqual(
        new Map([[{ id: 1 }, { v: 1 }]]),
        new Map([[{ id: 1 }, { v: 1 }]]),
      ),
    ).toBe(false);
  });

  it("Map의 키는 SameValueZero로 비교한다", () => {
    expect(isDeepEqual(new Map([[NaN, 1]]), new Map([[NaN, 1]]))).toBe(true);
    expect(isDeepEqual(new Map([[0, 1]]), new Map([[-0, 1]]))).toBe(true);
    expect(isDeepEqual(new Map([[NaN, 1]]), new Map([[0, 1]]))).toBe(false);
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

  describe("서로 다른 길이의 순환", () => {
    type Node = { value: number; next?: Node };

    // values 순서대로 노드를 만들고 마지막 노드가 첫 노드를 가리키게 한다.
    const makeCycle = (...values: number[]): Node => {
      const nodes = values.map((value): Node => ({ value }));
      nodes.forEach((node, index) => {
        node.next = nodes[(index + 1) % nodes.length];
      });
      return nodes[0] as Node;
    };

    // 양방향 결과가 같아야 한다. 기록이 왼쪽 객체 기준이라 방향마다 실행 경로가 다르다.
    const expectBoth = (a: unknown, b: unknown, expected: boolean) => {
      expect(isDeepEqual(a, b)).toBe(expected);
      expect(isDeepEqual(b, a)).toBe(expected);
    };

    it("1·2·3노드 순환을 교차 비교해도 종료하고 펼친 값이 같으면 같다", () => {
      const cycles = [makeCycle(1), makeCycle(1, 1), makeCycle(1, 1, 1)];

      for (const a of cycles) {
        for (const b of cycles) {
          expectBoth(a, b, true);
        }
      }
    });

    it("주기가 배수 관계여도 펼친 값이 같으면 같다", () => {
      expectBoth(makeCycle(1, 2), makeCycle(1, 2, 1, 2), true);
    });

    it("순환 안의 값이 다르면 다르다", () => {
      expectBoth(makeCycle(1), makeCycle(1, 2), false);
      expectBoth(makeCycle(1, 1), makeCycle(1, 2), false);
      expectBoth(makeCycle(1, 1, 1), makeCycle(1, 1, 2), false);
      expectBoth(makeCycle(1, 2), makeCycle(1, 2, 1, 3), false);
    });

    it("배열의 순환도 종료한다", () => {
      const self: unknown[] = [1];
      self.push(self);
      const inner: unknown[] = [1];
      const outer: unknown[] = [1, inner];
      inner.push(outer);
      const differentOuter: unknown[] = [2];
      const different: unknown[] = [1, differentOuter];
      differentOuter.push(different);

      expectBoth(self, outer, true);
      expectBoth(self, different, false);
    });

    it("Map 값의 순환도 종료한다", () => {
      const self = new Map<string, unknown>([["v", 1]]);
      self.set("next", self);
      const first = new Map<string, unknown>([["v", 1]]);
      const second = new Map<string, unknown>([["v", 1]]);
      first.set("next", second);
      second.set("next", first);
      const differentFirst = new Map<string, unknown>([["v", 1]]);
      const differentSecond = new Map<string, unknown>([["v", 2]]);
      differentFirst.set("next", differentSecond);
      differentSecond.set("next", differentFirst);

      expectBoth(self, first, true);
      expectBoth(self, differentFirst, false);
    });
  });

  it("같은 객체를 두 번 참조하는 구조도 비교한다", () => {
    const shared = { x: 1 };

    expect(
      isDeepEqual({ a: shared, b: shared }, { a: { x: 1 }, b: { x: 1 } }),
    ).toBe(true);
  });
});
