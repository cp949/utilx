/** 확장자를 나누는 `.`의 위치. 확장자가 없으면 `-1`이다. */
export function extensionDotIndex(fileName: string): number {
  const index = fileName.lastIndexOf(".");
  return index > 0 && index < fileName.length - 1 ? index : -1;
}
