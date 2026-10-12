/**
 * 문자열의 앞뒤 일부를 제거하거나 부분 문자열을 바꾸는 유틸이다.
 */
export * from "./RemoveAffixOptions.js";
export * from "./removePrefix.js";
export * from "./removeSuffix.js";
export * from "./removeSurrounding.js";
export * from "./replaceAll.js";

/**
 * 문자열의 대소문자 표기를 바꾸는 유틸이다. 로캘을 따르지 않는다(`toUpperCase`, `toLowerCase`와 같다).
 */
export * from "./camelCase.js";
export * from "./capitalize.js";
export * from "./kebabToConstant.js";
export * from "./kebabToPascal.js";
export * from "./pascalCase.js";
export * from "./uncapitalize.js";

/**
 * 문자열 길이를 재거나 길이에 맞춰 자르는 유틸이다.
 */
export * from "./limitMaxLength.js";
export * from "./strlen.js";
export * from "./truncateMiddle.js";

/**
 * 문자열의 내용을 검사하는 유틸이다. 모두 타입 가드가 아니라 `boolean`을 돌려준다.
 */
export * from "./isDigitString.js";
export * from "./isNumericString.js";

/**
 * 문자열 공백 처리 유틸이다.
 *
 * 공백 기준은 `String.prototype.trim()`과 같다. 전각 공백(U+3000), NBSP(U+00A0), BOM(U+FEFF)도 공백이다.
 */
export * from "./isBlank.js";
export * from "./isNotBlank.js";
export * from "./trim.js";
export * from "./trimToUndefined.js";
