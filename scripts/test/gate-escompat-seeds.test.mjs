import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { loadBaseline } from "../baseline.mjs";
import { lintSeed, realRepoRoot } from "./helpers.mjs";

// [이름, 코드, 경로, 기대 규칙 ID]
const forbidden = [
  [
    "DOM 전역 document 직접 접근",
    "export const r = () => document.title;",
    "nonWeb",
    "no-restricted-globals",
  ],
  [
    "window.document 접근",
    "export const r = () => window.document.title;",
    "nonWeb",
    "no-restricted-globals",
  ],
  [
    "typeof document",
    "export const r = () => typeof document;",
    "nonWeb",
    "no-restricted-globals",
  ],
  [
    "Node 전역 Buffer",
    "export const r = () => Buffer.from([]);",
    "nonWeb",
    "no-restricted-globals",
  ],
  [
    "Node 전역 process",
    "export const r = () => process.env;",
    "web",
    "no-restricted-globals",
  ],
  [
    "structuredClone",
    "export const r = (v) => structuredClone(v);",
    "nonWeb",
    "no-restricted-globals",
  ],
  [
    "외부 패키지 import",
    'import "x";\nexport const r = 1;',
    "nonWeb",
    "no-restricted-imports",
  ],
  [
    "node: import",
    'import { readFileSync } from "node:fs";\nexport const r = readFileSync;',
    "nonWeb",
    "no-restricted-imports",
  ],
  [
    "외부 re-export all",
    'export * from "x";',
    "nonWeb",
    "no-restricted-imports",
  ],
  [
    "외부 이름 re-export",
    'export { a } from "x";',
    "nonWeb",
    "no-restricted-imports",
  ],
  [
    "외부 동적 import",
    'export const r = () => import("x");',
    "nonWeb",
    "no-restricted-syntax",
  ],
  [
    "계산된 동적 import",
    "export const r = (name) => import(name);",
    "nonWeb",
    "no-restricted-syntax",
  ],
  [
    "하한 초과 Promise.allSettled(76)",
    "export const r = Promise.allSettled([]);",
    "nonWeb",
    "es-x/no-promise-all-settled",
  ],
  [
    "하한 초과 Array.prototype.at(92)",
    "export const r = (a) => a.at(0);",
    "nonWeb",
    "es-x/no-array-prototype-at",
  ],
  [
    "하한 초과 Object.hasOwn(93)",
    "export const r = Object.hasOwn({}, 'a');",
    "nonWeb",
    "es-x/no-object-hasown",
  ],
  ...[
    [
      "globalThis.document",
      "export const r = () => globalThis.document.title;",
    ],
    [
      "globalThis의 계산된 document",
      'export const r = () => globalThis["document"].title;',
    ],
    [
      "globalThis.navigator",
      "export const r = () => globalThis.navigator.userAgent;",
    ],
    ["globalThis.window", "export const r = () => globalThis.window;"],
    ["globalThis.self", "export const r = () => globalThis.self;"],
    ["globalThis?.document", "export const r = () => globalThis?.document;"],
  ].map(([name, code]) => [
    `${name} 접근`,
    code,
    "nonWeb",
    "no-restricted-syntax",
  ]),
  ...["nonWeb", "web"].flatMap((area) =>
    [
      ["globalThis.Buffer", "export const r = () => globalThis.Buffer;"],
      ["globalThis.process", "export const r = () => globalThis.process;"],
      ["globalThis.require", "export const r = () => globalThis.require;"],
      [
        "globalThis.structuredClone",
        "export const r = (v) => globalThis.structuredClone(v);",
      ],
      [
        "globalThis의 계산된 process",
        'export const r = () => globalThis["process"];',
      ],
      [
        "globalThis.Math.random",
        "export const r = () => globalThis.Math.random();",
      ],
      ["globalThis의 동적 속성", "export const r = (k) => globalThis[k];"],
      [
        "globalThis의 템플릿 속성",
        "export const r = () => globalThis[`process`];",
      ],
      ["globalThis 별칭", "const g = globalThis;\nexport const r = g.process;"],
      ["globalThis 재할당", "let g;\ng = globalThis;\nexport const r = g;"],
      [
        "globalThis 구조 분해",
        "const { process } = globalThis;\nexport const r = process;",
      ],
      ["globalThis 기본 매개변수", "export const r = (g = globalThis) => g;"],
    ].map(([name, code]) => [
      `${name}(${area})`,
      code,
      area,
      "no-restricted-syntax",
    ]),
  ),
  [
    "Math.random 호출",
    "export const r = Math.random();",
    "web",
    "no-restricted-properties",
  ],
  [
    "Math 계산된 속성 접근",
    "export const r = Math['random']();",
    "nonWeb",
    "no-restricted-syntax",
  ],
  [
    "Math 별칭",
    "const m = Math;\nexport const r = m.random();",
    "nonWeb",
    "no-restricted-syntax",
  ],
];

const allowed = [
  ["상대 import", 'import { a } from "./a.js";\nexport const r = a;', "nonWeb"],
  [
    "상대 re-export",
    'export * from "./a.js";\nexport { b } from "../b.js";',
    "nonWeb",
  ],
  ["상대 동적 import", 'export const r = () => import("./x.js");', "nonWeb"],
  ["web의 document", "export const r = () => document.title;", "web"],
  [
    "web의 window와 navigator",
    "export const r = () => window.navigator.userAgent;",
    "web",
  ],
  [
    "하한 이하 globalThis(71)",
    "export const r = () => globalThis.Array;",
    "nonWeb",
  ],
  [
    "globalThis의 허용된 전역",
    "export const r = () => globalThis.Promise;",
    "web",
  ],
  [
    "web의 globalThis.document",
    "export const r = () => globalThis.document.title;",
    "web",
  ],
  [
    "web의 globalThis.navigator",
    "export const r = () => globalThis.navigator;",
    "web",
  ],
  [
    "web의 globalThis.window",
    "export const r = () => globalThis.window;",
    "web",
  ],
  ["하한 이하 API", "export const r = [1].map((v) => v + 1);", "nonWeb"],
];

describe("escompat 게이트: 금지 seed", () => {
  for (const [name, code, area, rule] of forbidden) {
    it(`${name}은(는) ${area} 경로에서 ${rule}로 실패한다`, async () => {
      const ruleIds = await lintSeed(code, area);
      assert.ok(ruleIds.includes(rule), `기대 규칙 ${rule}, 실제 ${ruleIds}`);
    });
  }

  it("eslint-disable 주석이 붙어도 금지 seed는 실패한다", async () => {
    for (const [, code, area, rule] of forbidden) {
      const ruleIds = await lintSeed(`/* eslint-disable */\n${code}`, area);
      assert.ok(ruleIds.includes(rule), `기대 규칙 ${rule}, 실제 ${ruleIds}`);
    }
  });

  it("eslint-disable-next-line 주석으로도 우회하지 못한다", async () => {
    const ruleIds = await lintSeed(
      "// eslint-disable-next-line no-restricted-globals\nexport const r = () => document.title;",
      "nonWeb",
    );
    assert.deepEqual(ruleIds, ["no-restricted-globals"]);
  });
});

describe("escompat 게이트: 허용 seed", () => {
  for (const [name, code, area] of allowed) {
    it(`${name}은(는) ${area} 경로에서 통과한다`, async () => {
      assert.deepEqual(await lintSeed(code, area), []);
    });
  }
});

describe("escompat 게이트: 하한에 따른 규칙 파생", () => {
  const allSettled = "export const r = Promise.allSettled([]);";

  it("하한 76이면 Promise.allSettled가 통과한다", async () => {
    const ruleIds = await lintSeed(allSettled, "nonWeb", {
      chromeFloor: 76,
      esTarget: "ES2019",
    });
    assert.deepEqual(ruleIds, []);
  });

  it("하한 76이어도 Array.prototype.at(92)는 계속 실패한다", async () => {
    const ruleIds = await lintSeed(
      "export const r = (a) => a.at(0);",
      "nonWeb",
      {
        chromeFloor: 76,
        esTarget: "ES2019",
      },
    );
    assert.ok(ruleIds.includes("es-x/no-array-prototype-at"));
  });

  it("하한 93이면 Array.prototype.at과 Object.hasOwn이 통과한다", async () => {
    const baseline = { chromeFloor: 93, esTarget: "ES2019" };
    assert.deepEqual(
      await lintSeed("export const r = (a) => a.at(0);", "nonWeb", baseline),
      [],
    );
    assert.deepEqual(
      await lintSeed(
        "export const r = Object.hasOwn({}, 'a');",
        "nonWeb",
        baseline,
      ),
      [],
    );
  });

  it("실제 baseline.json의 하한에서도 하한 초과 seed가 실패한다", async () => {
    const baseline = loadBaseline(realRepoRoot);
    assert.ok(
      baseline.chromeFloor < 92,
      `chromeFloor가 ${baseline.chromeFloor}로 올라 Array.prototype.at(92) seed가 유효하지 않다. seed를 하한 초과 API로 갱신한다`,
    );
    const ruleIds = await lintSeed(
      "export const r = (a) => a.at(0);",
      "nonWeb",
      baseline,
    );
    assert.ok(ruleIds.includes("es-x/no-array-prototype-at"));
  });
});
