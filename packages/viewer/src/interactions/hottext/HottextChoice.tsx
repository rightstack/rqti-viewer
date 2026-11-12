import { type ReactNode, type RefObject, useLayoutEffect, useRef, useState } from "react";
import { Circle, Triangle } from "lucide-react";
import { cn } from "../../lib/utils";
import type { HottextChoiceStyle, HottextMarkTone, HottextMarkerShape } from "./hottextRules";

interface HottextChoiceProps {
  identifier: string;
  tone: HottextMarkTone | null;
  studentShape: HottextMarkerShape | null;
  expectedShape: HottextMarkerShape | null;
  /** 채점 전 정답 표시는 선택색, 제출 후 정답 표시는 정답색이다. */
  expectedTone?: HottextMarkTone;
  pressed: boolean;
  interactive: boolean;
  hasMath: boolean;
  hasImage: boolean;
  fitsOneCharacter: boolean;
  /** 선택 영역 표시. 투명은 본문과 같은 글자다. */
  choiceStyle: HottextChoiceStyle;
  answerKey?: boolean;
  markName?: string;
  onToggle: (identifier: string) => void;
  children: ReactNode;
}

function contentOffset(box: DOMRect, host: DOMRect): number {
  return box.top + box.height / 2 - (host.top + host.height / 2);
}

function typesetMath(root: HTMLElement): HTMLElement | null {
  return root.querySelector<HTMLElement>("mjx-container > mjx-math");
}

/** 크기는 테마 글자 크기 CSS가 정한다. 여기선 본문 중앙에 맞출 위치만 잰다. */
function measureMarkOffset(root: HTMLElement, hasMath: boolean, hasImage: boolean): number {
  const host = root.getBoundingClientRect();
  if (hasImage) {
    const images = root.querySelectorAll("img");
    let left = Number.POSITIVE_INFINITY;
    let top = Number.POSITIVE_INFINITY;
    let right = Number.NEGATIVE_INFINITY;
    let bottom = Number.NEGATIVE_INFINITY;

    images.forEach((image) => {
      const box = image.getBoundingClientRect();
      if (box.width <= 0 || box.height <= 0) return;
      left = Math.min(left, box.left);
      top = Math.min(top, box.top);
      right = Math.max(right, box.right);
      bottom = Math.max(bottom, box.bottom);
    });

    if (right <= left || bottom <= top) return 0;
    return contentOffset(new DOMRect(left, top, right - left, bottom - top), host);
  }

  const target = hasMath ? typesetMath(root) : root.querySelector(".qti-ext-hottext-label");
  const box = target?.getBoundingClientRect();
  if (!box || box.height <= 0) return 0;
  return contentOffset(box, host);
}

function HottextMark({
  shape,
  tone,
  hasMath,
  hasImage,
  raised,
  rootRef,
}: {
  shape: HottextMarkerShape;
  tone: HottextMarkTone;
  hasMath: boolean;
  hasImage: boolean;
  /** 학생 도형과 겹치지 않게 기대 도형을 위로 올린다. */
  raised: boolean;
  rootRef: RefObject<HTMLButtonElement | null>;
}) {
  const markRef = useRef<HTMLSpanElement>(null);

  useLayoutEffect(() => {
    const root = rootRef.current;
    const markNode = markRef.current;
    if (!root || !markNode || root.classList.contains("qti-ext-hottext--short")) return undefined;

    const measure = () => {
      const offset = measureMarkOffset(root, hasMath, hasImage);
      const lift = raised ? " - 0.55em" : "";
      markNode.style.transform = `translate(-50%, calc(-50% + ${offset}px${lift}))`;
    };

    const resizeObserver = new ResizeObserver(measure);
    const observeSize = () => {
      resizeObserver.disconnect();
      resizeObserver.observe(root);
      const label = root.querySelector(".qti-ext-hottext-label");
      if (label) resizeObserver.observe(label);
      const math = typesetMath(root);
      if (math) resizeObserver.observe(math);
      root.querySelectorAll("img").forEach((image) => resizeObserver.observe(image));
    };

    measure();
    observeSize();
    const mutationObserver = new MutationObserver(() => {
      observeSize();
      measure();
    });
    mutationObserver.observe(root, { childList: true, subtree: true, characterData: true });

    return () => {
      resizeObserver.disconnect();
      mutationObserver.disconnect();
    };
  }, [hasImage, hasMath, raised, rootRef]);

  const className = cn(
    "qti-ext-hottext-mark",
    shape === "circle" ? "qti-ext-hottext-circle" : "qti-ext-hottext-triangle-box",
    `qti-ext-hottext-mark--${tone}`,
    raised && "qti-ext-hottext-mark--expected"
  );
  const Icon = shape === "triangle" ? Triangle : Circle;

  return (
    <span ref={markRef} className={className} aria-hidden>
      <Icon className="qti-ext-hottext-mark-icon" aria-hidden />
    </span>
  );
}

export function HottextChoice({
  identifier,
  tone,
  studentShape,
  expectedShape,
  expectedTone = "selected",
  pressed,
  interactive,
  hasMath,
  hasImage,
  fitsOneCharacter,
  choiceStyle,
  answerKey = false,
  markName,
  onToggle,
  children,
}: HottextChoiceProps) {
  const rootRef = useRef<HTMLButtonElement>(null);
  const [mathReady, setMathReady] = useState(false);

  useLayoutEffect(() => {
    if (!hasMath) return undefined;
    const root = rootRef.current;
    if (!root) return undefined;

    const markReady = () => {
      const height = typesetMath(root)?.getBoundingClientRect().height ?? 0;
      if (height <= 0) return;
      setMathReady(true);
    };
    const resizeObserver = new ResizeObserver(markReady);
    const observeMath = () => {
      resizeObserver.disconnect();
      resizeObserver.observe(typesetMath(root) ?? root);
    };
    const mutationObserver = new MutationObserver(() => {
      observeMath();
      markReady();
    });
    mutationObserver.observe(root, { childList: true, subtree: true, characterData: true });
    observeMath();
    markReady();

    return () => {
      resizeObserver.disconnect();
      mutationObserver.disconnect();
    };
  }, [hasMath]);

  const marksReady = !hasMath || mathReady;

  return (
    <button
      ref={rootRef}
      type="button"
      className={cn(
        "qti-ext-hottext",
        choiceStyle === "block" && "qti-ext-hottext--choice-block",
        choiceStyle === "underline" && "qti-ext-hottext--choice-underline",
        choiceStyle === "transparent" && "qti-ext-hottext--choice-transparent",
        interactive && "qti-ext-hottext--interactive",
        hasMath && "qti-ext-hottext--math",
        hasImage && "qti-ext-hottext--image",
        fitsOneCharacter && !hasImage && "qti-ext-hottext--short"
      )}
      disabled={!interactive && !answerKey}
      aria-disabled={answerKey || undefined}
      tabIndex={answerKey ? -1 : undefined}
      aria-pressed={answerKey ? undefined : pressed}
      onClick={(event) => {
        if (answerKey) {
          event.preventDefault();
          return;
        }
        onToggle(identifier);
      }}
    >
      <span className="qti-ext-hottext-label">{children}</span>
      {markName ? <span className="rqti:sr-only">{markName}</span> : null}
      {marksReady && studentShape && tone ? (
        <HottextMark
          shape={studentShape}
          tone={tone}
          hasMath={hasMath}
          hasImage={hasImage}
          raised={false}
          rootRef={rootRef}
        />
      ) : null}
      {marksReady && expectedShape ? (
        <HottextMark
          shape={expectedShape}
          tone={expectedTone}
          hasMath={hasMath}
          hasImage={hasImage}
          raised={Boolean(studentShape)}
          rootRef={rootRef}
        />
      ) : null}
    </button>
  );
}
