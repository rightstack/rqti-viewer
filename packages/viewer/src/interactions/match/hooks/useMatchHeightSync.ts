import { useCallback, useLayoutEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";

const GAP_PX = 12; // gap-3

interface UseMatchHeightSyncProps {
  isMultiWay: boolean;
  hasSameOptionCount: boolean;
  leftChoicesLength: number;
  rightChoicesLength: number;
  /**
   * 문항·인스턴스 단위 식별. React Query 캐시 히트 등으로 MatchInteraction 인스턴스가 유지되고
   * 옵션 개수만 같을 때도 그리드는 key로 리마운트되므로, 이 값이 바뀌면 측정 effect를 반드시 다시 돌린다.
   */
  heightSyncKey: string;
  srcCardRefs: React.MutableRefObject<Array<HTMLDivElement | null>>;
  tgtCardRefs: React.MutableRefObject<Array<HTMLDivElement | null>>;
  srcOptionRefs: React.MutableRefObject<Array<HTMLDivElement | null>>;
  tgtOptionRefs: React.MutableRefObject<Array<HTMLDivElement | null>>;
  gridContainerRef: React.RefObject<HTMLDivElement>;
}

export const useMatchHeightSync = (props: UseMatchHeightSyncProps) => {
  const {
    isMultiWay,
    hasSameOptionCount,
    leftChoicesLength,
    rightChoicesLength,
    heightSyncKey,
    srcCardRefs,
    tgtCardRefs,
    srcOptionRefs,
    tgtOptionRefs,
    gridContainerRef,
  } = props;

  const [rowHeights, setRowHeights] = useState<number[]>([]);
  const [shortColumn, setShortColumn] = useState<"left" | "right" | null>(null);
  const [shortColumnMinHeights, setShortColumnMinHeights] = useState<number[]>([]);

  /**
   * 짧은 열 확정값 - 첫 번째 유효 측정 시 결정, 이후 잠금
   *
   * 버그 원인: minHeight 적용 후 짧은 열의 카드 높이가 올라가서
   * leftContentH > rightContentH 로 역전(float 오차 포함)되면
   * 매 측정마다 shortColumn 이 "left" ↔ "right" 로 진동(oscillation)함.
   *
   * 해결: 최초 자연 높이 측정 시 한 번만 결정하고, 이후에는 잠금.
   * 옵션 개수가 바뀌면(useLayoutEffect deps 변경) 잠금 해제 후 재결정.
   */
  const lockedShortColumnRef = useRef<"left" | "right" | null>(null);

  /**
   * 이전 컨테이너 너비 저장 - ResizeObserver 무한 루프 방지
   *
   * 문제: flushSync로 minHeight를 변경하면 컨테이너 높이가 변해서
   * ResizeObserver가 다시 트리거되어 무한 루프 발생
   *
   * 해결: 컨테이너의 너비만 체크 (높이는 내부 콘텐츠에 따라 자동 변경되므로 무시)
   */
  const prevContainerWidthRef = useRef<number>(0);

  const measureHeight = useCallback(() => {
    if (isMultiWay) return;

    if (hasSameOptionCount) {
      const rowCount = leftChoicesLength;
      if (rowCount === 0) return;
      const next: number[] = [];
      for (let i = 0; i < rowCount; i++) {
        const srcEl = srcCardRefs.current[i];
        const tgtEl = tgtCardRefs.current[i];
        const sh = srcEl?.offsetHeight ?? 0;
        const th = tgtEl?.offsetHeight ?? 0;
        next[i] = Math.max(sh, th, 1);
      }
      setRowHeights((prev) => {
        if (prev.length === next.length && prev.every((p, j) => Math.abs(p - next[j]) < 0.5))
          return prev;
        return next;
      });
      return;
    }

    // 그리드에서 열 div는 행 높이로 늘어나 두 열이 같아질 수 있음 → 옵션 높이 합 + gap 으로 콘텐츠 높이 비교
    const leftCardHeights = srcOptionRefs.current
      .slice(0, leftChoicesLength)
      .map((el) => el?.offsetHeight ?? 0);
    const rightCardHeights = tgtOptionRefs.current
      .slice(0, rightChoicesLength)
      .map((el) => el?.offsetHeight ?? 0);

    // 아직 DOM이 준비되지 않은 경우 측정 포기 (0으로 계산되는 것 방지)
    if (!leftCardHeights.some((h) => h > 0) || !rightCardHeights.some((h) => h > 0)) return;

    // 첫 번째 유효 측정에서만 짧은 열을 결정 → 이후 잠금
    // (minHeight 적용 후 높이가 팽창해도 shortColumn 이 뒤집히지 않음)
    if (lockedShortColumnRef.current === null) {
      const leftContentH =
        leftCardHeights.reduce((a, b) => a + b, 0) + (leftChoicesLength - 1) * GAP_PX;
      const rightContentH =
        rightCardHeights.reduce((a, b) => a + b, 0) + (rightChoicesLength - 1) * GAP_PX;
      lockedShortColumnRef.current = leftContentH <= rightContentH ? "left" : "right";
    }

    const isShortLeft = lockedShortColumnRef.current === "left";

    // 긴 열은 minHeight 미적용 → 항상 자연 높이를 신뢰할 수 있음
    const tallCardHeights = isShortLeft ? rightCardHeights : leftCardHeights;
    const shortCardHeights = isShortLeft ? leftCardHeights : rightCardHeights;
    const tallCount = isShortLeft ? rightChoicesLength : leftChoicesLength;
    const n = isShortLeft ? leftChoicesLength : rightChoicesLength;

    if (n === 0 || tallCount === 0) return;

    const tallContentH = tallCardHeights.reduce((a, b) => a + b, 0) + (tallCount - 1) * GAP_PX;
    if (!tallContentH) return;

    const shortContentH = shortCardHeights.reduce((a, b) => a + b, 0) + (n - 1) * GAP_PX;
    // Math.max(0, ...): minHeight 적용 후 float 오차로 shortContentH ≥ tallContentH 가 되어도 음수 extra 방지
    const extraHeight = Math.max(0, tallContentH - shortContentH);
    const extraPerOption = extraHeight / n;

    const perCard = (tallContentH - (n - 1) * GAP_PX) / n;
    const nextMinHeights: number[] = shortCardHeights.every((h) => h < 1)
      ? Array.from({ length: n }, () => perCard)
      : shortCardHeights.map((h) => h + extraPerOption);

    const nextShortColumn = lockedShortColumnRef.current;
    // setState 는 값이 실제로 달라질 때만 → ResizeObserver/rerender 루프 차단
    setShortColumn((prev) => (prev === nextShortColumn ? prev : nextShortColumn));
    setShortColumnMinHeights((prev) => {
      if (
        prev.length === nextMinHeights.length &&
        prev.every((h, i) => Math.abs(h - nextMinHeights[i]) < 0.5)
      )
        return prev;
      return nextMinHeights;
    });
  }, [
    isMultiWay,
    hasSameOptionCount,
    leftChoicesLength,
    rightChoicesLength,
    srcCardRefs,
    tgtCardRefs,
    srcOptionRefs,
    tgtOptionRefs,
  ]);

  // 초기 측정: 옵션 개수·문항(heightSyncKey) 변경 시 잠금 해제 + rAF + 200ms 폴백(폰트/이미지 로딩 대비)
  useLayoutEffect(() => {
    if (isMultiWay) return;
    lockedShortColumnRef.current = null;
    prevContainerWidthRef.current = 0;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setRowHeights([]);
    setShortColumnMinHeights([]);
    setShortColumn(null);
    const rafId = requestAnimationFrame(measureHeight);
    const t = window.setTimeout(measureHeight, 200);
    return () => {
      cancelAnimationFrame(rafId);
      window.clearTimeout(t);
    };
  }, [measureHeight, isMultiWay, heightSyncKey]);

  /**
   * 미디어 레이아웃 감지: img load/decode, video loadedmetadata 이후 재측정
   *
   * 캐시된 img(complete)는 load 이벤트가 없어 decode()+rAF로 보강.
   * video는 메타데이터 전까지 높이가 0에 가까울 수 있어 동일 패턴으로 재측정.
   */
  useLayoutEffect(() => {
    if (isMultiWay) return;

    let cancelled = false;

    const getCardElements = () =>
      hasSameOptionCount
        ? [
            ...srcCardRefs.current.slice(0, leftChoicesLength),
            ...tgtCardRefs.current.slice(0, rightChoicesLength),
          ]
        : [
            ...srcOptionRefs.current.slice(0, leftChoicesLength),
            ...tgtOptionRefs.current.slice(0, rightChoicesLength),
          ];

    const handleMediaLayoutReady = () => {
      if (cancelled) return;
      requestAnimationFrame(() => {
        if (cancelled) return;
        const cardElements = getCardElements();

        cardElements.forEach((cardElement) => {
          if (cardElement) cardElement.style.transition = "none";
        });

        if (!hasSameOptionCount) {
          lockedShortColumnRef.current = null;
          flushSync(() => {
            setShortColumnMinHeights([]);
            setShortColumn(null);
          });
        }
        measureHeight();

        requestAnimationFrame(() => {
          cardElements.forEach((cardElement) => {
            if (cardElement) cardElement.style.transition = "";
          });
        });
      });
    };

    const cardEls = getCardElements();

    const imageLoadHandlers: Array<{ img: HTMLImageElement; handler: () => void }> = [];
    const videoAbortControllers: AbortController[] = [];

    cardEls.forEach((card) => {
      if (!card) return;

      card.querySelectorAll("img").forEach((img) => {
        if (img.complete) {
          const runDecode =
            typeof img.decode === "function"
              ? async () => img.decode()
              : async () => Promise.resolve();
          void runDecode()
            .then(() => {
              if (!cancelled) requestAnimationFrame(handleMediaLayoutReady);
            })
            .catch(() => {
              if (!cancelled) requestAnimationFrame(handleMediaLayoutReady);
            });
          return;
        }

        const handler = () => handleMediaLayoutReady();
        img.addEventListener("load", handler, { once: true });
        imageLoadHandlers.push({ img, handler });
      });

      card.querySelectorAll("video").forEach((video) => {
        if (video.readyState >= HTMLMediaElement.HAVE_METADATA) {
          void Promise.resolve().then(() => {
            if (!cancelled) requestAnimationFrame(handleMediaLayoutReady);
          });
          return;
        }
        const ac = new AbortController();
        videoAbortControllers.push(ac);
        let settled = false;
        const onReady = () => {
          if (settled) return;
          settled = true;
          ac.abort();
          handleMediaLayoutReady();
        };
        video.addEventListener("loadedmetadata", onReady, { signal: ac.signal });
        video.addEventListener("loadeddata", onReady, { signal: ac.signal });
      });
    });

    return () => {
      cancelled = true;
      imageLoadHandlers.forEach(({ img, handler }) => {
        img.removeEventListener("load", handler);
      });
      videoAbortControllers.forEach((ac) => ac.abort());
    };
  }, [
    isMultiWay,
    hasSameOptionCount,
    leftChoicesLength,
    rightChoicesLength,
    heightSyncKey,
    measureHeight,
    srcCardRefs,
    tgtCardRefs,
    srcOptionRefs,
    tgtOptionRefs,
  ]);

  /**
   * ResizeObserver: 뷰포트/디바이스 크기 변경에 반응.
   *
   * 문제: minHeight가 적용된 상태에서 뷰포트가 넓어지면 카드 자연 높이가 줄어들어도
   * offsetHeight = minHeight(고정값)이 되어 감지 불가 → 높이가 고정됨.
   *
   * 해결: flushSync로 minHeight 초기화 → 브라우저 페인트 없이 DOM 즉시 반영
   *       → 같은 rAF 내에서 자연 높이 측정 → 올바른 minHeight 재적용
   *       → rAF 종료 후 브라우저가 최종 상태만 한 번 페인트 (flash/버벅임 없음)
   */
  useLayoutEffect(() => {
    const el = gridContainerRef.current;
    if (!el || isMultiWay) return;
    let rafId = 0;
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;

      // 컨테이너의 너비만 체크 (높이는 내부 콘텐츠에 따라 변하므로 무시)
      const newWidth = entry.contentRect.width;
      const prevWidth = prevContainerWidthRef.current;

      // 너비가 실제로 변했을 때만 재측정 (1px 이상 차이)
      if (Math.abs(newWidth - prevWidth) < 1) {
        return; // 높이 변화나 내부 콘텐츠 변화는 무시
      }

      // 너비 업데이트
      prevContainerWidthRef.current = newWidth;

      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        // CSS transition(min-height 200ms)이 활성 상태에서 offsetHeight를 읽으면
        // T=0 시점의 시작 값(이전 큰 minHeight)을 반환해 측정이 틀림.
        // → 측정 구간만 transition 비활성화, 측정 후 복원하면 새 minHeight에 애니메이션 적용됨.
        const cardEls = hasSameOptionCount
          ? [
              ...srcCardRefs.current.slice(0, leftChoicesLength),
              ...tgtCardRefs.current.slice(0, rightChoicesLength),
            ]
          : [
              ...srcOptionRefs.current.slice(0, leftChoicesLength),
              ...tgtOptionRefs.current.slice(0, rightChoicesLength),
            ];
        cardEls.forEach((card) => {
          if (card) card.style.transition = "none";
        });

        if (hasSameOptionCount) {
          flushSync(() => setRowHeights([]));
          measureHeight();
        } else {
          lockedShortColumnRef.current = null;
          flushSync(() => {
            setShortColumnMinHeights([]);
            setShortColumn(null);
          });
          measureHeight();
        }

        // transition 복원: React가 새 minHeight를 적용할 때 애니메이션이 동작하도록
        cardEls.forEach((card) => {
          if (card) card.style.transition = "";
        });
      });
    });
    observer.observe(el);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(rafId);
    };
  }, [
    isMultiWay,
    hasSameOptionCount,
    leftChoicesLength,
    rightChoicesLength,
    heightSyncKey,
    measureHeight,
    gridContainerRef,
    srcCardRefs,
    tgtCardRefs,
    srcOptionRefs,
    tgtOptionRefs,
  ]);

  return {
    rowHeights,
    shortColumn,
    shortColumnMinHeights,
  };
};
