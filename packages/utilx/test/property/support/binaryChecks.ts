import assert from "node:assert/strict";
import {
  base64ToUint8Array,
  hexToUint8Array,
  toUint8Array,
  uint8ArrayToBase64,
  uint8ArrayToHex,
} from "../../../src/binary/index.js";

/** 뷰 앞뒤 바이트. 변환이 뷰 바깥을 읽으면 결과가 달라지도록 0이 아닌 값을 쓴다. */
const GUARD_BEFORE = 0xaa;
const GUARD_AFTER = 0x55;

/** `bytes`를 `byteOffset`에서 시작하는 `Uint8Array` 뷰로 만든다. 뷰 앞뒤에는 다른 바이트가 있다. */
export function viewAt(
  bytes: readonly number[],
  byteOffset: number,
): Uint8Array {
  const raw = new Uint8Array(byteOffset + bytes.length + 3);
  raw.fill(GUARD_AFTER);
  raw.fill(GUARD_BEFORE, 0, byteOffset);
  raw.set(bytes, byteOffset);
  return new Uint8Array(raw.buffer, byteOffset, bytes.length);
}

function bytesOf(array: Uint8Array): number[] {
  return Array.from(array);
}

/** Base64·hex 왕복, 인코딩 형식, `byteOffset`이 있는 뷰와 복사본의 변환 결과 일치. */
export function checkRoundTrip(
  bytes: readonly number[],
  byteOffset: number,
): void {
  const view = viewAt(bytes, byteOffset);
  const copy = Uint8Array.from(bytes);

  const standard = uint8ArrayToBase64(view);
  const urlSafe = uint8ArrayToBase64(view, { urlSafe: true });
  const hex = uint8ArrayToHex(view);

  assert.equal(
    standard,
    uint8ArrayToBase64(copy),
    "뷰와 복사본의 base64가 같다",
  );
  assert.equal(urlSafe, uint8ArrayToBase64(copy, { urlSafe: true }));
  assert.equal(hex, uint8ArrayToHex(copy), "뷰와 복사본의 hex가 같다");

  // Node의 Buffer 인코딩을 독립된 기준으로 쓴다. 작은 Buffer는 풀링되어 byteOffset이 0이 아닐 수 있다.
  const pooled = Buffer.from(bytes);
  assert.equal(
    standard,
    pooled.toString("base64"),
    "Buffer 인코딩과 base64가 같다",
  );
  assert.equal(
    urlSafe,
    pooled.toString("base64url"),
    "Buffer 인코딩과 URL-safe base64가 같다",
  );
  assert.equal(hex, pooled.toString("hex"), "Buffer 인코딩과 hex가 같다");
  assert.equal(
    uint8ArrayToBase64(pooled),
    standard,
    "Buffer 입력도 같은 base64다",
  );
  assert.equal(uint8ArrayToHex(pooled), hex, "Buffer 입력도 같은 hex다");

  assert.match(standard, /^[A-Za-z0-9+/]*={0,2}$/, "일반 base64 형식");
  assert.equal(standard.length % 4, 0, "일반 base64는 패딩으로 4의 배수다");
  assert.match(
    urlSafe,
    /^[A-Za-z0-9_-]*$/,
    "URL-safe base64에는 패딩과 +/가 없다",
  );
  assert.match(hex, /^[0-9a-f]*$/, "hex는 소문자다");
  assert.equal(hex.length, bytes.length * 2);
  if (bytes.length === 0) {
    assert.deepEqual(
      [standard, urlSafe, hex],
      ["", "", ""],
      "빈 입력은 빈 문자열이다",
    );
  }

  assert.deepEqual(bytesOf(base64ToUint8Array(standard)), bytes, "base64 왕복");
  assert.deepEqual(
    bytesOf(base64ToUint8Array(urlSafe)),
    bytes,
    "URL-safe base64 왕복",
  );
  assert.deepEqual(bytesOf(hexToUint8Array(hex)), bytes, "hex 왕복");
  assert.deepEqual(
    bytesOf(hexToUint8Array(hex.toUpperCase())),
    bytes,
    "대문자 hex도 받는다",
  );
}

/** `toUint8Array`가 복사 없이 같은 메모리 구간을 가리킨다. */
export type ViewKind = "Uint8Array" | "Uint16Array" | "DataView" | "Buffer";

export function checkToUint8Array(
  byteLength: number,
  byteOffset: number,
  kind: ViewKind,
): void {
  const unit = kind === "Uint16Array" ? 2 : 1;
  assert.equal(byteLength % unit, 0, "검사 입력은 요소 크기의 배수여야 한다");
  const backing = new Uint8Array(byteOffset + byteLength + 4);
  backing.forEach((_, index) => {
    backing[index] = (index * 37 + 11) & 0xff;
  });
  const { buffer } = backing;
  const view: ArrayBufferView =
    kind === "Uint8Array"
      ? new Uint8Array(buffer, byteOffset, byteLength)
      : kind === "Uint16Array"
        ? new Uint16Array(buffer, byteOffset, byteLength / 2)
        : kind === "DataView"
          ? new DataView(buffer, byteOffset, byteLength)
          : Buffer.from(buffer, byteOffset, byteLength);

  const result = toUint8Array(view);
  assert.equal(result.buffer, buffer, "복사하지 않고 같은 ArrayBuffer를 쓴다");
  assert.equal(result.byteOffset, byteOffset);
  assert.equal(result.byteLength, byteLength);
  assert.deepEqual(
    bytesOf(result),
    bytesOf(backing.subarray(byteOffset, byteOffset + byteLength)),
    "뷰 구간의 바이트만 담는다",
  );
}

const HEX_STRING = /^(?:[0-9a-fA-F]{2})*$/;

/** hex 문자열이 유효하면 변환하고, 아니면 `RangeError`를 던진다. */
export function checkHexInput(text: string): void {
  if (HEX_STRING.test(text)) {
    const bytes = hexToUint8Array(text);
    assert.equal(bytes.length, text.length / 2);
    assert.equal(
      uint8ArrayToHex(bytes),
      text.toLowerCase(),
      "유효한 hex는 소문자로 왕복한다",
    );
  } else {
    assert.throws(() => hexToUint8Array(text), RangeError);
  }
}

/**
 * base64 문자열은 바이트가 되거나 `InvalidCharacterError`를 던진다.
 * 바이트가 되면 다시 인코딩한 뒤 디코딩해도 같고, `-`·`_` 표기는 `+`·`/` 표기와 같은 바이트다.
 */
export function checkBase64Input(text: string): void {
  let bytes: Uint8Array;
  try {
    bytes = base64ToUint8Array(text);
  } catch (error) {
    assert.ok(
      error instanceof DOMException && error.name === "InvalidCharacterError",
      `잘못된 base64는 InvalidCharacterError여야 한다: ${String(error)}`,
    );
    return;
  }
  assert.ok(!text.includes("!"), "base64 문자가 아닌 문자가 있으면 던진다");
  assert.deepEqual(
    bytesOf(base64ToUint8Array(uint8ArrayToBase64(bytes))),
    bytesOf(bytes),
  );
  assert.deepEqual(
    bytesOf(base64ToUint8Array(text.replace(/-/g, "+").replace(/_/g, "/"))),
    bytesOf(bytes),
    "URL-safe 표기와 일반 표기가 같은 바이트다",
  );
}

/** `ArrayBuffer`도 view도 아닌 값은 `TypeError`다. */
export function checkRejectedByToUint8Array(value: unknown): void {
  assert.throws(() => toUint8Array(value as ArrayBuffer), TypeError);
}
