import { pascalCase } from "./pascalCase.js";

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
