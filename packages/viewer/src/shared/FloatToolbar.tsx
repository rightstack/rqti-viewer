import {
  type ReactNode,
  type PointerEvent as ReactPointerEvent,
  type RefObject,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { GripVertical, Info } from "lucide-react";
import { createPortal } from "react-dom";
import { Tooltip, TooltipContent, TooltipTrigger } from "../components/ui/tooltip";
import { cn } from "../lib/utils";

const VIEWPORT_PAD = 8;

interface ToolbarPosition {
  x: number;
  y: number;
}

function clampToolbar(x: number, y: number, panel: HTMLElement): ToolbarPosition {
  const maxX = window.innerWidth - panel.offsetWidth - VIEWPORT_PAD;
  const maxY = window.innerHeight - panel.offsetHeight - VIEWPORT_PAD;
  return {
    x: Math.min(Math.max(VIEWPORT_PAD, x), Math.max(VIEWPORT_PAD, maxX)),
    y: Math.min(Math.max(VIEWPORT_PAD, y), Math.max(VIEWPORT_PAD, maxY)),
  };
}

export interface FloatToolbarTool {
  id: string;
  label: string;
  icon: ReactNode;
}

type FloatToolbarSide = "top" | "right";

interface FloatToolbarProps {
  tools: readonly FloatToolbarTool[];
  selectedId: string;
  anchorRef: RefObject<HTMLElement | null>;
  anchorReady: boolean;
  /** 처음 붙는 위치. right는 이미지 오른쪽이고, 공간이 없으면 왼쪽에 둔다. */
  side?: FloatToolbarSide;
  label?: string;
  moveLabel?: string;
  hint?: string;
  onSelect: (id: string) => void;
}

function placeToolbar(rect: DOMRect, panel: HTMLElement, side: FloatToolbarSide): ToolbarPosition {
  const gap = 8;
  if (side === "right") {
    const rightX = rect.right + gap;
    const fitsRight = rightX + panel.offsetWidth <= window.innerWidth - VIEWPORT_PAD;
    if (fitsRight) return clampToolbar(rightX, rect.top, panel);
    const leftX = rect.left - gap - panel.offsetWidth;
    if (leftX >= VIEWPORT_PAD) return clampToolbar(leftX, rect.top, panel);
    return clampToolbar(
      rect.left + rect.width / 2 - panel.offsetWidth / 2,
      rect.bottom + gap,
      panel
    );
  }
  return clampToolbar(
    rect.left + rect.width / 2 - panel.offsetWidth / 2,
    rect.top - panel.offsetHeight - gap,
    panel
  );
}

/** 화면 안에서 옮기는 도구 막대. 버튼 내용만 바꾸면 핫스팟, 핫텍스트, 컬러링, 드로잉이 같이 쓴다. */
export function FloatToolbar({
  tools,
  selectedId,
  anchorRef,
  anchorReady,
  side = "top",
  label = "도구",
  moveLabel = "도구 이동",
  hint,
  onSelect,
}: FloatToolbarProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const [scopeEl, setScopeEl] = useState<HTMLDivElement | null>(null);
  const hintFontRef = useRef("");
  const [hintFont, setHintFont] = useState<string>();
  const dragRef = useRef<{
    pointerX: number;
    pointerY: number;
    x: number;
    y: number;
    latest: ToolbarPosition;
  } | null>(null);
  const [position, setPosition] = useState<ToolbarPosition | null>(null);

  useLayoutEffect(() => {
    const place = () => {
      const panel = panelRef.current;
      const anchor = anchorRef.current;
      if (!panel || !anchor) return;
      const themeRoot = anchor.closest(".qti-ext-wrapper") ?? anchor;
      const themeStyle = getComputedStyle(themeRoot);
      for (const name of ["--qti-option-border-selected", "--qti-font-family"]) {
        const value = themeStyle.getPropertyValue(name).trim();
        if (value) panel.style.setProperty(name, value);
      }
      const fontFamily = themeStyle.getPropertyValue("--qti-font-family").trim();
      if (fontFamily && fontFamily !== hintFontRef.current) {
        hintFontRef.current = fontFamily;
        setHintFont(fontFamily);
      }
      const rect = anchor.getBoundingClientRect();
      if (rect.width <= 0 || panel.offsetWidth <= 0) return;
      const next = placeToolbar(rect, panel, side);
      setPosition((prev) => {
        const kept = prev ? clampToolbar(prev.x, prev.y, panel) : next;
        if (prev && prev.x === kept.x && prev.y === kept.y) return prev;
        return kept;
      });
    };
    place();
    const anchor = anchorRef.current;
    if (!anchor || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(place);
    observer.observe(anchor);
    return () => observer.disconnect();
  }, [anchorReady, anchorRef, side, tools]);

  useLayoutEffect(() => {
    const onResize = () => {
      const panel = panelRef.current;
      if (!panel) return;
      setPosition((prev) => (prev ? clampToolbar(prev.x, prev.y, panel) : prev));
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const onPanelPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.button !== 0) return;
    const target = event.target;
    if (target instanceof Element && target.closest("button")) return;
    const panel = panelRef.current;
    if (!panel) return;
    event.preventDefault();
    const rect = panel.getBoundingClientRect();
    const drag = {
      pointerX: event.clientX,
      pointerY: event.clientY,
      x: rect.left,
      y: rect.top,
      latest: { x: rect.left, y: rect.top },
    };
    dragRef.current = drag;
    panel.setAttribute("data-dragging", "true");

    const onMove = (moveEvent: PointerEvent) => {
      const current = dragRef.current;
      const node = panelRef.current;
      if (!current || !node) return;
      const next = clampToolbar(
        current.x + moveEvent.clientX - current.pointerX,
        current.y + moveEvent.clientY - current.pointerY,
        node
      );
      current.latest = next;
      setPosition(next);
    };
    const onUp = () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
      const latest = dragRef.current?.latest ?? null;
      dragRef.current = null;
      panelRef.current?.removeAttribute("data-dragging");
      if (latest) setPosition(latest);
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
  };

  if (typeof document === "undefined") return null;

  const viewerScope = anchorRef.current?.closest(".rqti-viewer");

  return createPortal(
    <div
      ref={setScopeEl}
      className={cn("rqti-viewer", viewerScope?.classList.contains("dark") && "dark")}
      style={{
        position: "fixed",
        inset: 0,
        width: 0,
        height: 0,
        overflow: "visible",
        pointerEvents: "none",
      }}
    >
      <div
        ref={panelRef}
        className="qti-ext-float-toolbar"
        style={{
          visibility: position ? "visible" : "hidden",
          left: position ? `${position.x}px` : undefined,
          top: position ? `${position.y}px` : undefined,
          pointerEvents: "auto",
        }}
        role="toolbar"
        aria-label={label}
        onPointerDown={onPanelPointerDown}
      >
        <div className="qti-ext-float-toolbar__tools">
          <div className="qti-ext-float-toolbar__handle" role="separator" aria-label={moveLabel}>
            <GripVertical aria-hidden="true" />
          </div>
          {tools.map((item) => (
            <button
              key={item.id}
              type="button"
              className="qti-ext-float-toolbar__tool"
              aria-label={item.label}
              aria-pressed={selectedId === item.id}
              onClick={() => onSelect(item.id)}
            >
              {item.icon}
            </button>
          ))}
          {hint ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <button type="button" className="qti-ext-float-toolbar__hint" aria-label="안내">
                  <Info aria-hidden="true" />
                </button>
              </TooltipTrigger>
              <TooltipContent
                container={scopeEl}
                side="top"
                sideOffset={8}
                className="rqti:z-10060 rqti:w-max rqti:text-left rqti:text-wrap rqti:whitespace-pre-line"
                style={{
                  width: "max-content",
                  whiteSpace: "pre-line",
                  textWrap: "wrap",
                  pointerEvents: "auto",
                  ...(hintFont ? { fontFamily: hintFont } : {}),
                }}
              >
                {hint}
              </TooltipContent>
            </Tooltip>
          ) : null}
        </div>
      </div>
    </div>,
    document.body
  );
}
