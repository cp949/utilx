/** `[start, end)` 구간을 제자리에서 뒤집는다. */
export function reverseRange<T>(arr: T[], start: number, end: number): void {
  for (let i = start, j = end - 1; i < j; i++, j--) {
    const tmp = arr[i] as T;
    arr[i] = arr[j] as T;
    arr[j] = tmp;
  }
}

/** 배열을 왼쪽으로 `count`칸 제자리에서 돌린다. 음수는 오른쪽이다. */
export function rotateLeftInPlace<T>(arr: T[], count: number): void {
  if (!Number.isInteger(count)) {
    throw new RangeError("count는 정수여야 한다");
  }
  const length = arr.length;
  if (length < 2) return;
  const k = ((count % length) + length) % length;
  if (k === 0) return;
  // 세 번 뒤집으면 추가 메모리 없이 돌아간다.
  reverseRange(arr, 0, k);
  reverseRange(arr, k, length);
  reverseRange(arr, 0, length);
}
