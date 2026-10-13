import {
  type ReactNode,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import clsx from "clsx";
import { createPortal } from "react-dom";
import { renderLaTeX } from "../../parser/parseLatexToReact";
import { type SlotContentEm, mathBlankSlotId, toTypesetSlotLatex } from "./mathBlankLatex";

type MathBlankFormulaProps = {
  latex: string;
  instanceId: string;
  renderSlot: (id: string) => ReactNode;
  fallback: ReactNode;
  slotScale?: number;
  contentDrivenSlots?: boolean;
  /** 실측한 칸 크기. Rule(윗줄·화살표 폭)을 포털 상자에 맞춘다. */
  slotContentEm?: Record<string, SlotContentEm>;
  /** 실측 전 조판을 감춘다. 첫 조판은 Rule 폭이 아직 글자 수 기준이라 한 번 튄다. */
  awaitingMeasure?: boolean;
};

/** 실측이 안 와도 이 시간이 지나면 조판을 보여준다. 숨은 컨테이너에서는 크기가 0이라 안 온다. */
const MEASURE_HOLD_MS = 600;

/** 조판이 아예 안 뜨는 경우의 최후 보호. 빈 자리만 남는 것을 막는다. */
const FALLBACK_REVEAL_MS = 2500;

type FormulaLayer = {
  id: number;
  contentKey: string;
  instanceKey: string;
  typesetLatex: string;
  ids: string[];
};

function slotEmKey(slotContentEm?: Record<string, SlotContentEm>): string {
  if (!slotContentEm) return "";
  return Object.keys(slotContentEm)
    .sort()
    .map((id) => {
      const em = slotContentEm[id];
      return `${id}:${em.widthEm.toFixed(3)}x${em.heightEm.toFixed(3)}`;
    })
    .join(",");
}

function makeContentKey(
  instanceId: string,
  latex: string,
  slotScale: number,
  contentDrivenSlots: boolean,
  slotContentEm?: Record<string, SlotContentEm>
): string {
  return [
    instanceId,
    latex,
    String(slotScale),
    contentDrivenSlots ? "1" : "0",
    slotEmKey(slotContentEm),
  ].join("\u0000");
}

function createFormulaLayer(
  id: number,
  instanceId: string,
  latex: string,
  slotScale: number,
  contentDrivenSlots: boolean,
  slotContentEm?: Record<string, SlotContentEm>
): FormulaLayer {
  const instanceKey = `${instanceId}g${id}`;
  const slotted = toTypesetSlotLatex(
    latex,
    instanceKey,
    slotScale,
    contentDrivenSlots,
    slotContentEm
  );
  return {
    id,
    contentKey: makeContentKey(instanceId, latex, slotScale, contentDrivenSlots, slotContentEm),
    instanceKey,
    typesetLatex: slotted.latex,
    ids: slotted.ids,
  };
}

function hostsUnchanged(prev: Record<string, Element>, next: Record<string, Element>): boolean {
  const prevIds = Object.keys(prev);
  const nextIds = Object.keys(next);
  if (prevIds.length !== nextIds.length) return false;
  return nextIds.every((id) => prev[id] === next[id]);
}

function hostHasSlot(host: Element): boolean {
  return !!host.querySelector(
    ".qti-ext-math-blank-field, .qti-ext-input-blank, .qti-ext-math-keyboard, .qti-ext-math-blank-inline"
  );
}

type FormulaTypesetLayerProps = {
  layer: FormulaLayer;
  active: boolean;
  renderSlot: (id: string) => ReactNode;
  onHostsReady?: (layerId: number, ready: boolean) => void;
  onPainted?: (layerId: number, painted: boolean) => void;
};

/**
 * 한 세대의 식 조판. 키를 세대 id로 고정해, 숨김→표시로 바뀌어도 MathJax를 다시 세우지 않는다.
 * 포털은 보이는 세대에만 붙인다. 숨긴 세대에 붙이면 0 크기 실측이 올라온다.
 */
function FormulaTypesetLayer({
  layer,
  active,
  renderSlot,
  onHostsReady,
  onPainted,
}: FormulaTypesetLayerProps) {
  const rootRef = useRef<HTMLSpanElement>(null);
  const onHostsReadyRef = useRef(onHostsReady);
  const onPaintedRef = useRef(onPainted);
  useLayoutEffect(() => {
    onHostsReadyRef.current = onHostsReady;
    onPaintedRef.current = onPainted;
  });
  const [hosts, setHosts] = useState<Record<string, Element>>({});
  const [painted, setPainted] = useState(false);
  const typeset = useMemo(
    () => renderLaTeX(layer.typesetLatex, `math-blank-formula-${layer.instanceKey}`, false, false),
    [layer.instanceKey, layer.typesetLatex]
  );

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const scan = () => {
      const next: Record<string, Element> = {};
      for (const id of layer.ids) {
        const el = root.querySelector(`#${CSS.escape(mathBlankSlotId(layer.instanceKey, id))}`);
        if (el) next[id] = el;
      }
      setHosts((prev) => (hostsUnchanged(prev, next) ? prev : next));
      setPainted(
        layer.ids.length === 0 ||
          layer.ids.every((id) => next[id] instanceof Element && hostHasSlot(next[id]))
      );
    };

    scan();
    const observer = new MutationObserver(scan);
    observer.observe(root, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, [layer.id, layer.ids, layer.instanceKey]);

  const hostsFound =
    layer.ids.length === 0 || layer.ids.every((id) => hosts[id] instanceof Element);

  useEffect(() => {
    onHostsReadyRef.current?.(layer.id, hostsFound);
  }, [hostsFound, layer.id]);

  useEffect(() => {
    onPaintedRef.current?.(layer.id, active && painted);
  }, [active, layer.id, painted]);

  return (
    <span
      ref={rootRef}
      className="qti-ext-math-blank-formula__typeset"
      data-ready={active && painted ? "true" : "false"}
      aria-hidden={active && painted ? undefined : true}
    >
      {typeset}
      {active
        ? layer.ids.map((id) => {
            const host = hosts[id];
            return host ? createPortal(renderSlot(id), host, `${layer.id}-${id}`) : null;
          })
        : null}
    </span>
  );
}

/** 식 조판 후 `\\cssId` 슬롯에 input/display를 포털한다. 슬롯을 못 찾으면 fallback. */
export function MathBlankFormula({
  latex,
  instanceId,
  renderSlot,
  fallback,
  slotScale = 1,
  contentDrivenSlots = false,
  slotContentEm,
  awaitingMeasure = false,
}: MathBlankFormulaProps) {
  const [layerSeq, setLayerSeq] = useState(0);
  const [visible, setVisible] = useState<FormulaLayer | null>(null);
  const [pending, setPending] = useState<FormulaLayer | null>(() =>
    createFormulaLayer(0, instanceId, latex, slotScale, contentDrivenSlots, slotContentEm)
  );
  const [pendingHostsReady, setPendingHostsReady] = useState(false);
  const [visiblePainted, setVisiblePainted] = useState(false);
  const pendingIdRef = useRef<number | null>(pending?.id ?? null);
  useLayoutEffect(() => {
    pendingIdRef.current = pending?.id ?? null;
  });
  const contentKey = makeContentKey(
    instanceId,
    latex,
    slotScale,
    contentDrivenSlots,
    slotContentEm
  );

  /**
   * Rule 크기가 바뀌면 조판 키가 갈린다. 보이는 세대의 포털은 그대로 두고,
   * 다음 세대를 숨긴 채 세운 뒤 슬롯이 준비되면 한 커밋에서 바꾼다.
   * 같은 트리에서 조판과 포털을 같이 갈면 호스트가 먼저 사라져 removeChild가 난다.
   */
  if (visible?.contentKey === contentKey) {
    if (pending !== null) {
      setPending(null);
      setPendingHostsReady(false);
    }
  } else if (pending?.contentKey !== contentKey && !(visible && !visiblePainted)) {
    const nextId = layerSeq + 1;
    setLayerSeq(nextId);
    setPendingHostsReady(false);
    setPending(
      createFormulaLayer(nextId, instanceId, latex, slotScale, contentDrivenSlots, slotContentEm)
    );
  }

  const handleHostsReady = useCallback((layerId: number, ready: boolean) => {
    if (layerId !== pendingIdRef.current) return;
    setPendingHostsReady((prev) => (prev === ready ? prev : ready));
  }, []);

  const handlePainted = useCallback(
    (layerId: number, painted: boolean) => {
      setVisiblePainted((prev) => {
        if (visible?.id !== layerId) return prev;
        return prev === painted ? prev : painted;
      });
    },
    [visible?.id]
  );

  const [holdExpired, setHoldExpired] = useState(false);
  useEffect(() => {
    if (!awaitingMeasure) return;
    const timer = window.setTimeout(() => setHoldExpired(true), MEASURE_HOLD_MS);
    return () => window.clearTimeout(timer);
  }, [awaitingMeasure]);

  const pendingReady =
    pending !== null &&
    pendingHostsReady &&
    pending.contentKey === contentKey &&
    (!awaitingMeasure || holdExpired);

  if (pendingReady && pending && visible?.contentKey !== contentKey) {
    setVisible(pending);
    setPending(null);
    setPendingHostsReady(false);
    setVisiblePainted(false);
  }

  const [everPainted, setEverPainted] = useState(false);
  if (visiblePainted && !everPainted) setEverPainted(true);
  const waitingForFirst = !everPainted;
  const [timedOutAt, setTimedOutAt] = useState<number | null>(null);
  useEffect(() => {
    if (!waitingForFirst) return;
    const generation = pending?.id ?? visible?.id ?? -1;
    const timer = window.setTimeout(() => setTimedOutAt(generation), FALLBACK_REVEAL_MS);
    return () => window.clearTimeout(timer);
  }, [pending?.id, visible?.id, waitingForFirst]);
  /** 조판 도중 fallback을 드러내면 빈칸 마커가 깜빡인다. 실패·타임아웃만 보여 준다. */
  const fallbackVisible = waitingForFirst && timedOutAt === (pending?.id ?? visible?.id ?? -1);

  const layers: FormulaLayer[] = [];
  if (visible) layers.push(visible);
  if (pending && pending.id !== visible?.id) layers.push(pending);

  const hasCancel = latex.includes("\\cancel");

  return (
    <span
      className={clsx(
        "qti-ext-math-blank-formula",
        hasCancel && "qti-ext-math-blank-formula--cancel"
      )}
    >
      {layers.map((layer) => {
        const isPending = layer.id === pending?.id;
        return (
          <FormulaTypesetLayer
            key={layer.id}
            layer={layer}
            active={layer.id === visible?.id}
            renderSlot={renderSlot}
            onHostsReady={isPending ? handleHostsReady : undefined}
            onPainted={layer.id === visible?.id ? handlePainted : undefined}
          />
        );
      })}
      {waitingForFirst ? (
        <span
          className="qti-ext-math-blank-formula__fallback"
          data-visible={fallbackVisible ? "true" : "false"}
          aria-hidden={fallbackVisible ? undefined : true}
        >
          {fallback}
        </span>
      ) : null}
    </span>
  );
}
