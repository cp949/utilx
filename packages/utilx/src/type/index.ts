/**
 * 값의 타입을 좁히는 타입 가드와 단언 모음이다.
 *
 * 모두 `false`일 때 타입이 틀리게 좁혀지지 않는 정확한 가드만 둔다. 그래서 `NaN`을 거르는 `isNumber`나
 * 공백 문자열을 거르는 `isString`은 없다. 그런 판정이 필요하면 가드가 아닌 함수를 따로 쓴다.
 * `null`/`undefined` 판별은 `isNil`, `isNotNil`을 쓴다.
 */

export * from "./invariant.js";
export * from "./isBoolean.js";
export * from "./isError.js";
export * from "./isFunction.js";
export * from "./isNonEmptyArray.js";
export * from "./isNumber.js";
export * from "./isPlainObject.js";
export * from "./isPromiseLike.js";
export * from "./isString.js";
