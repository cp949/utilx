import { capitalize } from "./capitalize.js";

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
