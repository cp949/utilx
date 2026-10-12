import { pascalCase } from "./pascalCase.js";

/**
 * kebab-case를 PascalCase로 바꾼다. 하이픈으로 나눈 각 단어를 `pascalCase`로 이어 붙인다.
 *
 * @example
 * kebabToPascal('foo-bar'); // 'FooBar'
 */
export function kebabToPascal(kebab: string): string {
  return pascalCase(...kebab.split("-"));
}
