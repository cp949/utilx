/**
 * 라이브러리 소스와 배포물 게이트(`scripts/check-escompat.mjs`)가 함께 쓰는 환경 제한 규칙.
 *
 * - `src/**`는 Node 전역, Chrome 75에 없는 API, `Math.random`, 외부 import를 쓰지 못한다.
 * - DOM 전역(window, document 등)은 `src/web/**`에서만 허용한다.
 * - 전역 객체(`globalThis`, `window`, `self`)를 경유한 금지 전역 접근도 같은 범위로 막는다.
 *   `globalThis`는 속성 접근과 `typeof` 밖에서 값으로 쓰지 못한다.
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

/**
 * 전역 객체를 가리키는 이름. `window`, `self`는 `web`에서만 식별자로 쓸 수 있지만,
 * 쓸 수 있는 곳에서는 `globalThis`와 같은 우회 경로(`window.process`)가 된다.
 */
const globalObjects = ["globalThis", "window", "self"];

/** 전역 객체의 `<name>` 속성 접근(점 표기, 문자열 리터럴 계산 표기)을 고르는 선택자. */
const globalMember = (objects, names) => {
  const name = `/^(?:${names.join("|")})$/`;
  return `MemberExpression[object.name=/^(?:${objects.join("|")})$/]:matches([computed=false][property.name=${name}], [computed=true][property.value=${name}])`;
};

/**
 * `globalThis`가 값으로 쓰이는 위치. 속성 접근의 객체, `typeof`, 타입 위치만 허용하고 나머지(인자, 반환값,
 * 변수·구조 분해·기본값, 배열·객체 리터럴, 쉼표 식, TS 단언)는 모두 고른다. 값으로 빠져나간 전역 객체는
 * 이름 기반 선택자로 더 추적할 수 없어서 위치를 허용 목록으로 제한한다.
 */
const bareGlobalThis = `Identifier[name='globalThis']:not(${[
  "MemberExpression > Identifier.object",
  "MemberExpression[computed=false] > Identifier.property",
  "Property[computed=false][shorthand=false] > Identifier.key",
  "PropertyDefinition[computed=false] > Identifier.key",
  "MethodDefinition[computed=false] > Identifier.key",
  "UnaryExpression[operator='typeof'] > Identifier.argument",
  "TSTypeQuery > Identifier.exprName",
  "TSQualifiedName > Identifier.left",
].join(", ")})`;

/**
 * 전역 식별자 제한(`no-restricted-globals`)은 `globalThis.<name>`으로 같은 전역에 접근하는 경로를 보지 못한다.
 * `Math`는 식별자 제한 대상이 아니지만 `globalThis.Math.random()`으로 우회할 수 있어 함께 막는다.
 */
const globalThisCommonSyntax = [
  {
    selector: globalMember(globalObjects, [
      ...commonGlobals.map(({ name }) => name),
      "Math",
    ]),
    message: `전역 객체를 통해서도 ${nodeMessage}(structuredClone, Math.random 우회 포함)`,
  },
  {
    // `globalThis.globalThis.document`, `globalThis.window.process`처럼 이름 기반 선택자를 한 단계 비껴간다.
    selector: globalMember(globalObjects, globalObjects),
    message:
      "전역 객체에서 전역 객체를 다시 꺼내지 않는다(금지된 전역에 우회 접근할 수 있다)",
  },
  {
    selector: `MemberExpression[object.name=/^(?:${globalObjects.join("|")})$/][computed=true][property.type!='Literal']`,
    message:
      "전역 객체의 계산된 속성 접근은 금지한다(금지된 전역에 우회 접근할 수 있다)",
  },
  {
    selector: bareGlobalThis,
    message:
      "globalThis는 `globalThis.<이름>` 접근과 typeof로만 쓴다. 값으로 넘기거나 담으면 금지된 전역을 우회할 수 있다",
  },
];

/**
 * `web` 밖에서 `globalThis`를 통한 DOM 전역 접근을 막는 선택자.
 * `window`, `self`는 위의 전역 객체 재추출 선택자가 이미 모든 경로에서 막으므로 중복 보고하지 않게 뺀다.
 */
const globalThisDomSyntax = [
  {
    selector: globalMember(
      ["globalThis"],
      domGlobals
        .map(({ name }) => name)
        .filter((name) => !globalObjects.includes(name)),
    ),
    message: `globalThis를 통해서도 ${domMessage}`,
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
  ...globalThisCommonSyntax,
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
  "no-restricted-syntax": [
    "error",
    ...restrictedSyntax,
    ...globalThisDomSyntax,
  ],
  "no-restricted-imports": restrictedImports,
};

/**
 * `web` subpath에 적용하는 규칙. DOM 전역과 `globalThis`의 DOM 접근만 풀고 나머지는 같다.
 *
 * @type {import("eslint").Linter.RulesRecord}
 */
export const webRestrictedRules = {
  ...restrictedRules,
  "no-restricted-globals": ["error", ...commonGlobals],
  "no-restricted-syntax": ["error", ...restrictedSyntax],
};
