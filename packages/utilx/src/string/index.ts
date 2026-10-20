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
 * `isVisuallyBlank`, `isNotVisuallyBlank`는 제로 너비 문자 같은 보이지 않는 문자도 공백으로 본다.
 */
export * from "./isBlank.js";
export * from "./isNotBlank.js";
export * from "./isNotVisuallyBlank.js";
export * from "./isVisuallyBlank.js";
export * from "./trim.js";
export * from "./trimToUndefined.js";

/**
 * 여러 후보 중 값이 있는 첫 문자열을 고르는 유틸이다.
 */
export * from "./firstNotBlank.js";
export * from "./firstNotEmpty.js";

/**
 * 문자열을 구분자 기준으로 나누거나 구분자 앞뒤의 부분 문자열을 꺼내는 유틸이다.
 * 구분자는 여러 글자여도 되고, 빈 구분자는 없는 것으로 본다.
 */
export * from "./splitFirst.js";
export * from "./splitLast.js";
export * from "./substringAfter.js";
export * from "./substringAfterLast.js";
export * from "./substringBefore.js";
export * from "./substringBeforeLast.js";

/**
 * HTML 텍스트나 정규식 패턴에 문자열을 글자 그대로 넣기 위해 이스케이프하는 유틸이다.
 */
export * from "./escapeHtml.js";
export * from "./escapeStringRegexp.js";
