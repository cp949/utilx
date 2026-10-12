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
