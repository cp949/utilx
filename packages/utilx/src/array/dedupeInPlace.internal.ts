/** 키가 처음 나온 항목만 남기도록 제자리에서 걸러 낸다. 순서는 유지한다. */
export function dedupeInPlace<T>(arr: T[], keyOf: (item: T) => unknown): void {
  const seen = new Set<unknown>();
  let write = 0;
  for (let read = 0; read < arr.length; read++) {
    const item = arr[read] as T;
    const key = keyOf(item);
    if (seen.has(key)) continue;
    seen.add(key);
    arr[write++] = item;
  }
  arr.length = write;
}
