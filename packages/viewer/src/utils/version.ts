declare const __RQTI_VIEWER_VERSION__: string;

export const VERSION: string = __RQTI_VIEWER_VERSION__;

export const VERSION_STORAGE_KEY = "rqti-viewer:version";

let recorded = false;

export function recordViewerVersion(): void {
  if (recorded) return;
  if (typeof window === "undefined") return;
  recorded = true;
  try {
    // sandbox iframe에서는 localStorage 접근 자체가 SecurityError를 던진다.
    if (typeof localStorage === "undefined") return;
    if (localStorage.getItem(VERSION_STORAGE_KEY) !== VERSION) {
      localStorage.setItem(VERSION_STORAGE_KEY, VERSION);
    }
  } catch {
    // quota / private mode / sandbox
  }
}
