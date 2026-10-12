/**
 * 라이브러리 소스와 배포물 게이트(`scripts/check-escompat.mjs`)가 함께 쓰는 환경 제한 규칙.
 *
 * - `src/**`는 Node 전역, Chrome 75에 없는 API, `Math.random`, 외부 import를 쓰지 못한다.
 * - DOM 전역(window, document 등)은 `src/web/**`에서만 허용한다.
 */

const domMessage =
  "DOM 전역은 `web` subpath(src/web)에서만 쓸 수 있다. 다른 subpath는 DOM 없이 동작해야 한다";
const nodeMessage = "Chrome 75 라이브러리 소스에서 쓸 수 없는 Node 전역이다";

/** 모든 소스에서 금지하는 전역. */
const commonGlobals = [
  ...["Buffer", "process", "require"].map((name) => ({
    name,
    message: nodeMessage,
  })),
  {
    name: "structuredClone",
    message: "Chrome 98+ API라서 Chrome 75 하한에서 쓸 수 없다",
  },
];

/** `web` 밖에서 추가로 금지하는 DOM 전역. */
const domGlobals = ["window", "document", "navigator", "self"].map((name) => ({
  name,
  message: domMessage,
}));

const restrictedProperties = [
  {
    object: "Math",
    property: "random",
    message: "Math.random은 패키지 어디에서도 호출하지 않는다",
  },
  {
    property: "randomUUID",
    message: "randomUUID는 Chrome 92+ API라서 사용하지 않는다",
  },
];

/** `Math`를 통해 random에 우회 접근하는 형태와 계산된 동적 import를 막는 선택자. */
const restrictedSyntax = [
  {
    selector: "MemberExpression[object.name='Math'][computed=true]",
    message: "Math의 계산된 속성 접근은 금지한다(Math.random을 우회할 수 있다)",
  },
  {
    selector: "VariableDeclarator[init.name='Math']",
    message: "Math를 다른 변수에 담거나 구조 분해하지 않는다",
  },
  {
    selector: "AssignmentExpression[right.name='Math']",
    message: "Math를 다른 변수에 재할당하지 않는다",
  },
  {
    selector: "ImportExpression[source.type!='Literal']",
    message: "계산된 동적 import는 금지한다(런타임 의존성 0)",
  },
  {
    selector: "ImportExpression[source.value=/^[^./]/]",
    message: "외부 패키지의 동적 import는 금지한다(런타임 의존성 0)",
  },
];

/** 상대 경로가 아닌 모든 import(패키지, `node:*`)를 막아 런타임 의존성 0을 소스에서 강제한다. */
const restrictedImports = [
  "error",
  {
    patterns: [
      {
        regex: "^[^./]",
        message: "상대 경로가 아닌 import는 금지한다(런타임 의존성 0)",
      },
    ],
  },
];

/**
 * `web`을 제외한 소스에 적용하는 규칙.
 *
 * @type {import("eslint").Linter.RulesRecord}
 */
export const restrictedRules = {
  "no-restricted-globals": ["error", ...commonGlobals, ...domGlobals],
  "no-restricted-properties": ["error", ...restrictedProperties],
  "no-restricted-syntax": ["error", ...restrictedSyntax],
  "no-restricted-imports": restrictedImports,
};

/**
 * `web` subpath에 적용하는 규칙. DOM 전역만 풀고 나머지는 같다.
 *
 * @type {import("eslint").Linter.RulesRecord}
 */
export const webRestrictedRules = {
  ...restrictedRules,
  "no-restricted-globals": ["error", ...commonGlobals],
};
