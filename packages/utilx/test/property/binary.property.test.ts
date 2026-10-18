import { describe, expect, it } from "vitest";
import {
  checkBase64Input,
  checkHexInput,
  checkRejectedByToUint8Array,
  checkRoundTrip,
  checkToUint8Array,
  type ViewKind,
} from "./support/binaryChecks.js";
import { forEachCase, sequencesOf, show } from "./support/enumerate.js";

// 부호 경계(0x7f·0x80)와 양 끝 값을 포함한 바이트 집합.
const BOUNDARY_BYTES = [0x00, 0x01, 0x7f, 0x80, 0xff];
const BYTE_OFFSETS = [0, 1, 2];

describe("바이너리 변환 성질", () => {
  it("길이 0~4 바이트와 byteOffset 0~2에서 base64·hex 왕복이 성립한다", () => {
    const cases = [...sequencesOf(BOUNDARY_BYTES, 4)].flatMap((bytes) =>
      BYTE_OFFSETS.map((byteOffset) => ({ bytes, byteOffset })),
    );
    const count = forEachCase(
      cases,
      (c) => `bytes=${show(c.bytes)}, byteOffset=${c.byteOffset}`,
      (c) => checkRoundTrip(c.bytes, c.byteOffset),
    );
    expect(count).toBe((1 + 5 + 25 + 125 + 625) * 3);
  });

  it("view 종류와 byteOffset 조합에서 toUint8Array는 복사 없이 같은 구간을 가리킨다", () => {
    const kinds: readonly ViewKind[] = [
      "Uint8Array",
      "Uint16Array",
      "DataView",
      "Buffer",
    ];
    const cases = kinds.flatMap((kind) =>
      [0, 1, 2, 3, 4].flatMap((byteLength) =>
        // Uint16Array는 byteOffset과 byteLength가 모두 2의 배수여야 한다.
        BYTE_OFFSETS.filter(
          (byteOffset) => kind !== "Uint16Array" || byteOffset % 2 === 0,
        )
          .filter(() => kind !== "Uint16Array" || byteLength % 2 === 0)
          .map((byteOffset) => ({ kind, byteLength, byteOffset })),
      ),
    );
    const count = forEachCase(
      cases,
      (c) =>
        `${c.kind}, byteLength=${c.byteLength}, byteOffset=${c.byteOffset}`,
      (c) => checkToUint8Array(c.byteLength, c.byteOffset, c.kind),
    );
    // Uint16Array는 길이 0·2·4와 byteOffset 0·2만 가능하다.
    expect(count).toBe(3 * 15 + 3 * 2);
  });

  it("hex 문자열은 짝수 길이의 hex 문자만 변환되고 나머지는 RangeError다", () => {
    const cases = [...sequencesOf(["0", "f", "A", "g", " ", "-"], 4)].map(
      (chars) => chars.join(""),
    );
    const count = forEachCase(
      cases,
      (text) => JSON.stringify(text),
      checkHexInput,
    );
    expect(count).toBe(1 + 6 + 36 + 216 + 1296);
  });

  it("base64 문자열은 바이트가 되거나 InvalidCharacterError이고 공백·끝 패딩·URL-safe 표기와 무관하다", () => {
    const cases = [
      ...sequencesOf(["A", "Q", "=", "-", "_", "+", "/", " ", "\n", "!"], 4),
    ].map((chars) => chars.join(""));
    const count = forEachCase(
      cases,
      (text) => JSON.stringify(text),
      checkBase64Input,
    );
    expect(count).toBe(1 + 10 + 100 + 1000 + 10000);
  });

  it("ArrayBuffer도 view도 아닌 값은 TypeError다", () => {
    const rejected: readonly unknown[] = [
      undefined,
      null,
      0,
      "abc",
      [],
      [1, 2],
      {},
      { buffer: new ArrayBuffer(2), byteOffset: 0, byteLength: 2 },
      () => undefined,
    ];
    const count = forEachCase(rejected, show, checkRejectedByToUint8Array);
    expect(count).toBe(rejected.length);
  });
});
