import { runInNewContext } from "node:vm";
import { describe, expect, it } from "vitest";
import { extractErrorMessage, toError } from "../src/error/index.js";

describe("extractErrorMessage", () => {
  it("Error의 message를 돌려준다", () => {
    expect(extractErrorMessage(new Error("실패"))).toBe("실패");
    expect(extractErrorMessage(new TypeError("형식"))).toBe("형식");
  });

  it("문자열은 빈 문자열도 그대로 돌려준다", () => {
    expect(extractErrorMessage("오류")).toBe("오류");
    expect(extractErrorMessage("")).toBe("");
  });

  it("null과 undefined는 fallback이다", () => {
    expect(extractErrorMessage(null)).toBe("unknown");
    expect(extractErrorMessage(undefined)).toBe("unknown");
    expect(extractErrorMessage(undefined, "알 수 없음")).toBe("알 수 없음");
  });

  it("Error가 아니어도 문자열 message 속성이 있으면 그 값이다", () => {
    expect(extractErrorMessage({ message: "거부됨", code: 1 })).toBe("거부됨");
  });

  it("message가 문자열이 아니면 String()으로 바꾼다", () => {
    expect(extractErrorMessage({ message: 1 })).toBe("[object Object]");
  });

  it("숫자, boolean, bigint, symbol을 문자열로 바꾼다", () => {
    expect(extractErrorMessage(404)).toBe("404");
    expect(extractErrorMessage(false)).toBe("false");
    expect(extractErrorMessage(BigInt(10))).toBe("10");
    expect(extractErrorMessage(Symbol("s"))).toBe("Symbol(s)");
  });

  it("message getter가 예외를 던지면 String()으로 넘어간다", () => {
    const value = {
      get message(): string {
        throw new Error("getter");
      },
      toString: () => "대체",
    };
    expect(extractErrorMessage(value)).toBe("대체");
  });

  it("String() 변환이 예외를 던지면 fallback이다", () => {
    expect(extractErrorMessage(Object.create(null))).toBe("unknown");
    const value = {
      toString(): string {
        throw new Error("toString");
      },
    };
    expect(extractErrorMessage(value, "변환 실패")).toBe("변환 실패");
  });

  it("다른 realm의 Error도 message를 꺼낸다", () => {
    const foreign = runInNewContext("new Error('외부')") as unknown;
    expect(extractErrorMessage(foreign)).toBe("외부");
  });
});

describe("toError", () => {
  it("Error는 같은 인스턴스를 돌려준다", () => {
    const error = new RangeError("범위");
    expect(toError(error)).toBe(error);
  });

  it("다른 realm의 Error도 같은 인스턴스를 돌려준다", () => {
    const foreign = runInNewContext("new Error('외부')") as Error;
    expect(foreign instanceof Error).toBe(false);
    expect(toError(foreign)).toBe(foreign);
  });

  it("Symbol.toStringTag만 위장한 객체는 새 Error로 감싼다", () => {
    const value = { [Symbol.toStringTag]: "Error", message: "위장" };

    const error = toError(value);
    expect(error).not.toBe(value);
    expect(error).toBeInstanceOf(Error);
    expect(error.message).toBe("위장");
    expect(error.cause).toBe(value);
  });

  it("message가 문자열이 아닌 진짜 Error도 같은 인스턴스를 돌려준다", () => {
    const error = new Error("원래");
    (error as { message: unknown }).message = undefined;

    expect(toError(error)).toBe(error);
    expect(toError(error).message).toBeUndefined();
  });

  it("revoked Proxy는 예외 없이 새 Error로 감싼다", () => {
    const { proxy, revoke } = Proxy.revocable({}, {});
    revoke();

    const error = toError(proxy);
    expect(error).toBeInstanceOf(Error);
    expect(error.cause).toBe(proxy);
  });

  it("태그 getter가 던져도 문자열 message를 보존한다", () => {
    const value = {
      message: "원래 메시지",
      get [Symbol.toStringTag](): string {
        throw new Error("태그 조회 실패");
      },
    };

    const error = toError(value);
    expect(error).toBeInstanceOf(Error);
    expect(error.message).toBe("원래 메시지");
    expect(error.cause).toBe(value);
  });

  it("Proxy의 프로토타입 조회가 던져도 JSON 메시지를 만든다", () => {
    const value = new Proxy(
      { code: 7 },
      {
        getPrototypeOf(): never {
          throw new Error("프로토타입 조회 실패");
        },
      },
    );

    const error = toError(value);
    expect(error).toBeInstanceOf(Error);
    expect(error.message).toBe('{"code":7}');
    expect(error.cause).toBe(value);
  });

  it("태그 조회와 JSON 변환이 던져도 문자열 변환을 계속한다", () => {
    const value = {
      get [Symbol.toStringTag](): string {
        throw new Error("태그 조회 실패");
      },
      toJSON(): never {
        throw new Error("JSON 변환 실패");
      },
      toString: () => "대체 메시지",
    };

    const error = toError(value);
    expect(error).toBeInstanceOf(Error);
    expect(error.message).toBe("대체 메시지");
    expect(error.cause).toBe(value);
  });

  it("폐기된 Proxy는 unknown 메시지와 원래 cause로 변환한다", () => {
    const { proxy, revoke } = Proxy.revocable({}, {});
    revoke();

    const error = toError(proxy);
    expect(error).toBeInstanceOf(Error);
    expect(error.message).toBe("unknown");
    expect(error.cause).toBe(proxy);
    expect(Object.keys(error)).not.toContain("cause");
  });

  it("문자열은 message가 되고 원래 값이 cause에 남는다", () => {
    const error = toError("실패");
    expect(error).toBeInstanceOf(Error);
    expect(error.message).toBe("실패");
    expect(error.cause).toBe("실패");
  });

  it("cause는 열거되지 않고 덮어쓸 수 있다", () => {
    const error = toError("실패");
    expect(Object.keys(error)).not.toContain("cause");
    error.cause = "다른 값";
    expect(error.cause).toBe("다른 값");
  });

  it("null과 undefined의 message는 unknown이다", () => {
    expect(toError(null).message).toBe("unknown");
    expect(toError(undefined).message).toBe("unknown");
    expect(toError(undefined).cause).toBeUndefined();
  });

  it("문자열 message가 있는 객체는 그 값을 쓴다", () => {
    const value = { message: "거부됨", code: 7 };
    const error = toError(value);
    expect(error.message).toBe("거부됨");
    expect(error.cause).toBe(value);
  });

  it("message가 없는 객체는 JSON으로 직렬화한다", () => {
    expect(toError({ code: 1 }).message).toBe('{"code":1}');
    expect(toError([1, 2]).message).toBe("[1,2]");
  });

  it("순환 참조 객체는 String()으로 대체한다", () => {
    const value: Record<string, unknown> = {};
    value.self = value;
    expect(toError(value).message).toBe("[object Object]");
  });

  it("toJSON이 예외를 던지는 객체는 String()으로 대체한다", () => {
    const value = {
      toJSON(): never {
        throw new Error("toJSON");
      },
    };
    expect(toError(value).message).toBe("[object Object]");
  });

  it("직렬화 결과가 문자열이 아닌 값은 String()으로 대체한다", () => {
    expect(toError({ toJSON: () => undefined }).message).toBe(
      "[object Object]",
    );
    expect(toError(() => 1).message).toBe("() => 1");
  });

  it("숫자, boolean, bigint, symbol의 message를 만든다", () => {
    expect(toError(404).message).toBe("404");
    expect(toError(true).message).toBe("true");
    expect(toError(BigInt(3)).message).toBe("3");
    expect(toError(Symbol("s")).message).toBe("Symbol(s)");
  });

  it("프로토타입이 없는 객체는 JSON으로 직렬화한다", () => {
    expect(toError(Object.create(null)).message).toBe("{}");
  });

  it("직렬화와 문자열 변환이 모두 실패하면 unknown이다", () => {
    const value = {
      toJSON(): never {
        throw new Error("toJSON");
      },
      toString(): never {
        throw new Error("toString");
      },
    };
    const error = toError(value);
    expect(error.message).toBe("unknown");
    expect(error.cause).toBe(value);
  });
});
