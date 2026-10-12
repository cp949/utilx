import { describe, expect, it } from "vitest";
import {
  base64ToString,
  base64ToUint8Array,
  hexToUint8Array,
  stringToBase64,
  stringToUint8Array,
  uint8ArrayToBase64,
  uint8ArrayToHex,
  uint8ArrayToString,
} from "../src/binary/index.js";

const bytes = (...values: number[]) => new Uint8Array(values);

describe("stringToUint8Array / uint8ArrayToString", () => {
  it("UTF-8로 변환하고 되돌린다", () => {
    const encoded = stringToUint8Array("Hi 안녕");

    expect([...encoded.subarray(0, 3)]).toEqual([72, 105, 32]);
    expect(uint8ArrayToString(encoded)).toBe("Hi 안녕");
  });

  it("다른 인코딩으로 해석할 수 있다", () => {
    const shiftJis = bytes(130, 177, 130, 241, 130, 201, 130, 191, 130, 205);

    expect(uint8ArrayToString(shiftJis, "shift_jis")).toBe("こんにちは");
  });

  it("UTF-8 BOM은 제거한다", () => {
    expect(uint8ArrayToString(bytes(0xef, 0xbb, 0xbf, 65))).toBe("A");
  });

  it("모르는 인코딩은 RangeError다", () => {
    expect(() => uint8ArrayToString(bytes(65), "not-an-encoding")).toThrow(
      RangeError,
    );
  });
});

describe("base64", () => {
  it("표준 base64로 변환하고 되돌린다", () => {
    expect(uint8ArrayToBase64(bytes(251, 255))).toBe("+/8=");
    expect([...base64ToUint8Array("+/8=")]).toEqual([251, 255]);
  });

  it("urlSafe는 -, _를 쓰고 패딩을 붙이지 않는다", () => {
    expect(uint8ArrayToBase64(bytes(251, 255), { urlSafe: true })).toBe("-_8");
  });

  it("URL-safe 문자열과 패딩 없는 문자열도 받는다", () => {
    expect([...base64ToUint8Array("-_8")]).toEqual([251, 255]);
    expect([...base64ToUint8Array("-_8=")]).toEqual([251, 255]);
  });

  it("빈 배열은 빈 문자열이다", () => {
    expect(uint8ArrayToBase64(bytes())).toBe("");
    expect(base64ToUint8Array("").length).toBe(0);
  });

  it("큰 배열도 변환한다", () => {
    const large = new Uint8Array(200_000).map((_, index) => index % 256);

    const roundTrip = base64ToUint8Array(uint8ArrayToBase64(large));

    expect(roundTrip.length).toBe(large.length);
    expect(roundTrip.every((value, index) => value === large[index])).toBe(
      true,
    );
  });

  it("Buffer의 base64와 같은 결과다", () => {
    const sample = bytes(0, 1, 2, 250, 251, 252, 253, 254, 255);

    expect(uint8ArrayToBase64(sample)).toBe(
      Buffer.from(sample).toString("base64"),
    );
  });

  it("base64에 쓸 수 없는 문자는 예외다", () => {
    expect(() => base64ToUint8Array("***")).toThrow();
  });
});

describe("stringToBase64 / base64ToString", () => {
  it("한글을 UTF-8로 인코딩해서 변환하고 되돌린다", () => {
    expect(stringToBase64("안녕")).toBe("7JWI64WV");
    expect(base64ToString("7JWI64WV")).toBe("안녕");
  });

  it("urlSafe를 지원한다", () => {
    const text = "???>>>";

    expect(stringToBase64(text, { urlSafe: true })).toBe("Pz8_Pj4-");
    expect(base64ToString("Pz8_Pj4-")).toBe(text);
  });
});

describe("hex", () => {
  it("소문자 hex로 변환한다", () => {
    expect(uint8ArrayToHex(bytes(0, 15, 16, 255))).toBe("000f10ff");
    expect(uint8ArrayToHex(bytes())).toBe("");
  });

  it("대소문자를 모두 받아 바이트로 바꾼다", () => {
    expect([...hexToUint8Array("000FfF")]).toEqual([0, 15, 255]);
    expect(hexToUint8Array("").length).toBe(0);
  });

  it("전체 바이트 값을 왕복 변환한다", () => {
    const all = new Uint8Array(256).map((_, index) => index);

    expect([...hexToUint8Array(uint8ArrayToHex(all))]).toEqual([...all]);
  });

  it("길이가 홀수이면 RangeError다", () => {
    expect(() => hexToUint8Array("abc")).toThrow(RangeError);
  });

  it("hex가 아닌 문자가 있으면 RangeError다", () => {
    expect(() => hexToUint8Array("0g")).toThrow(RangeError);
    expect(() => hexToUint8Array("g0")).toThrow(RangeError);
    expect(() => hexToUint8Array("00 ")).toThrow(RangeError);
  });
});
