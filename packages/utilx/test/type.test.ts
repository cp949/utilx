import { runInNewContext } from "node:vm";
import { describe, expect, it } from "vitest";
import {
  isBoolean,
  isError,
  invariant,
  isFunction,
  isNonEmptyArray,
  isNumber,
  isPlainObject,
  isPromiseLike,
  isString,
} from "../src/type/index.js";

describe("원시값 가드", () => {
  it("isString은 문자열만 true다", () => {
    expect(isString("")).toBe(true);
    expect(isString(new String("a"))).toBe(false);
    expect(isString(1)).toBe(false);
  });

  it("isNumber는 NaN과 Infinity도 true다", () => {
    expect(isNumber(0)).toBe(true);
    expect(isNumber(Number.NaN)).toBe(true);
    expect(isNumber(Number.POSITIVE_INFINITY)).toBe(true);
    expect(isNumber("1")).toBe(false);
    expect(isNumber(BigInt(1))).toBe(false);
  });

  it("isBoolean은 boolean만 true다", () => {
    expect(isBoolean(false)).toBe(true);
    expect(isBoolean(0)).toBe(false);
  });

  it("filter 콜백으로 쓰면 타입이 좁혀진다", () => {
    const values: (string | number)[] = ["a", 1, "b"];

    const strings: string[] = values.filter(isString);

    expect(strings).toEqual(["a", "b"]);
  });
});

describe("isFunction", () => {
  it("일반, 화살표, async, 제너레이터, 클래스를 모두 true로 본다", () => {
    expect(isFunction(function plain() {})).toBe(true);
    expect(isFunction(() => 1)).toBe(true);
    expect(isFunction(async () => Promise.resolve(1))).toBe(true);
    expect(isFunction(function* gen() {})).toBe(true);
    expect(isFunction(class Foo {})).toBe(true);
  });

  it("함수가 아니면 false다", () => {
    expect(isFunction(null)).toBe(false);
    expect(isFunction({})).toBe(false);
    expect(isFunction("a")).toBe(false);
  });
});

describe("isPlainObject", () => {
  it("객체 리터럴과 Object.create(null)은 true다", () => {
    expect(isPlainObject({})).toBe(true);
    expect(isPlainObject({ a: 1 })).toBe(true);
    expect(isPlainObject(Object.create(null))).toBe(true);
    expect(isPlainObject(new Object())).toBe(true);
  });

  it("다른 realm의 평범한 객체는 true다", () => {
    const foreign: unknown = runInNewContext("({ a: 1 })");

    expect(foreign instanceof Object).toBe(false);
    expect(isPlainObject(foreign)).toBe(true);
  });

  it("배열, Map, Date, 클래스 인스턴스, null, 원시값은 false다", () => {
    class Foo {}

    expect(isPlainObject([])).toBe(false);
    expect(isPlainObject(new Map())).toBe(false);
    expect(isPlainObject(new Date())).toBe(false);
    expect(isPlainObject(new Foo())).toBe(false);
    expect(isPlainObject(null)).toBe(false);
    expect(isPlainObject("a")).toBe(false);
    expect(isPlainObject(() => 1)).toBe(false);
  });
});

describe("isNonEmptyArray", () => {
  it("요소가 있으면 true이고 첫 요소를 undefined 없이 읽을 수 있다", () => {
    const items: string[] = ["abc"];

    if (isNonEmptyArray(items)) {
      const first: string = items[0];
      expect(first).toBe("abc");
    } else {
      expect.unreachable();
    }
  });

  it("빈 배열은 false다", () => {
    expect(isNonEmptyArray([])).toBe(false);
  });
});

describe("isPromiseLike", () => {
  it("Promise와 thenable은 true다", () => {
    expect(isPromiseLike(Promise.resolve(1))).toBe(true);
    expect(isPromiseLike({ then: () => undefined })).toBe(true);
    expect(
      isPromiseLike(Object.assign(() => 1, { then: () => undefined })),
    ).toBe(true);
  });

  it("then이 함수가 아니면 false다", () => {
    expect(isPromiseLike({ then: 1 })).toBe(false);
    expect(isPromiseLike({})).toBe(false);
    expect(isPromiseLike(null)).toBe(false);
    expect(isPromiseLike("then")).toBe(false);
  });
});

describe("isError", () => {
  it("Error와 하위 클래스는 true다", () => {
    expect(isError(new Error("x"))).toBe(true);
    expect(isError(new TypeError("x"))).toBe(true);
  });

  it("다른 realm의 Error도 true다", () => {
    const foreign: unknown = runInNewContext("new Error('x')");

    expect(foreign instanceof Error).toBe(false);
    expect(isError(foreign)).toBe(true);
  });

  it("Error가 아니면 false다", () => {
    expect(isError({ message: "x" })).toBe(false);
    expect(isError("x")).toBe(false);
    expect(isError(null)).toBe(false);
  });

  it("Symbol.toStringTag만 위장한 객체는 false다", () => {
    expect(isError({ [Symbol.toStringTag]: "Error" })).toBe(false);
  });

  it("태그 getter가 던져도 예외 없이 false다", () => {
    const value = {
      get [Symbol.toStringTag](): string {
        throw new Error("태그 조회 실패");
      },
    };

    expect(isError(value)).toBe(false);
  });

  it("revoked Proxy는 예외 없이 false다", () => {
    const { proxy, revoke } = Proxy.revocable({}, {});
    revoke();

    expect(isError(proxy)).toBe(false);
  });

  it("Error.prototype을 상속한 같은 realm 객체는 true다", () => {
    expect(isError(Object.create(Error.prototype))).toBe(true);
  });

  it("Error.prototype을 상속한 다른 realm 객체는 false다", () => {
    const foreign: unknown = runInNewContext("Object.create(Error.prototype)");

    expect(isError(foreign)).toBe(false);
  });

  it("Symbol.toStringTag를 직접 정의한 다른 realm의 Error는 false다", () => {
    const foreign: unknown = runInNewContext(
      "Object.defineProperty(new Error('x'), Symbol.toStringTag, { value: 'Custom' })",
    );

    expect(isError(foreign)).toBe(false);
  });
});

describe("invariant", () => {
  it("조건이 참이면 아무것도 하지 않는다", () => {
    expect(() => {
      invariant(true, "x");
      invariant(1, "x");
      invariant("a", "x");
    }).not.toThrow();
  });

  it("조건이 거짓이면 message를 담은 Error를 던진다", () => {
    for (const falsy of [false, 0, "", null, undefined, Number.NaN]) {
      expect(() => {
        invariant(falsy, "깨진 가정");
      }).toThrow("깨진 가정");
    }
  });

  it("예외의 name은 Invariant Violation이다", () => {
    try {
      invariant(false, "x");
      expect.unreachable();
    } catch (error) {
      expect(error).toBeInstanceOf(Error);
      expect((error as Error).name).toBe("Invariant Violation");
    }
  });

  it("통과하면 조건을 참으로 좁힌다", () => {
    const entry = { open: true } as { open: boolean } | undefined;
    invariant(entry, "entry 없음");
    expect(entry.open).toBe(true);
  });
});
