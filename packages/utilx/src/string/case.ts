/**
 * 문자열의 대소문자 표기를 바꾸는 유틸이다. 로캘을 따르지 않는다(`toUpperCase`, `toLowerCase`와 같다).
 */

/**
 * 첫 글자를 대문자로 바꾼다. 나머지는 그대로 둔다. 빈 문자열은 빈 문자열이다.
 *
 * @example
 * capitalize('fooBar'); // 'FooBar'
 */
export function capitalize(text: string): string {
  const [first = ""] = text;
  return first.toUpperCase() + text.slice(first.length);
}

/**
 * 첫 글자를 소문자로 바꾼다. 나머지는 그대로 둔다. 빈 문자열은 빈 문자열이다.
 *
 * @example
 * uncapitalize('FooBar'); // 'fooBar'
 */
export function uncapitalize(text: string): string {
  const [first = ""] = text;
  return first.toLowerCase() + text.slice(first.length);
}

/**
 * 각 단어를 소문자로 만든 뒤 첫 글자를 대문자로 바꿔 이어 붙인다. 빈 단어는 무시한다.
 * 약어도 단어 하나로 취급하므로 `'API'`는 `'Api'`가 된다.
 *
 * @example
 * pascalCase('foo', 'bar'); // 'FooBar'
 * pascalCase('API', 'key'); // 'ApiKey'
 */
export function pascalCase(...words: string[]): string {
  return words
    .filter((word) => word.length > 0)
    .map((word) => capitalize(word.toLowerCase()))
    .join("");
}

/**
 * 첫 단어는 모두 소문자로, 나머지는 `pascalCase`로 이어 붙인다. 빈 단어는 무시한다.
 *
 * @example
 * camelCase('foo', 'bar', 'baz'); // 'fooBarBaz'
 * camelCase('FOO', 'bar'); // 'fooBar'
 */
export function camelCase(...words: string[]): string {
  const [first = "", ...rest] = words.filter((word) => word.length > 0);
  return first.toLowerCase() + pascalCase(...rest);
}

/**
 * kebab-case를 PascalCase로 바꾼다. 하이픈으로 나눈 각 단어를 `pascalCase`로 이어 붙인다.
 *
 * @example
 * kebabToPascal('foo-bar'); // 'FooBar'
 */
export function kebabToPascal(kebab: string): string {
  return pascalCase(...kebab.split("-"));
}

/**
 * kebab-case를 CONSTANT_CASE로 바꾼다. 빈 단어는 무시한다.
 *
 * @example
 * kebabToConstant('foo-bar'); // 'FOO_BAR'
 */
export function kebabToConstant(kebab: string): string {
  return kebab
    .split("-")
    .filter((word) => word.length > 0)
    .map((word) => word.toUpperCase())
    .join("_");
}
