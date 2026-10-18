import fc from "fast-check";

function readInteger(name: string, fallback?: number): number {
  const raw = process.env[name];
  if (raw === undefined || raw === "") {
    if (fallback === undefined) throw new Error(`${name}이 필요하다`);
    return fallback;
  }
  const value = Number(raw);
  if (!Number.isSafeInteger(value) || value < 0) {
    throw new Error(`${name}은 0 이상의 정수여야 한다: ${raw}`);
  }
  return value;
}

// 설정 파일(vitest.explore.config.ts)이 정한 seed와 횟수를 fast-check에 적용한다.
// 실패 메시지에 seed와 shrink된 반례가 함께 출력된다.
fc.configureGlobal({
  numRuns: readInteger("EXPLORE_RUNS", 1000),
  seed: readInteger("EXPLORE_SEED"),
});
