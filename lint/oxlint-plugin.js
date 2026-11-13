/**
 * oxlint용 로컬 plugin. oxlint에 없는 ESLint 코어 규칙 `no-restricted-syntax`를 같은 옵션 형식으로 제공한다.
 *
 * 옵션은 `lint/restricted-rules.js`가 소스 lint와 dist 게이트에 공유하는 `{ selector, message }` 목록이다.
 * 문자열 선택자도 ESLint와 같이 받는다.
 */
const plugin = {
  meta: { name: "repo" },
  rules: {
    "no-restricted-syntax": {
      meta: { type: "problem", schema: false },
      create(context) {
        const listeners = {};
        for (const option of context.options) {
          const { selector, message } =
            typeof option === "string"
              ? { selector: option, message: undefined }
              : option;
          // 같은 선택자가 여러 번 나오면 마지막 항목이 이긴다. 선택자는 목록 안에서 유일하게 둔다.
          listeners[selector] = (node) => {
            context.report({
              node,
              message:
                message ?? `허용하지 않는 구문이다(selector: ${selector})`,
            });
          };
        }
        return listeners;
      },
    },
  },
};

export default plugin;
