import { isPlainObject } from "../type/isPlainObject.js";
import { hasOwn } from "./hasOwn.internal.js";

const tagOf = (value: object): string => Object.prototype.toString.call(value);

function isDeepEqualInternal(
  a: unknown,
  b: unknown,
  comparing: Map<object, Set<object>>,
): boolean {
  if (Object.is(a, b)) return true;
  if (
    typeof a !== "object" ||
    typeof b !== "object" ||
    a === null ||
    b === null
  ) {
    return false;
  }

  // 순환 참조: 이미 만난 쌍을 다시 만나면 지금까지 다르지 않았으므로 같다고 본다.
  // 왼쪽 객체마다 여러 상대를 기록해야 한다. 하나만 기록하면 길이가 다른 순환에서 덮어써져 끝나지 않는다.
  // 쌍은 호출이 끝날 때까지 지우지 않는다. 다르다는 결과는 바로 최상위까지 반환되므로 결과가 틀어지지 않는다.
  let partners = comparing.get(a);
  if (partners === undefined) {
    partners = new Set();
    comparing.set(a, partners);
  } else if (partners.has(b)) {
    return true;
  }
  partners.add(b);

  if (Array.isArray(a) || Array.isArray(b)) {
    if (!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length) {
      return false;
    }
    for (let index = 0; index < a.length; index += 1) {
      if (!isDeepEqualInternal(a[index], b[index], comparing)) return false;
    }
    return true;
  }

  const tag = tagOf(a);
  if (tag !== tagOf(b)) return false;

  if (tag === "[object Date]") {
    return Object.is((a as Date).getTime(), (b as Date).getTime());
  }
  if (tag === "[object RegExp]") {
    const regexA = a as RegExp;
    const regexB = b as RegExp;
    return regexA.source === regexB.source && regexA.flags === regexB.flags;
  }
  if (tag === "[object Map]") {
    const mapA = a as Map<unknown, unknown>;
    const mapB = b as Map<unknown, unknown>;
    if (mapA.size !== mapB.size) return false;
    for (const [key, value] of mapA) {
      if (
        !mapB.has(key) ||
        !isDeepEqualInternal(value, mapB.get(key), comparing)
      ) {
        return false;
      }
    }
    return true;
  }
  if (tag === "[object Set]") {
    // 요소는 SameValueZero로 비교한다(요소가 객체이면 같은 참조여야 한다).
    const setA = a as Set<unknown>;
    const setB = b as Set<unknown>;
    if (setA.size !== setB.size) return false;
    for (const value of setA) {
      if (!setB.has(value)) return false;
    }
    return true;
  }

  if (!isPlainObject(a) || !isPlainObject(b)) return false;

  const keys = Object.keys(a);
  if (keys.length !== Object.keys(b).length) return false;
  return keys.every(
    (key) => hasOwn(b, key) && isDeepEqualInternal(a[key], b[key], comparing),
  );
}

/**
 * 중첩된 배열, 평범한 객체, `Date`, `RegExp`, `Map`(값은 깊게 비교)을 재귀적으로 비교한다.
 * 순환 참조도 처리한다. 순환 길이가 달라도 펼친 값이 같으면 같다고 본다. `Set`의 요소는 깊게 비교하지 않고 `SameValueZero`로 비교한다.
 *
 * @example
 * isDeepEqual({ a: [1, { b: 2 }] }, { a: [1, { b: 2 }] }); // true
 * isDeepEqual(new Date(1), new Date(2)); // false
 * isDeepEqual(new Map([['k', { v: 1 }]]), new Map([['k', { v: 1 }]])); // true
 */
export function isDeepEqual(a: unknown, b: unknown): boolean {
  return isDeepEqualInternal(a, b, new Map());
}
