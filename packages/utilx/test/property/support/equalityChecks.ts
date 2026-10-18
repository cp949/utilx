import assert from "node:assert/strict";
import { isDeepEqual } from "../../../src/equality/index.js";

/** 반사성: 모든 값은 자기 자신과 같고, 구조를 복제한 값과도 같다. */
export function checkReflexiveAndClone(value: unknown): void {
  assert.equal(isDeepEqual(value, value), true, "반사성");
  assert.equal(
    isDeepEqual(value, structuredClone(value)),
    true,
    "복제본과 같다",
  );
  assert.equal(
    isDeepEqual(structuredClone(value), value),
    true,
    "복제본과 같다(교환)",
  );
}

/** 대칭성: 결과가 인자 순서에 따라 달라지지 않는다. */
export function checkSymmetric(a: unknown, b: unknown): void {
  assert.equal(isDeepEqual(a, b), isDeepEqual(b, a), "대칭성");
}

/** 순환 그래프를 만드는 컨테이너 종류. 모두 `label`과 `next`를 가진다. */
export type GraphKind = "object" | "array" | "map";

/** 노드마다 라벨과 다음 노드 번호를 정한 그래프의 명세. `next[i]`는 노드 `i`가 가리키는 노드다. */
export interface GraphSpec {
  readonly labels: readonly string[];
  readonly next: readonly number[];
}

type Node = Record<string, unknown> | unknown[] | Map<string, unknown>;

/** 명세대로 순환 그래프를 만들고 0번 노드를 돌려준다. */
export function buildGraph(kind: GraphKind, spec: GraphSpec): Node {
  const nodes: Node[] = spec.labels.map((label) => {
    if (kind === "object") return { label, next: undefined };
    if (kind === "array") return [label, undefined];
    return new Map<string, unknown>([["label", label]]);
  });
  nodes.forEach((node, index) => {
    const target = nodes[spec.next[index] as number];
    if (kind === "object") (node as Record<string, unknown>).next = target;
    else if (kind === "array") (node as unknown[])[1] = target;
    else (node as Map<string, unknown>).set("next", target);
  });
  return nodes[0] as Node;
}

/** 0번 노드에서 `next`를 따라 걸으며 만난 라벨의 앞 `steps`개. */
function labelWalk(spec: GraphSpec, steps: number): string[] {
  const walk: string[] = [];
  let node = 0;
  for (let step = 0; step < steps; step += 1) {
    walk.push(spec.labels[node] as string);
    node = spec.next[node] as number;
  }
  return walk;
}

/**
 * 두 순환 그래프의 동등성을 확인한다. 같은 컨테이너 종류에서는 라벨 걷기가 같을 때만 같다.
 * 노드가 각각 n1, n2개이면 앞 n1*n2 걸음이 같을 때 이후도 같으므로 그만큼만 비교한다.
 * 종류가 다르면 같지 않다.
 */
export function checkGraphPair(
  kindA: GraphKind,
  specA: GraphSpec,
  kindB: GraphKind,
  specB: GraphSpec,
): void {
  const a = buildGraph(kindA, specA);
  const b = buildGraph(kindB, specB);
  const actual = isDeepEqual(a, b);
  assert.equal(actual, isDeepEqual(b, a), "대칭성");
  const steps = specA.labels.length * specB.labels.length;
  const expected =
    kindA === kindB &&
    labelWalk(specA, steps).join() === labelWalk(specB, steps).join();
  assert.equal(actual, expected, "라벨 걷기가 같을 때만 같다");
}

/** 순환 그래프 하나의 반사성과 복제본 동등성. */
export function checkGraphReflexive(kind: GraphKind, spec: GraphSpec): void {
  checkReflexiveAndClone(buildGraph(kind, spec));
}
