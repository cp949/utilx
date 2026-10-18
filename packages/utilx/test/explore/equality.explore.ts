import fc from "fast-check";
import { describe, it } from "vitest";
import {
  checkGraphPair,
  checkGraphReflexive,
  checkReflexiveAndClone,
  checkSymmetric,
  type GraphKind,
  type GraphSpec,
} from "../property/support/equalityChecks.js";

const atom = fc.constantFrom<unknown>(
  0,
  -0,
  1,
  Number.NaN,
  "a",
  "",
  undefined,
  null,
  true,
  false,
);

// isDeepEqual이 지원하는 타입만 만든다. 임의 객체나 Proxy는 대상이 아니다.
const { value } = fc.letrec<{ value: unknown }>((tie) => ({
  value: fc.oneof(
    { depthSize: "small", maxDepth: 3 },
    atom,
    fc.array(tie("value"), { maxLength: 4 }),
    fc.dictionary(fc.constantFrom("k", "l", "m"), tie("value"), { maxKeys: 3 }),
    fc
      .array(fc.tuple(fc.constantFrom("k", "l", "m"), tie("value")), {
        maxLength: 3,
      })
      .map((entries) => new Map<string, unknown>(entries)),
    fc.array(atom, { maxLength: 4 }).map((items) => new Set(items)),
    fc.date().map((date) => new Date(date.getTime())),
    fc.constantFrom(/a/u, /a/gu, /b/u),
  ),
}));

const graphKind = fc.constantFrom<GraphKind>("object", "array", "map");

/** 노드 1~6개 순환 그래프의 명세. */
const graphSpec: fc.Arbitrary<GraphSpec> = fc
  .integer({ min: 1, max: 6 })
  .chain((size) =>
    fc.record({
      labels: fc.array(fc.constantFrom("a", "b"), {
        minLength: size,
        maxLength: size,
      }),
      next: fc.array(fc.integer({ min: 0, max: size - 1 }), {
        minLength: size,
        maxLength: size,
      }),
    }),
  );

describe("isDeepEqual 탐색", () => {
  it("임의 값은 자기 자신과 구조 복제본과 같다", () => {
    fc.assert(fc.property(value, checkReflexiveAndClone));
  });

  it("임의 값 쌍의 결과가 인자 순서와 무관하다", () => {
    fc.assert(fc.property(value, value, checkSymmetric));
  });

  it("순환 그래프는 자기 자신과 복제본과 같고 비교가 끝난다", () => {
    fc.assert(fc.property(graphKind, graphSpec, checkGraphReflexive));
  });

  it("순환 그래프 쌍은 대칭이고 라벨 순서가 같을 때만 같다", () => {
    fc.assert(
      fc.property(graphKind, graphSpec, graphKind, graphSpec, checkGraphPair),
    );
  });
});
