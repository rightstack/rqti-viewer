import { useLayoutEffect, useRef, useState } from "react";
import { useMathJaxTextFontReady } from "../providers/mathJaxTextFontReady";

const GRID_SELECTOR = ".qti-ext-vcq-grid";
const MATH_SELECTOR = ".qti-ext-mathfield";
const BLANK_SELECTOR = ".qti-ext-input-blank, .qti-ext-mjx-blank-slot";

/** 수식 조판이 끝나지 않아도 이 시간이 지나면 세로셈을 보여 준다. */
const REVEAL_MS = 2500;

/** 수식이 있는 그리드는 크기와 열 너비가 이 프레임 수만큼 연속으로 같아야 한다. */
const MATH_STABLE_FRAMES = 2;

/** 수식이 없는 그리드는 측정이 한 프레임 유지되면 바로 보여 준다. */
const PLAIN_STABLE_FRAMES = 1;

function gridsOf(root: HTMLElement): HTMLElement[] {
  if (root.classList.contains("qti-ext-vcq-grid")) return [root];
  return Array.from(root.querySelectorAll<HTMLElement>(GRID_SELECTOR));
}

function mathPending(root: HTMLElement): boolean {
  const fields = root.querySelectorAll(MATH_SELECTOR);
  for (const field of fields) {
    if (!field.querySelector("mjx-container")) return true;
  }
  return false;
}

function hasMath(root: HTMLElement): boolean {
  return root.querySelector(MATH_SELECTOR) !== null;
}

/** 그리드 크기, 열 너비 변수, 빈칸 크기를 한 문자열로 만든다. */
function layoutSignature(root: HTMLElement): string {
  return gridsOf(root)
    .map((grid) => {
      const box = grid.getBoundingClientRect();
      const columns: string[] = [];
      for (let index = 0; index < grid.style.length; index += 1) {
        const name = grid.style.item(index);
        if (name?.startsWith("--vcq-col-")) {
          columns.push(`${name}${grid.style.getPropertyValue(name)}`);
        }
      }
      const blanks = Array.from(grid.querySelectorAll<HTMLElement>(BLANK_SELECTOR)).map((blank) => {
        const rect = blank.getBoundingClientRect();
        return `${Math.round(rect.width)}x${Math.round(rect.height)}`;
      });
      return `${Math.round(box.width)}x${Math.round(box.height)}|${columns.join(",")}|${blanks.join(",")}`;
    })
    .join("||");
}

function hasMeasuredSize(root: HTMLElement): boolean {
  const grids = gridsOf(root);
  if (grids.length === 0) return false;
  return grids.every((grid) => {
    const box = grid.getBoundingClientRect();
    return box.width > 0 && box.height > 0;
  });
}

/**
 * 세로셈이 조판과 칸 너비 측정이 끝날 때까지 숨겨 두었다가, 한 번 안정되면 보여 준다.
 * 반환값이 true가 된 뒤에는 입력이 칸을 늘려도 다시 숨기지 않는다.
 */
export function useVcqSettle(ref: { readonly current: HTMLDivElement | null }): boolean {
  const [settled, setSettled] = useState(false);
  const fontReady = useMathJaxTextFontReady();
  const fontReadyRef = useRef(fontReady);

  useLayoutEffect(() => {
    fontReadyRef.current = fontReady;
  });

  useLayoutEffect(() => {
    const root = ref.current;
    if (!root) return;

    let cancelled = false;
    let frames = 0;
    let lastSignature = "";
    let raf = 0;

    const finish = () => {
      if (cancelled) return;
      cancelled = true;
      window.cancelAnimationFrame(raf);
      window.clearTimeout(timer);
      setSettled(true);
    };

    const timer = window.setTimeout(finish, REVEAL_MS);

    const tick = () => {
      if (cancelled) return;
      raf = 0;
      if (
        !fontReadyRef.current ||
        !root.isConnected ||
        mathPending(root) ||
        !hasMeasuredSize(root)
      ) {
        frames = 0;
        lastSignature = "";
        raf = window.requestAnimationFrame(tick);
        return;
      }

      const signature = layoutSignature(root);
      frames = signature === lastSignature ? frames + 1 : 1;
      lastSignature = signature;
      const needed = hasMath(root) ? MATH_STABLE_FRAMES : PLAIN_STABLE_FRAMES;
      if (frames >= needed) {
        finish();
        return;
      }
      raf = window.requestAnimationFrame(tick);
    };

    raf = window.requestAnimationFrame(tick);

    return () => {
      cancelled = true;
      window.cancelAnimationFrame(raf);
      window.clearTimeout(timer);
    };
  }, [ref]);

  return settled;
}
