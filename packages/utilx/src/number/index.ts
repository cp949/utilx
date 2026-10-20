/**
 * 문자열을 수로 바꾸는 유틸이다. 바꿀 수 없으면 예외 대신 `undefined`를 돌려준다.
 *
 * 허용하는 표기는 `isNumericString`과 같은 10진수다. 지수(`1e3`), 16진수(`0x10`), `Infinity`, `NaN`,
 * 천 단위 구분자(`1,234`)는 받지 않는다. `parseInt`처럼 뒤쪽의 숫자가 아닌 문자를 무시하지도 않는다.
 */

export * from "./parseIntegerOrUndefined.js";
export * from "./parseNumberOrUndefined.js";

/**
 * 수를 범위 안으로 맞추는 유틸이다.
 */
export * from "./clamp.js";
