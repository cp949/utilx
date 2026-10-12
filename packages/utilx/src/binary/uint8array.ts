/**
 * `Uint8Array` 판별, 변환, 비교, 검색 유틸이다.
 *
 * 인자 타입은 TypeScript로 검사한다. 런타임에서 인자 타입을 따로 검사하지 않는다.
 */

/**
 * 값이 `Uint8Array`이면 `true`다. Node의 `Buffer`도 `Uint8Array`의 하위 클래스라 `true`다.
 * 다른 realm(iframe 등)에서 만든 `Uint8Array`도 `true`다.
 *
 * @example
 * isUint8Array(new Uint8Array(2)); // true
 * isUint8Array(new ArrayBuffer(2)); // false
 */
export function isUint8Array(value: unknown): value is Uint8Array {
  if (value instanceof Uint8Array) return true;
  return (
    typeof value === "object" &&
    value !== null &&
    Object.prototype.toString.call(value) === "[object Uint8Array]"
  );
}

/**
 * `ArrayBuffer` 또는 `ArrayBuffer`를 감싼 view(`DataView`, 다른 TypedArray 포함)를 복사 없이
 * `Uint8Array`로 바꾼다. 같은 메모리를 가리키므로 복사본이 필요하면 `.slice()`를 호출한다.
 *
 * `Buffer`를 순수 `Uint8Array`로 바꾸는 데도 쓸 수 있다.
 *
 * @throws {TypeError} `ArrayBuffer`도 view도 아닐 때
 *
 * @example
 * toUint8Array(new Uint16Array([1, 2])); // Uint8Array(4) [1, 0, 2, 0] (리틀 엔디언 환경)
 */
export function toUint8Array(value: ArrayBuffer | ArrayBufferView): Uint8Array {
  if (ArrayBuffer.isView(value)) {
    return new Uint8Array(value.buffer, value.byteOffset, value.byteLength);
  }
  if (
    value instanceof ArrayBuffer ||
    Object.prototype.toString.call(value) === "[object ArrayBuffer]"
  ) {
    return new Uint8Array(value);
  }
  throw new TypeError("ArrayBuffer 또는 ArrayBuffer view여야 한다");
}

/**
 * 여러 `Uint8Array`를 이어 붙인 새 배열을 만든다. 빈 목록이면 길이 0인 배열이다.
 *
 * @example
 * concatUint8Arrays([new Uint8Array([1, 2]), new Uint8Array([3])]); // Uint8Array [1, 2, 3]
 */
export function concatUint8Arrays(arrays: readonly Uint8Array[]): Uint8Array {
  let totalLength = 0;
  for (const array of arrays) totalLength += array.length;

  const result = new Uint8Array(totalLength);
  let offset = 0;
  for (const array of arrays) {
    result.set(array, offset);
    offset += array.length;
  }
  return result;
}

/**
 * 두 배열의 길이와 모든 바이트가 같으면 `true`다.
 *
 * 상수 시간 비교가 아니다. 비밀 값(토큰, MAC 등)을 비교하는 용도로 쓰지 않는다.
 *
 * @example
 * areUint8ArraysEqual(new Uint8Array([1, 2]), new Uint8Array([1, 2])); // true
 */
export function areUint8ArraysEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a === b) return true;
  if (a.length !== b.length) return false;

  for (let index = 0; index < a.length; index += 1) {
    if (a[index] !== b[index]) return false;
  }
  return true;
}

/**
 * 두 배열을 앞에서부터 바이트 단위로 비교해 순서를 돌려준다. `sort`의 비교 함수로 쓴다.
 * 앞부분이 모두 같으면 짧은 배열이 먼저다.
 *
 * @example
 * [new Uint8Array([2]), new Uint8Array([1, 9])].sort(compareUint8Arrays); // [[1, 9], [2]]
 */
export function compareUint8Arrays(a: Uint8Array, b: Uint8Array): -1 | 0 | 1 {
  const length = Math.min(a.length, b.length);
  for (let index = 0; index < length; index += 1) {
    const diff = (a[index] as number) - (b[index] as number);
    if (diff !== 0) return diff < 0 ? -1 : 1;
  }
  if (a.length === b.length) return 0;
  return a.length < b.length ? -1 : 1;
}

/**
 * `array` 안에서 바이트열 `search`가 처음 나오는 위치를 돌려준다. 없으면 `-1`이다.
 * 빈 `search`는 `String.prototype.indexOf`처럼 `0`이다.
 *
 * @example
 * indexOfUint8Array(new Uint8Array([1, 2, 3, 2, 3]), new Uint8Array([2, 3])); // 1
 */
export function indexOfUint8Array(
  array: Uint8Array,
  search: Uint8Array,
): number {
  const lastStart = array.length - search.length;
  for (let start = 0; start <= lastStart; start += 1) {
    let matched = true;
    for (let offset = 0; offset < search.length; offset += 1) {
      if (array[start + offset] !== search[offset]) {
        matched = false;
        break;
      }
    }
    if (matched) return start;
  }
  return -1;
}

/**
 * `array` 안에 바이트열 `search`가 있으면 `true`다. `Uint8Array#includes`는 숫자 하나만 받으므로
 * 바이트열 검색에는 이 함수를 쓴다.
 *
 * @example
 * includesUint8Array(new Uint8Array([1, 2, 3]), new Uint8Array([2, 3])); // true
 */
export function includesUint8Array(
  array: Uint8Array,
  search: Uint8Array,
): boolean {
  return indexOfUint8Array(array, search) !== -1;
}
