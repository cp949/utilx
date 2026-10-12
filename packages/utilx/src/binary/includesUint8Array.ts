import { indexOfUint8Array } from "./indexOfUint8Array.js";

/**
 * `array` 안에 바이트열 `search`가 있으면 `true`다. `Uint8Array#includes`는 숫자 하나만 받으므로
 * 바이트열 검색에는 이 함수를 쓴다.
 *
 * @example
 * includesUint8Array(new Uint8Array([1, 2, 3]), new Uint8Array([2, 3])); // true
 */
export function includesUint8Array(
  array: Uint8Array,
  search: Uint8Array,
): boolean {
  return indexOfUint8Array(array, search) !== -1;
}
