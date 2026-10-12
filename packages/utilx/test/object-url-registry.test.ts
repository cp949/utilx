import { beforeEach, describe, expect, it, vi } from "vitest";
import { ObjectUrlRegistry } from "../src/web/index.js";

describe("ObjectUrlRegistry", () => {
  let counter: number;
  let createObjectURL: ReturnType<typeof vi.fn>;
  let revokeObjectURL: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    counter = 0;
    createObjectURL = vi.fn(() => `blob:fake/${++counter}`);
    revokeObjectURL = vi.fn();
    vi.stubGlobal("URL", { createObjectURL, revokeObjectURL });
  });

  it("acquire는 같은 Blob에 같은 URL을 돌려주고 한 번만 만든다", () => {
    const registry = new ObjectUrlRegistry();
    const blob = new Blob(["hello"]);

    const first = registry.acquire(blob);
    const second = registry.acquire(blob);

    expect(first).toBe("blob:fake/1");
    expect(second).toBe(first);
    expect(createObjectURL).toHaveBeenCalledTimes(1);
    expect(registry.getURL(blob)).toBe(first);
    expect(registry.getBlob(first)).toBe(blob);
    expect(registry.has(blob)).toBe(true);
    expect(registry.has(first)).toBe(true);
    expect(registry.size).toBe(1);
  });

  it("release는 참조 횟수가 0이 될 때만 해제한다", () => {
    const registry = new ObjectUrlRegistry();
    const blob = new Blob(["a"]);
    const url = registry.acquire(blob);
    registry.acquire(blob);

    expect(registry.release(blob)).toBe(true);
    expect(revokeObjectURL).not.toHaveBeenCalled();
    expect(registry.has(url)).toBe(true);

    expect(registry.release(url)).toBe(true);
    expect(revokeObjectURL).toHaveBeenCalledExactlyOnceWith(url);
    expect(registry.has(blob)).toBe(false);
    expect(registry.size).toBe(0);
  });

  it("revoke는 참조 횟수와 무관하게 즉시 해제한다", () => {
    const registry = new ObjectUrlRegistry();
    const blob = new Blob(["b"]);
    const url = registry.acquire(blob);
    registry.acquire(blob);

    expect(registry.revoke(blob)).toBe(true);
    expect(revokeObjectURL).toHaveBeenCalledExactlyOnceWith(url);
    expect(registry.release(blob)).toBe(false);
  });

  it("revoke는 URL로도 지정할 수 있다", () => {
    const registry = new ObjectUrlRegistry();
    const url = registry.acquire(new Blob(["c"]));

    expect(registry.revoke(url)).toBe(true);
    expect(registry.size).toBe(0);
  });

  it("등록되지 않은 대상은 false다", () => {
    const registry = new ObjectUrlRegistry();
    const blob = new Blob(["x"]);

    expect(registry.release(blob)).toBe(false);
    expect(registry.release("blob:none")).toBe(false);
    expect(registry.revoke(blob)).toBe(false);
    expect(registry.revoke("blob:none")).toBe(false);
  });

  it("revokeAll은 해제한 개수를 돌려주고 이후에도 쓸 수 있다", () => {
    const registry = new ObjectUrlRegistry();
    registry.acquire(new Blob(["a"]));
    registry.acquire(new Blob(["b"]));

    expect(registry.revokeAll()).toBe(2);
    expect(revokeObjectURL).toHaveBeenCalledTimes(2);
    expect(registry.size).toBe(0);

    expect(registry.acquire(new Blob(["c"]))).toBe("blob:fake/3");
    expect(registry.size).toBe(1);
  });

  it("close는 모두 해제하고 이후 acquire를 막는다", () => {
    const registry = new ObjectUrlRegistry();
    const blob = new Blob(["z"]);
    const url = registry.acquire(blob);

    registry.close();

    expect(revokeObjectURL).toHaveBeenCalledWith(url);
    expect(registry.size).toBe(0);
    expect(() => registry.acquire(new Blob(["later"]))).toThrow(Error);
    expect(registry.release(blob)).toBe(false);
    expect(registry.revoke(url)).toBe(false);
  });

  it("메서드를 분리해서 호출해도 동작한다", () => {
    const { acquire, release } = new ObjectUrlRegistry();
    const blob = new Blob(["d"]);
    const url = acquire(blob);

    expect(release(url)).toBe(true);
    expect(revokeObjectURL).toHaveBeenCalledWith(url);
  });
});
