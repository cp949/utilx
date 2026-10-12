/** 수정 대상 배열. `inplace`면 원본, 아니면 복사본이다. */
export function workingArray<T>(
  arr: readonly T[],
  options: { readonly inplace: boolean },
): T[] {
  return options.inplace ? (arr as T[]) : [...arr];
}
