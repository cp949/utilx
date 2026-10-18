import { describe, expect, it } from "vitest";
import { isDeepEqual } from "../../src/equality/index.js";
import {
  checkGraphPair,
  checkGraphReflexive,
  checkReflexiveAndClone,
  checkSymmetric,
  type GraphKind,
  type GraphSpec,
} from "./support/equalityChecks.js";
import {
  forEachCase,
  sequencesOf,
  show,
  tuplesOf,
} from "./support/enumerate.js";

// 지원 타입의 작은 값 모음: 원시값, 배열, 평범한 객체, Map, Set, Date, RegExp.
const ATOMS: readonly unknown[] = [
  0,
  -0,
  1,
  Number.NaN,
  "a",
  undefined,
  null,
  true,
];

function smallValues(): unknown[] {
  const values: unknown[] = [...ATOMS];
  for (const items of sequencesOf(ATOMS, 2)) {
    values.push(items);
    values.push(new Set(items));
  }
  for (const first of [undefined, ...ATOMS]) {
    for (const second of [undefined, ...ATOMS]) {
      const object: Record<string, unknown> = {};
      const map = new Map<string, unknown>();
      if (first !== undefined || second !== undefined) {
        object.k = first;
        map.set("k", first);
      }
      if (second !== undefined) {
        object.l = second;
        map.set("l", second);
      }
      values.push(object, map);
    }
  }
  values.push(new Date(0), new Date(1), new Date(Number.NaN), /a/u, /a/gu);
  return values;
}

/** 노드 `size`개의 모든 라벨·다음 노드 배치. 라벨은 `a`, `b` 두 종류다. */
function graphSpecs(maxNodes: number): GraphSpec[] {
  const specs: GraphSpec[] = [];
  for (let size = 1; size <= maxNodes; size += 1) {
    const nodeIds = Array.from({ length: size }, (_, index) => index);
    for (const labels of tuplesOf(["a", "b"], size)) {
      for (const next of tuplesOf(nodeIds, size)) specs.push({ labels, next });
    }
  }
  return specs;
}

const KINDS: readonly GraphKind[] = ["object", "array", "map"];
const describeSpec = (kind: GraphKind, spec: GraphSpec) =>
  `${kind} 그래프 labels=${show(spec.labels)} next=${show(spec.next)}`;

describe("isDeepEqual 성질", () => {
  const values = smallValues();

  it("작은 값은 모두 자기 자신과 구조 복제본과 같다", () => {
    const count = forEachCase(
      values,
      (value) => show(value),
      checkReflexiveAndClone,
    );
    expect(count).toBe(values.length);
  });

  it("작은 값의 모든 쌍에서 결과가 인자 순서와 무관하다", () => {
    const pairs = values.flatMap((a) => values.map((b) => [a, b] as const));
    const count = forEachCase(
      pairs,
      ([a, b]) => `${show(a)} 와 ${show(b)}`,
      ([a, b]) => checkSymmetric(a, b),
    );
    expect(count).toBe(values.length ** 2);
  });

  // 계약에 정책이 없는 현재 동작이다. 정책이 정해져 바뀌면 이 검사를 새 정책에 맞춘다.
  it("배열의 빈 슬롯과 undefined 요소를 같게 보지만 길이가 다르면 같지 않다(특성화)", () => {
    // eslint-disable-next-line no-sparse-arrays
    expect(isDeepEqual([, 1], [undefined, 1])).toBe(true);
    // eslint-disable-next-line no-sparse-arrays
    expect(isDeepEqual([,], [])).toBe(false);
  });

  it("서로 다른 종류의 값은 같지 않다", () => {
    const containers = values.filter(
      (value): value is object => typeof value === "object" && value !== null,
    );
    const tagOf = (value: object) => Object.prototype.toString.call(value);
    const pairs = containers.flatMap((a) =>
      containers
        .filter((b) => tagOf(a) !== tagOf(b))
        .map((b) => [a, b] as const),
    );
    expect(pairs.length).toBeGreaterThan(0);
    const count = forEachCase(
      pairs,
      ([a, b]) => `${show(a)} 와 ${show(b)}`,
      ([a, b]) => {
        if (isDeepEqual(a, b)) throw new Error("종류가 다른데 같다고 판정했다");
      },
    );
    expect(count).toBe(pairs.length);
  });

  it("노드 1~3개 순환 그래프는 자기 자신과 복제본과 같고 비교가 끝난다", () => {
    const cases = KINDS.flatMap((kind) =>
      graphSpecs(3).map((spec) => ({ kind, spec })),
    );
    const count = forEachCase(
      cases,
      (c) => describeSpec(c.kind, c.spec),
      (c) => checkGraphReflexive(c.kind, c.spec),
    );
    expect(count).toBe(3 * (2 * 1 + 4 * 4 + 8 * 27));
  });

  it("순환 그래프의 모든 쌍에서 결과가 대칭이고 라벨 순서가 같을 때만 같다", () => {
    const specs = graphSpecs(3);
    const cases = KINDS.flatMap((kindA) =>
      KINDS.flatMap((kindB) =>
        specs.flatMap((specA) =>
          specs.map((specB) => ({ kindA, specA, kindB, specB })),
        ),
      ),
    );
    const count = forEachCase(
      cases,
      (c) =>
        `${describeSpec(c.kindA, c.specA)} 와 ${describeSpec(c.kindB, c.specB)}`,
      (c) => checkGraphPair(c.kindA, c.specA, c.kindB, c.specB),
    );
    expect(count).toBe((3 * specs.length) ** 2);
  });
});
