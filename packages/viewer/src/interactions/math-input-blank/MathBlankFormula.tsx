import { type ReactNode, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { renderLaTeX } from "../../parser/parseLatexToReact";
import { mathBlankSlotId, toTypesetSlotLatex } from "./mathBlankLatex";

type MathBlankFormulaProps = {
  latex: string;
  instanceId: string;
  renderSlot: (id: string) => ReactNode;
  fallback: ReactNode;
  slotScale?: number;
};

function hostsUnchanged(prev: Record<string, Element>, next: Record<string, Element>): boolean {
  const prevIds = Object.keys(prev);
  const nextIds = Object.keys(next);
  if (prevIds.length !== nextIds.length) return false;
  return nextIds.every((id) => prev[id] === next[id]);
}

/** 식 조판 후 `\\cssId` 슬롯에 input/display를 포털한다. 슬롯을 못 찾으면 fallback. */
export function MathBlankFormula({
  latex,
  instanceId,
  renderSlot,
  fallback,
  slotScale = 1,
}: MathBlankFormulaProps) {
  const rootRef = useRef<HTMLSpanElement>(null);
  const [hosts, setHosts] = useState<Record<string, Element>>({});
  const slotted = useMemo(
    () => toTypesetSlotLatex(latex, instanceId, slotScale),
    [instanceId, latex, slotScale]
  );
  const slotsReady =
    slotted.ids.length === 0 || slotted.ids.every((id) => hosts[id] instanceof Element);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const scan = () => {
      const next: Record<string, Element> = {};
      for (const id of slotted.ids) {
        const el = root.querySelector(`#${CSS.escape(mathBlankSlotId(instanceId, id))}`);
        if (el) next[id] = el;
      }
      setHosts((prev) => (hostsUnchanged(prev, next) ? prev : next));
    };

    scan();
    const observer = new MutationObserver(scan);
    observer.observe(root, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, [instanceId, slotted.ids, slotted.latex]);

  return (
    <span className="qti-ext-math-blank-formula">
      <span
        ref={rootRef}
        className="qti-ext-math-blank-formula__typeset"
        data-ready={slotsReady ? "true" : "false"}
        aria-hidden={slotsReady ? undefined : true}
      >
        {renderLaTeX(slotted.latex, `math-blank-formula-${instanceId}`, false)}
        {slotted.ids.map((id) => {
          const host = hosts[id];
          return host ? createPortal(renderSlot(id), host, id) : null;
        })}
      </span>
      {slotsReady ? null : fallback}
    </span>
  );
}
