import { describe, expect, it, vi } from "vitest";
import {
  hasTouchSupport,
  hasWebBluetooth,
  hasWebSerial,
} from "../src/web/index.js";

describe("hasTouchSupport", () => {
  it("window에 ontouchstart가 있으면 true다", () => {
    vi.stubGlobal("window", { ontouchstart: null });
    vi.stubGlobal("navigator", {});

    expect(hasTouchSupport()).toBe(true);
  });

  it("maxTouchPoints가 0보다 크면 true다", () => {
    vi.stubGlobal("window", {});
    vi.stubGlobal("navigator", { maxTouchPoints: 5 });

    expect(hasTouchSupport()).toBe(true);
  });

  it("window가 없어도 maxTouchPoints가 0보다 크면 true다(워커)", () => {
    vi.stubGlobal("window", undefined);
    vi.stubGlobal("navigator", { maxTouchPoints: 1 });

    expect(hasTouchSupport()).toBe(true);
  });

  it("ontouchstart가 없고 maxTouchPoints가 0이면 false다", () => {
    vi.stubGlobal("window", {});
    vi.stubGlobal("navigator", { maxTouchPoints: 0 });

    expect(hasTouchSupport()).toBe(false);
  });

  it("maxTouchPoints가 없으면 false다", () => {
    vi.stubGlobal("window", {});
    vi.stubGlobal("navigator", {});

    expect(hasTouchSupport()).toBe(false);
  });

  it("window와 navigator가 없으면 false다(서버)", () => {
    vi.stubGlobal("window", undefined);
    vi.stubGlobal("navigator", undefined);

    expect(hasTouchSupport()).toBe(false);
  });
});

describe("hasWebBluetooth", () => {
  it("navigator에 bluetooth가 있으면 true다", () => {
    vi.stubGlobal("navigator", { bluetooth: {} });

    expect(hasWebBluetooth()).toBe(true);
  });

  it("navigator에 bluetooth가 없으면 false다", () => {
    vi.stubGlobal("navigator", {});

    expect(hasWebBluetooth()).toBe(false);
  });

  it("navigator가 없으면 false다(서버)", () => {
    vi.stubGlobal("navigator", undefined);

    expect(hasWebBluetooth()).toBe(false);
  });
});

describe("hasWebSerial", () => {
  it("navigator에 serial이 있으면 true다", () => {
    vi.stubGlobal("navigator", { serial: {} });

    expect(hasWebSerial()).toBe(true);
  });

  it("navigator에 serial이 없으면 false다", () => {
    vi.stubGlobal("navigator", {});

    expect(hasWebSerial()).toBe(false);
  });

  it("navigator가 없으면 false다(서버)", () => {
    vi.stubGlobal("navigator", undefined);

    expect(hasWebSerial()).toBe(false);
  });
});
