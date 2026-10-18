import fc from "fast-check";
import { describe, it } from "vitest";
import {
  checkBase64Input,
  checkHexInput,
  checkRoundTrip,
  checkToUint8Array,
  type ViewKind,
} from "../property/support/binaryChecks.js";

const bytes = fc
  .uint8Array({ maxLength: 64 })
  .map((array) => Array.from(array));

describe("바이너리 변환 탐색", () => {
  it("임의 바이트와 byteOffset에서 base64·hex 왕복이 성립한다", () => {
    fc.assert(
      fc.property(bytes, fc.integer({ min: 0, max: 8 }), checkRoundTrip),
    );
  });

  it("임의 view 종류·길이·byteOffset에서 toUint8Array는 같은 구간을 가리킨다", () => {
    const kind = fc.constantFrom<ViewKind>(
      "Uint8Array",
      "Uint16Array",
      "DataView",
      "Buffer",
    );
    fc.assert(
      fc.property(
        kind,
        fc.integer({ min: 0, max: 32 }),
        fc.integer({ min: 0, max: 8 }),
        (k, length, offset) => {
          // Uint16Array는 byteOffset과 byteLength가 2의 배수여야 한다.
          const even = k === "Uint16Array";
          checkToUint8Array(
            even ? length * 2 : length,
            even ? offset * 2 : offset,
            k,
          );
        },
      ),
    );
  });

  it("hex 문자열은 짝수 길이의 hex 문자만 변환되고 나머지는 RangeError다", () => {
    fc.assert(
      fc.property(
        fc.string({
          maxLength: 20,
          unit: fc.constantFrom(..."0123456789abcdefABCDEFgG -"),
        }),
        checkHexInput,
      ),
    );
  });

  it("base64 문자열은 바이트가 되거나 InvalidCharacterError이다", () => {
    fc.assert(
      fc.property(
        fc.oneof(
          fc.base64String({ maxLength: 40 }),
          fc.string({
            maxLength: 12,
            unit: fc.constantFrom(..."AQgw09+/=-_ \n!"),
          }),
        ),
        checkBase64Input,
      ),
    );
  });
});
