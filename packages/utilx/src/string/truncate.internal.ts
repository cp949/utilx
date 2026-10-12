export function assertLength(value: number, name: string): void {
  if (!Number.isInteger(value) || value < 0) {
    throw new RangeError(`${name}은 0 이상의 정수여야 한다: ${value}`);
  }
}

export function isHighSurrogate(code: number): boolean {
  return code >= 0xd800 && code <= 0xdbff;
}

export function isLowSurrogate(code: number): boolean {
  return code >= 0xdc00 && code <= 0xdfff;
}

/** `index`가 서로게이트 쌍(이모지 등) 한가운데면 쌍 앞으로 옮긴다. */
export function cutBefore(text: string, index: number): number {
  if (
    index > 0 &&
    index < text.length &&
    isHighSurrogate(text.charCodeAt(index - 1)) &&
    isLowSurrogate(text.charCodeAt(index))
  ) {
    return index - 1;
  }
  return index;
}
