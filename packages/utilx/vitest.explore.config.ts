import { defineConfig } from "vitest/config";

// 큰 탐색은 실행마다 seed를 새로 뽑는다. 실패하면 이 seed로 같은 입력을 재현한다.
// 설정 파일은 한 번만 평가되므로 모든 테스트 파일이 같은 seed를 쓴다.
const seed =
  process.env.EXPLORE_SEED ?? String(Math.floor(Math.random() * 2 ** 31));
const runs = process.env.EXPLORE_RUNS ?? "1000";
console.log(
  `[explore] seed=${seed} runs=${runs} (재현: EXPLORE_SEED=${seed} EXPLORE_RUNS=${runs} pnpm test:explore)`,
);

export default defineConfig({
  test: {
    name: "utilx-explore",
    environment: "node",
    include: ["test/explore/**/*.explore.ts"],
    setupFiles: ["test/explore/setup.ts"],
    env: { EXPLORE_SEED: seed, EXPLORE_RUNS: runs },
    // 탐색 횟수를 늘려도 시간 초과로 끊기지 않게 한다.
    testTimeout: 10 * 60 * 1000,
    unstubGlobals: true,
    restoreMocks: true,
  },
});
