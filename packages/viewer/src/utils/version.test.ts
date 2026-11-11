import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const pkg = JSON.parse(
  readFileSync(resolve(__dirname, "../../package.json"), "utf8")
) as { version: string };

function createStorage() {
  const map = new Map<string, string>();
  return {
    getItem: vi.fn((key: string) => map.get(key) ?? null),
    setItem: vi.fn((key: string, value: string) => {
      map.set(key, value);
    }),
  };
}

async function loadModule() {
  return import("./version");
}

describe("recordViewerVersion", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("VERSION은 package.json 버전과 같다", async () => {
    const { VERSION } = await loadModule();
    expect(VERSION).toBe(pkg.version);
  });

  it("처음 호출하면 버전을 저장한다", async () => {
    const storage = createStorage();
    vi.stubGlobal("window", {});
    vi.stubGlobal("localStorage", storage);
    const { recordViewerVersion, VERSION, VERSION_STORAGE_KEY } = await loadModule();

    recordViewerVersion();

    expect(storage.setItem).toHaveBeenCalledWith(VERSION_STORAGE_KEY, VERSION);
  });

  it("두 번째 호출부터는 storage에 접근하지 않는다", async () => {
    const storage = createStorage();
    vi.stubGlobal("window", {});
    vi.stubGlobal("localStorage", storage);
    const { recordViewerVersion } = await loadModule();

    recordViewerVersion();
    recordViewerVersion();

    expect(storage.getItem).toHaveBeenCalledTimes(1);
  });

  it("저장된 값이 같으면 쓰지 않는다", async () => {
    const storage = createStorage();
    vi.stubGlobal("window", {});
    vi.stubGlobal("localStorage", storage);
    const { recordViewerVersion, VERSION, VERSION_STORAGE_KEY } = await loadModule();
    storage.setItem(VERSION_STORAGE_KEY, VERSION);
    storage.setItem.mockClear();

    recordViewerVersion();

    expect(storage.setItem).not.toHaveBeenCalled();
  });

  it("SSR에서는 플래그를 세우지 않아 이후 브라우저 호출에서 저장한다", async () => {
    const { recordViewerVersion, VERSION_STORAGE_KEY } = await loadModule();
    recordViewerVersion();

    const storage = createStorage();
    vi.stubGlobal("window", {});
    vi.stubGlobal("localStorage", storage);
    recordViewerVersion();

    expect(storage.setItem).toHaveBeenCalledWith(VERSION_STORAGE_KEY, expect.any(String));
  });

  it("storage 접근 에러를 무시한다", async () => {
    vi.stubGlobal("window", {});
    vi.stubGlobal("localStorage", {
      getItem: () => {
        throw new DOMException("denied", "SecurityError");
      },
      setItem: vi.fn(),
    });
    const { recordViewerVersion } = await loadModule();

    expect(() => recordViewerVersion()).not.toThrow();
  });
});
