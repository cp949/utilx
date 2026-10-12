import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    name: "utilx",
    environment: "node",
    include: ["test/**/*.test.ts"],
    // 전역 stub과 spy를 테스트마다 자동으로 되돌려 상태를 남기지 않는다.
    unstubGlobals: true,
    restoreMocks: true,
  },
});
