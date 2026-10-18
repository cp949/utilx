/**
 * 성질 검사용 입력 열거 도구.
 * 기본 검사는 작은 입력 공간을 전부 돌리므로 난수와 seed가 필요 없다.
 */

/** `alphabet`의 원소로 만든 길이 `0..maxLength`의 모든 배열. */
export function* sequencesOf<T>(
  alphabet: readonly T[],
  maxLength: number,
): Generator<T[]> {
  yield [];
  if (maxLength === 0) return;
  for (const tail of sequencesOf(alphabet, maxLength - 1)) {
    for (const head of alphabet) yield [head, ...tail];
  }
}

/** `alphabet`의 원소로 만든 길이가 정확히 `length`인 모든 배열. */
export function* tuplesOf<T>(
  alphabet: readonly T[],
  length: number,
): Generator<T[]> {
  if (length === 0) {
    yield [];
    return;
  }
  for (const tail of tuplesOf(alphabet, length - 1)) {
    for (const head of alphabet) yield [head, ...tail];
  }
}

/** 입력 하나가 성질을 어기면 그 입력을 메시지에 담아 던진다. 검사한 입력 개수를 돌려준다. */
export function forEachCase<T>(
  cases: Iterable<T>,
  describeCase: (input: T) => string,
  check: (input: T) => void,
): number {
  let count = 0;
  for (const input of cases) {
    count += 1;
    try {
      check(input);
    } catch (error) {
      const reason = error instanceof Error ? error.message : String(error);
      // lib이 ES2019라 Error 생성자의 cause 옵션 타입이 없다. 원인은 속성으로 붙인다.
      throw Object.assign(
        new Error(`성질 위반 입력: ${describeCase(input)}\n${reason}`),
        { cause: error },
      );
    }
  }
  return count;
}

/** 입력을 JSON처럼 읽기 쉽게 적는다. `undefined`·`NaN`·`Infinity`·빈 슬롯도 구분해 보인다. */
export function show(value: unknown): string {
  if (Array.isArray(value)) {
    const parts: string[] = [];
    for (let index = 0; index < value.length; index += 1) {
      parts.push(index in value ? show(value[index]) : "<빈 슬롯>");
    }
    return `[${parts.join(", ")}]`;
  }
  if (typeof value === "symbol") return value.toString();
  if (typeof value === "string") return JSON.stringify(value);
  if (Object.is(value, -0)) return "-0";
  return String(value);
}
