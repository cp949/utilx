import { describe, expect, it } from "vitest";
import { clamp } from "../src/number/index.js";

describe("clamp", () => {
  it("범위 안의 값은 그대로 돌려준다", () => {
    expect(clamp(5, 0, 10)).toBe(5);
  });

  it("경계 값은 그대로 돌려준다", () => {
    expect(clamp(0, 0, 10)).toBe(0);
    expect(clamp(10, 0, 10)).toBe(10);
  });

  it("범위를 벗어나면 가까운 경계로 맞춘다", () => {
    expect(clamp(-3, 0, 10)).toBe(0);
    expect(clamp(15, 0, 10)).toBe(10);
  });

  it("음수와 소수 범위를 다룬다", () => {
    expect(clamp(-5, -2.5, -1)).toBe(-2.5);
    expect(clamp(0.7, 0, 0.5)).toBe(0.5);
  });

  it("min과 max가 같으면 그 값이다", () => {
    expect(clamp(100, 3, 3)).toBe(3);
  });

  it("Infinity를 경계로 쓸 수 있다", () => {
    expect(clamp(5, 0, Infinity)).toBe(5);
    expect(clamp(-5, 0, Infinity)).toBe(0);
    expect(clamp(5, -Infinity, 0)).toBe(0);
    expect(clamp(Infinity, 0, 10)).toBe(10);
    expect(clamp(-Infinity, 0, 10)).toBe(0);
  });

  it("value가 NaN이면 NaN이다", () => {
    expect(clamp(NaN, 0, 10)).toBeNaN();
  });

  it("-0은 경계 0과 구분하지 않고 값을 유지한다", () => {
    expect(Object.is(clamp(-0, -1, 1), -0)).toBe(true);
  });

  it("min > max이면 두 값을 바꿔서 처리한다", () => {
    expect(clamp(15, 10, 0)).toBe(10);
    expect(clamp(-3, 10, 0)).toBe(0);
    expect(clamp(5, 10, 0)).toBe(5);
    expect(clamp(5, Infinity, 0)).toBe(5);
    expect(clamp(-5, Infinity, 0)).toBe(0);
  });

  it.each([
    [15, 0, 10],
    [-3, 0, 10],
    [5, 0, 10],
    [0, -2.5, 2.5],
    [NaN, 0, 10],
  ])("clamp(%j, %j, %j)는 min과 max의 순서와 관계없이 같다", (v, a, b) => {
    expect(clamp(v, b, a)).toBe(clamp(v, a, b));
  });

  it("min 또는 max가 NaN이면 RangeError다", () => {
    expect(() => clamp(5, NaN, 10)).toThrow(RangeError);
    expect(() => clamp(5, 0, NaN)).toThrow(RangeError);
  });
});
