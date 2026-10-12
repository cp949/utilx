import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";
import {
  restrictedRules,
  webRestrictedRules,
} from "../../lint/restricted-rules.js";

export default tseslint.config(
  { ignores: ["dist/**"] },
  js.configs.recommended,
  {
    files: ["src/**/*.ts", "test/**/*.ts"],
    extends: [tseslint.configs.recommendedTypeChecked],
    languageOptions: {
      parserOptions: {
        // src와 test가 tsconfig.json(src만)·tsconfig.test.json(src+test)으로 나뉜다.
        project: ["tsconfig.json", "tsconfig.test.json"],
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  { files: ["src/**/*.ts"], rules: restrictedRules },
  { files: ["src/web/**/*.ts"], rules: webRestrictedRules },
  {
    files: ["test/**/*.ts"],
    languageOptions: { globals: { ...globals.node } },
  },
);
