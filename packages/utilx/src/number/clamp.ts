/**
 * `value`를 `min` 이상 `max` 이하로 맞춘다.
 *
 * `value`가 `NaN`이면 `NaN`이다. `min`, `max`에는 `Infinity`를 쓸 수 있다.
 * `min > max`이면 두 값을 바꿔서 처리한다. `min`, `max`가 계산된 값이어도 순서를 따로 맞추지 않아도 된다.
 *
 * @throws {RangeError} `min` 또는 `max`가 `NaN`일 때
 *
 * @example
 * clamp(15, 0, 10); // 10
 * clamp(-3, 0, 10); // 0
 * clamp(5, 0, 10); // 5
 * clamp(5, 0, Infinity); // 5
 * clamp(15, 10, 0); // 10 (clamp(15, 0, 10)과 같다)
 */
export function clamp(value: number, min: number, max: number): number {
  if (Number.isNaN(min) || Number.isNaN(max)) {
    throw new RangeError("min과 max는 NaN일 수 없다");
  }
  const lower = min <= max ? min : max;
  const upper = min <= max ? max : min;
  return value < lower ? lower : value > upper ? upper : value;
}
