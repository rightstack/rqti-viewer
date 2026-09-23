import { type ReactNode, useEffect, useMemo, useRef, useState } from "react";
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

type SlotHosts = {
  generation: string;
  byId: Record<string, Element>;
};

function hostsUnchanged(
  prev: SlotHosts,
  generation: string,
  next: Record<string, Element>
): boolean {
  if (prev.generation !== generation) return false;
  const prevIds = Object.keys(prev.byId);
  const nextIds = Object.keys(next);
  if (prevIds.length !== nextIds.length) return false;
  return nextIds.every((id) => prev.byId[id] === next[id]);
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
  const rootRef = useRef<HTMLSpanElement>(null);
  const [hosts, setHosts] = useState<SlotHosts>({ generation: "", byId: {} });
  const slotted = useMemo(
    () => toTypesetSlotLatex(latex, instanceId, slotScale, contentDrivenSlots, slotContentEm),
    [contentDrivenSlots, instanceId, latex, slotContentEm, slotScale]
  );
  const generation = `${instanceId}\u0000${slotted.latex}`;
  const typeset = useMemo(
    () =>
      renderLaTeX(slotted.latex, `math-blank-formula-${instanceId}-${slotted.latex}`, false, false),
    [instanceId, slotted.latex]
  );
  const currentHosts = hosts.generation === generation ? hosts.byId : {};
  const hostsFound =
    slotted.ids.length === 0 || slotted.ids.every((id) => currentHosts[id] instanceof Element);
  /** 이번 조판이 끝났는지. 끝났는데 슬롯이 없으면 식을 못 세운 것이다. */
  const [typesetDoneAt, setTypesetDoneAt] = useState("");
  const typesetDone = typesetDoneAt === generation;

  const [holdExpired, setHoldExpired] = useState(false);
  useEffect(() => {
    if (!awaitingMeasure) return;
    const timer = window.setTimeout(() => setHoldExpired(true), MEASURE_HOLD_MS);
    return () => window.clearTimeout(timer);
  }, [awaitingMeasure]);

  const slotsReady = hostsFound && (!awaitingMeasure || holdExpired);

  /** 조판을 기다리는 동안 fallback은 자리만 잡고 감춘다. 조판이 실패했을 때만 드러낸다. */
  const [timedOutAt, setTimedOutAt] = useState("");
  useEffect(() => {
    if (slotsReady) return;
    const timer = window.setTimeout(() => setTimedOutAt(generation), FALLBACK_REVEAL_MS);
    return () => window.clearTimeout(timer);
  }, [generation, slotsReady]);
  const fallbackVisible = (typesetDone && !hostsFound) || timedOutAt === generation;

  useEffect(() => {
    const root = rootRef.current;
    if (!root || slotted.ids.length === 0) return;

    const scan = () => {
      const next: Record<string, Element> = {};
      for (const id of slotted.ids) {
        const el = root.querySelector(`#${CSS.escape(mathBlankSlotId(instanceId, id))}`);
        if (el) next[id] = el;
      }
      if (root.querySelector("mjx-container")) setTypesetDoneAt(generation);
      setHosts((prev) =>
        hostsUnchanged(prev, generation, next) ? prev : { generation, byId: next }
      );
    };

    scan();
    const observer = new MutationObserver(scan);
    observer.observe(root, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, [generation, instanceId, slotted.ids]);

  const hasCancel = latex.includes("\\cancel");

  return (
    <span
      className={clsx(
        "qti-ext-math-blank-formula",
        hasCancel && "qti-ext-math-blank-formula--cancel"
      )}
    >
      <span
        ref={rootRef}
        className="qti-ext-math-blank-formula__typeset"
        data-ready={slotsReady ? "true" : "false"}
        aria-hidden={slotsReady ? undefined : true}
      >
        {typeset}
        {slotted.ids.map((id) => {
          const host = currentHosts[id];
          return host ? createPortal(renderSlot(id), host, id) : null;
        })}
      </span>
      {slotsReady ? null : (
        <span
          className="qti-ext-math-blank-formula__fallback"
          data-visible={fallbackVisible ? "true" : "false"}
          aria-hidden={fallbackVisible ? undefined : true}
        >
          {fallback}
        </span>
      )}
    </span>
  );
}
