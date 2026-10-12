import { posix } from "node:path";
import { describe, expect, it } from "vitest";
import {
  isAbsolutePath,
  joinPath,
  normalizePath,
  parsePath,
} from "../src/path/index.js";

/** 알파벳 `chars`로 만들 수 있는 길이 0..maxLength의 모든 문자열. */
function allStrings(chars: string[], maxLength: number): string[] {
  let current = [""];
  const result = [""];
  for (let length = 1; length <= maxLength; length += 1) {
    current = current.flatMap((prefix) => chars.map((char) => prefix + char));
    result.push(...current);
  }
  return result;
}

// node:path의 posix 구현과 모든 짧은 경로에서 같은 결과를 내는지 비교한다.
const paths = allStrings(["a", ".", "/"], 6);

describe("node:path.posix와 같은 결과를 낸다", () => {
  it(`normalizePath (${paths.length}개 입력)`, () => {
    const mismatches = paths.filter(
      (path) => normalizePath(path) !== posix.normalize(path),
    );

    expect(mismatches).toEqual([]);
  });

  it("isAbsolutePath", () => {
    const mismatches = paths.filter(
      (path) => isAbsolutePath(path) !== posix.isAbsolute(path),
    );

    expect(mismatches).toEqual([]);
  });

  it("parsePath (절대 경로의 '/..' 제외)", () => {
    // Node는 '/..'(뒤에 구분자가 붙은 경우 포함)만 ext를 '.', name을 '.'으로 돌려준다.
    // '..'나 '/a/..'는 ext가 ''인데 이 입력만 다르므로 일관되지 않은 동작으로 보고 따르지 않는다.
    const comparable = paths.filter((path) => !/^\/\.\.\/*$/.test(path));
    const mismatches = comparable.filter(
      (path) =>
        JSON.stringify(parsePath(path)) !== JSON.stringify(posix.parse(path)),
    );

    expect(mismatches).toEqual([]);
  });

  it("parsePath는 '/..'를 '..'와 같게 확장자 없는 이름으로 본다", () => {
    for (const path of ["/..", "/../", "/..//"]) {
      expect(parsePath(path)).toEqual({
        root: "/",
        dir: "/",
        base: "..",
        ext: "",
        name: "..",
      });
    }
  });

  it("joinPath (두 조각 조합)", () => {
    const parts = allStrings(["a", ".", "/"], 3);
    const mismatches: string[][] = [];
    for (const first of parts) {
      for (const second of parts) {
        if (joinPath(first, second) !== posix.join(first, second)) {
          mismatches.push([first, second]);
        }
      }
    }

    expect(mismatches).toEqual([]);
  });

  it("joinPath (세 조각 조합)", () => {
    const parts = ["", "a", "/", "..", "./b", "c/", "/d", "../.."];
    const mismatches: string[][] = [];
    for (const first of parts) {
      for (const second of parts) {
        for (const third of parts) {
          if (
            joinPath(first, second, third) !== posix.join(first, second, third)
          ) {
            mismatches.push([first, second, third]);
          }
        }
      }
    }

    expect(mismatches).toEqual([]);
  });
});

describe("예시", () => {
  it("normalizePath", () => {
    expect(normalizePath("/a//b/../c/./")).toBe("/a/c/");
    expect(normalizePath("../a/..")).toBe("..");
    expect(normalizePath("")).toBe(".");
    expect(normalizePath("/..")).toBe("/");
  });

  it("joinPath", () => {
    expect(joinPath("/a", "b", "../c")).toBe("/a/c");
    expect(joinPath("a", "/b")).toBe("a/b");
    expect(joinPath()).toBe(".");
    expect(joinPath("", "")).toBe(".");
  });

  it("parsePath", () => {
    expect(parsePath("/home/user/file.tar.gz")).toEqual({
      root: "/",
      dir: "/home/user",
      base: "file.tar.gz",
      ext: ".gz",
      name: "file.tar",
    });
    expect(parsePath(".bashrc")).toEqual({
      root: "",
      dir: "",
      base: ".bashrc",
      ext: "",
      name: ".bashrc",
    });
  });
});
