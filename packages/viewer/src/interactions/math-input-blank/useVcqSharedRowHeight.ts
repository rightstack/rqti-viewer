import { type RefObject, useLayoutEffect, useRef } from "react";

const GRID_SELECTOR = ".qti-ext-vcq-grid";
const GROUP_SELECTOR = ".qti-ext-column-group";
const ROW_SELECTOR = ".qti-ext-vcq-row";
const CELL_CLASS = "qti-ext-vcq-cell";
const ROW_MIN_PROPERTY = "--vcq-row-min";

/** carry·narrow·spacer 행은 콘텐츠 높이를 유지한다. 그 외 일반 행만 단 내 정렬 대상이다.
 *  뷰어 HTML은 일반 행에 별도 modifier가 없을 수 있어 "제외 방식"으로 판별한다. */
const EXCLUDED_ROW_CLASSES = [
  "qti-ext-vcq-row--carry",
  "qti-ext-vcq-row--narrow",
  "qti-ext-vcq-row--spacer",
];

function isNormalRow(row: Element): boolean {
  if (!row.classList.contains("qti-ext-vcq-row")) return false;
  return !EXCLUDED_ROW_CLASSES.some((cls) => row.classList.contains(cls));
}

/** display:contents 행(조립제법·나눗셈)은 rect 높이가 0이므로 자식 셀 높이의 최댓값으로 대체한다. */
function rowContentHeight(row: Element): number {
  let height = row instanceof HTMLElement ? row.getBoundingClientRect().height : 0;
  for (const child of Array.from(row.children)) {
    if (!(child instanceof HTMLElement) || !child.classList.contains(CELL_CLASS)) continue;
    height = Math.max(height, child.getBoundingClientRect().height);
  }
  return height;
}

/**
 * 같은 단(column-group) 안 세로셈들의 일반 행 높이를 "행 인덱스별"로 맞춘다.
 * - 한 그리드 안에서는 행마다 높이가 다를 수 있다(짧은 숫자 행, 높은 분수 행 등은 각자 유지).
 * - 서로 다른 그리드의 같은 순번 일반 행끼리만 가장 높은 쪽에 맞춰 정렬한다.
 *
 * 측정값은 각 행의 CSS 변수(--vcq-row-min)로만 적용하고 DOM/응답 데이터는 건드리지 않는다.
 * 단독 세로셈(단 밖)은 이 훅이 붙지 않으므로 행이 자연 높이 그대로 유지된다.
 */
export function useVcqColumnRowHeight(): RefObject<HTMLDivElement> {
  const ref = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const current = ref.current;
    if (!current) return;

    // 선언 타입을 non-null로 고정해 중첩 콜백(measure 등)에서도 좁혀진 타입을 유지한다.
    const root: HTMLDivElement = current;

    let frame = 0;
    let disposed = false;
    const observed = new Set<Element>();

    function schedule() {
      if (!disposed && !frame) frame = requestAnimationFrame(measure);
    }

    const resizes = new ResizeObserver(schedule);

    // 중첩된 단은 자기 높이를 독립적으로 관리한다(가장 가까운 단이 이 root일 때만).
    function collectGrids(): HTMLElement[] {
      return Array.from(root.querySelectorAll<HTMLElement>(GRID_SELECTOR)).filter(
        (grid) => grid.closest(GROUP_SELECTOR) === root
      );
    }

    function normalRowsOf(grid: HTMLElement): HTMLElement[] {
      return Array.from(grid.querySelectorAll<HTMLElement>(ROW_SELECTOR)).filter(
        (row) => row.closest(GRID_SELECTOR) === grid && isNormalRow(row)
      );
    }

    function clearRowMin() {
      collectGrids().forEach((grid) =>
        normalRowsOf(grid).forEach((row) => row.style.removeProperty(ROW_MIN_PROPERTY))
      );
    }

    function measure() {
      frame = 0;
      if (disposed || !root.isConnected) return;

      const grids = collectGrids();

      // 관찰 대상 동기화: 단·그리드·셀·수식 컨테이너(MathJax)
      const targets = new Set<Element>([root, ...grids]);
      grids.forEach((grid) => {
        grid.querySelectorAll(`.${CELL_CLASS}`).forEach((cell) => targets.add(cell));
        grid.querySelectorAll("mjx-container").forEach((math) => targets.add(math));
      });
      observed.forEach((target) => {
        if (!targets.has(target)) {
          resizes.unobserve(target);
          observed.delete(target);
        }
      });
      targets.forEach((target) => {
        if (!observed.has(target)) {
          resizes.observe(target);
          observed.add(target);
        }
      });

      const perGridRows = grids
        .filter((grid) => grid.getClientRects().length)
        .map((grid) => normalRowsOf(grid));

      // 공유값을 적용한 행을 그대로 재면 콘텐츠가 줄어도 이전 높이에 머문다.
      // 같은 프레임 안에서 공유값을 모두 풀고 자연 높이를 읽는다.
      perGridRows.forEach((rows) =>
        rows.forEach((row) => row.style.removeProperty(ROW_MIN_PROPERTY))
      );

      const heights = perGridRows.map((rows) => rows.map((row) => rowContentHeight(row)));

      // 행 인덱스별 최댓값과 참여 그리드 수
      const maxByIndex: number[] = [];
      const countByIndex: number[] = [];
      heights.forEach((rowHeights) => {
        rowHeights.forEach((height, index) => {
          if (!Number.isFinite(height) || height <= 0) return;
          maxByIndex[index] = Math.max(maxByIndex[index] ?? 0, height);
          countByIndex[index] = (countByIndex[index] ?? 0) + 1;
        });
      });

      // 같은 순번에 그리드가 둘 이상일 때만 그 순번 행끼리 정렬한다.
      perGridRows.forEach((rows) => {
        rows.forEach((row, index) => {
          const align = (countByIndex[index] ?? 0) > 1 && (maxByIndex[index] ?? 0) > 0;
          const value = align ? `${Math.ceil(maxByIndex[index])}px` : "";
          const existing = row.style.getPropertyValue(ROW_MIN_PROPERTY);
          if (value) {
            if (existing !== value) row.style.setProperty(ROW_MIN_PROPERTY, value);
          } else if (existing) {
            row.style.removeProperty(ROW_MIN_PROPERTY);
          }
        });
      });
    }

    const mutations = new MutationObserver((records) => {
      const affectsGrid = records.some((record) => {
        const target =
          record.target instanceof Element ? record.target : record.target.parentElement;
        if (!target) return false;
        // 이 단에 속한 세로셈 변경만 반영한다(중첩 단 내부는 해당 단이 처리).
        if (
          target.closest(GROUP_SELECTOR) !== root &&
          target.closest(GRID_SELECTOR)?.closest(GROUP_SELECTOR) !== root
        ) {
          return false;
        }
        if (record.type === "attributes") {
          // 행에 쓰는 --vcq-row-min 스타일 변경은 무시한다(자기 반응 루프 방지).
          return !target.matches(ROW_SELECTOR);
        }
        if (target.closest(GRID_SELECTOR)) return true;
        return [...record.addedNodes, ...record.removedNodes].some(
          (node) =>
            node instanceof Element &&
            (node.matches(GRID_SELECTOR) || node.querySelector(GRID_SELECTOR))
        );
      });
      if (affectsGrid) schedule();
    });

    mutations.observe(root, {
      childList: true,
      characterData: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["class", "style"],
    });
    measure();
    // MathJax 조판이 레이아웃 뒤에 끝나는 경우가 있어 폰트 준비 후 한 번 더 맞춘다.
    document.fonts?.ready.then(() => schedule()).catch(() => undefined);

    return () => {
      disposed = true;
      cancelAnimationFrame(frame);
      mutations.disconnect();
      resizes.disconnect();
      clearRowMin();
    };
  }, []);

  return ref;
}
