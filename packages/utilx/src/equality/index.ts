/**
 * 값이 같은지 비교하는 유틸이다.
 *
 * 두 함수 모두 "확신할 수 없으면 다르다"는 쪽으로 판정한다. 같은 참조가 아닌 `Date`, `Map`, `Set`, `RegExp`,
 * 평범한 객체, 배열 이외의 객체(클래스 인스턴스, 함수, TypedArray 등)는 같은 참조일 때만 같다.
 * 값 비교는 `Object.is`이므로 `NaN`끼리는 같고 `+0`과 `-0`은 다르다. 심볼 키는 비교하지 않는다.
 */

export * from "./isDeepEqual.js";
export * from "./isShallowEqual.js";
