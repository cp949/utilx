import { isPlainObject } from "../type/isPlainObject.js";
import { hasOwn } from "./hasOwn.internal.js";

/**
 * 한 단계만 비교한다. 배열은 같은 인덱스의 요소를, 평범한 객체는 같은 키의 값을 `Object.is`로 비교한다.
 * React의 props 비교처럼 값 하나하나가 이미 안정된 참조일 때 쓴다.
 *
 * @example
 * isShallowEqual({ a: 1, b: [1] }, { a: 1, b: [1] }); // false (b는 서로 다른 배열)
 * isShallowEqual({ a: 1 }, { a: 1 }); // true
 * isShallowEqual([1, 2], [1, 2]); // true
 */
export function isShallowEqual(a: unknown, b: unknown): boolean {
  if (Object.is(a, b)) return true;
  if (
    typeof a !== "object" ||
    typeof b !== "object" ||
    a === null ||
    b === null
  ) {
    return false;
  }

  if (Array.isArray(a) || Array.isArray(b)) {
    if (!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length) {
      return false;
    }
    for (let index = 0; index < a.length; index += 1) {
      if (!Object.is(a[index], b[index])) return false;
    }
    return true;
  }

  if (!isPlainObject(a) || !isPlainObject(b)) return false;

  const keys = Object.keys(a);
  if (keys.length !== Object.keys(b).length) return false;
  return keys.every((key) => hasOwn(b, key) && Object.is(a[key], b[key]));
}
