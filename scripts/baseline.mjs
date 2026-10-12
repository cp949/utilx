import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

/** 이 스크립트가 속한 저장소의 루트. */
const defaultRepoRoot = fileURLToPath(new URL("..", import.meta.url));

const KNOWN_KEYS = ["chromeFloor", "esTarget"];

const isPlainObject = (value) =>
  typeof value === "object" && value !== null && !Array.isArray(value);

/**
 * baseline.json에서 읽은 값을 검증해 돌려준다. 허용 목록에 없는 키는 오타를 조용히 넘기지 않도록 실패한다.
 *
 * @param {unknown} value
 * @returns {{ chromeFloor: number, esTarget: string }}
 */
export function parseBaseline(value) {
  if (!isPlainObject(value)) {
    throw new Error("baseline은 객체여야 한다");
  }
  for (const key of Object.keys(value)) {
    if (!KNOWN_KEYS.includes(key)) {
      throw new Error(`baseline에 알 수 없는 키가 있다: ${key}`);
    }
  }

  const { chromeFloor, esTarget } = value;
  if (!Number.isSafeInteger(chromeFloor) || chromeFloor <= 0) {
    throw new Error("chromeFloor는 양의 정수여야 한다");
  }
  if (typeof esTarget !== "string" || !/^ES\d{4}$/.test(esTarget)) {
    throw new Error("esTarget은 `ES2019` 같은 형식의 문자열이어야 한다");
  }
  return { chromeFloor, esTarget };
}

/**
 * 저장소 루트의 baseline.json을 읽어 검증한다. 모든 게이트가 이 함수로 Chrome 하한을 읽는다.
 *
 * @param {string} [repoRoot]
 */
export function loadBaseline(repoRoot = defaultRepoRoot) {
  const file = join(repoRoot, "baseline.json");

  let parsed;
  try {
    parsed = JSON.parse(readFileSync(file, "utf8"));
  } catch (cause) {
    throw new Error(`${file}을 읽을 수 없다: ${cause.message}`, { cause });
  }

  try {
    return parseBaseline(parsed);
  } catch (cause) {
    throw new Error(`${file}: ${cause.message}`, { cause });
  }
}
