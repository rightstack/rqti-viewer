import {
  type ReactNode,
  type PointerEvent as ReactPointerEvent,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import clsx from "clsx";
import { Pencil } from "lucide-react";
import {
  MathKeyboard,
  type MathKeyboardContentSize,
  type MathLevel,
} from "../../math-keyboard";
import {
  MATH_BLANK_DISPLAY_SCALE,
  type SlotContentEm,
  VCQ_COLUMN_WIDTH_SCALE,
  VCQ_FORMULA_SLOT_SCALE,
  markerSlotWidthEm,
  markerSlotWidthPx,
} from "./mathBlankLatex";
import { measureTextContentWidth, readBoxExtras } from "./slotMeasure";
import { type BlankVariant, getBlankVariantClass } from "./utils";

type FormulaSlotInputProps = {
  id: string;
  value: string;
  /** `\inputblank{ID}{N}` 의 N — 최소 N글자 폭 */
  widthCh?: number;
  readOnly: boolean;
  onChange: (id: string, value: string) => void;
  stateClassName?: string;
  fitFormulaHost?: boolean;
  /** 키패드 최근 기호 저장 범위. 보통 문항 키. */
  historyScope?: string;
  level?: MathLevel | null;
  /** 맞춘 칸 크기를 알린다. 식 쪽 `\Rule`을 같은 크기로 다시 만들어 식과 빈칸이 겹치지 않게 한다. */
  onContentEm?: (em: SlotContentEm) => void;
};

function clearSlotInlineSize(slot: HTMLElement) {
  slot.style.width = "";
  slot.style.minWidth = "";
  slot.style.height = "";
  slot.style.minHeight = "";
}

/** 답 라벨 안의 분수·지수·근호만. 칸을 감싼 식의 분수는 조상이지 자손이 아니다. */
const TALL_ANSWER_SELECTOR =
  "mjx-mfrac, mjx-msup, mjx-msub, mjx-msubsup, mjx-msqrt, mjx-mroot";

function hasSlotChildren(children: ReactNode): boolean {
  return children !== null && children !== undefined && children !== false;
}

/** 공란은 `\Rule` 폭을 유지하고 높이만 기본 칸으로 둔다. 실측을 올리면 식 조판이 다시 돈다. */
function pinVcqBaseHeight(slot: HTMLElement, fontSize: number, scale: number) {
  const height = `${Math.ceil(markerSlotWidthPx(1, fontSize) * scale)}px`;
  slot.style.width = "";
  slot.style.minWidth = "";
  slot.style.height = height;
  slot.style.minHeight = height;
}

/** 슬롯을 채우는 라벨 박스가 아니라, 조판된 수식이나 글자의 고유 크기만 잰다. */
function readSlotContentSize(
  content: HTMLElement,
): { w: number; h: number } | "pending" | "empty" {
  const hasMathHost = !!content.querySelector(
    ".qti-ext-mathfield, mjx-container",
  );
  const typeset = content.querySelector<HTMLElement>("mjx-math");
  if (hasMathHost && !typeset) return "pending";
  if (typeset) {
    const rect = typeset.getBoundingClientRect();
    return { w: rect.width, h: rect.height };
  }
  if (!content.textContent?.trim()) return "empty";

  const range = document.createRange();
  range.selectNodeContents(content);
  const rect = range.getBoundingClientRect();
  range.detach();
  return { w: rect.width, h: rect.height };
}

function applySlotBox(slot: HTMLElement, targetW: number, targetH: number) {
  const w = Math.ceil(targetW);
  const h = Math.ceil(targetH);
  const width = `${w}px`;
  const height = `${h}px`;
  if (slot.style.width !== width || slot.style.height !== height) {
    slot.style.width = width;
    slot.style.minWidth = width;
    slot.style.height = height;
    slot.style.minHeight = height;
  }
  const math = slot.closest<HTMLElement>("mjx-math");
  if (math) {
    math.style.width = "max-content";
    math.style.maxWidth = "none";
  }
  const container =
    math?.closest<HTMLElement>("mjx-container") ??
    slot.closest<HTMLElement>("mjx-container");
  if (container) {
    container.style.width = "max-content";
    container.style.maxWidth = "none";
  }
  return { w, h };
}

/** 적용한 칸 크기를 em으로 돌려준다. 이 값을 `\Rule`에 넣으면 윗줄이 칸과 같아진다. */
function fitSlotToContent(
  box: HTMLElement,
  blankStyle: CSSStyleDeclaration,
  contentW: number,
  contentH: number,
  widthCh: number | undefined,
  scale = 1,
): SlotContentEm {
  const { padX, padY, borderX, borderY } = readBoxExtras(blankStyle);
  const fontSize = parseFloat(blankStyle.fontSize) || 16;
  const inVcq = Boolean(box.closest(".qti-ext-vcq-grid"));
  const widthScale = inVcq ? VCQ_COLUMN_WIDTH_SCALE : scale;
  const baseWidth = markerSlotWidthPx(widthCh, fontSize) * widthScale;
  const baseHeight = markerSlotWidthPx(1, fontSize) * scale;
  const applied = applySlotBox(
    box,
    Math.max(
      baseWidth,
      contentW + (inVcq ? padX + borderX : Math.max(padX + borderX, fontSize)),
    ),
    Math.max(baseHeight, contentH + padY + borderY),
  );
  return { widthEm: applied.w / fontSize, heightEm: applied.h / fontSize };
}

export function FormulaSlotInput({
  id,
  value,
  widthCh,
  readOnly,
  onChange,
  stateClassName,
  fitFormulaHost = false,
  historyScope,
  level,
  onContentEm,
}: FormulaSlotInputProps) {
  const wrapperRef = useRef<HTMLSpanElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const useKeypad = level === "middle" || level === "high";
  const showPencil = !readOnly && value === "";
  /** VCQ(세로셈) 수식 빈칸만 빈 슬롯을 축소한다. 일반 수식 빈칸은 1(그대로). 입력이 길어지면
   *  applySlotBox가 내용 크기로 키우므로 성장은 유지되고 빈 상태만 standalone과 같은 크기가 된다. */
  const hostScale = fitFormulaHost ? VCQ_FORMULA_SLOT_SCALE : 1;
  const hostWidthScale = fitFormulaHost ? VCQ_COLUMN_WIDTH_SCALE : 1;
  /** 현재 값의 렌더 크기. 값이 바뀌면 다시 올 때까지 null이라, 이전 값 크기를 식에 알리지 않는다. */
  const [measured, setMeasured] = useState<MathKeyboardContentSize | null>(
    null,
  );
  const [trackedValue, setTrackedValue] = useState(value);
  if (trackedValue !== value) {
    setTrackedValue(value);
    setMeasured(null);
  }
  const emitRef = useRef(onContentEm);
  const focusedRef = useRef(false);
  const lastEmRef = useRef<SlotContentEm | null>(null);

  useEffect(() => {
    emitRef.current = onContentEm;
  }, [onContentEm]);

  const handleContentSize = useCallback((size: MathKeyboardContentSize) => {
    const next = {
      width: Math.round(size.width),
      height: Math.round(size.height),
    };
    setMeasured((prev) =>
      prev && prev.width === next.width && prev.height === next.height
        ? prev
        : next,
    );
  }, []);

  const readContentSize = (): MathKeyboardContentSize | null => {
    if (useKeypad) {
      if (value === "") return { width: 0, height: 0 };
      return measured;
    }
    if (!inputRef.current) return value === "" ? { width: 0, height: 0 } : null;
    return {
      width: measureTextContentWidth(inputRef.current, value),
      height: 0,
    };
  };

  const isEditing = () =>
    focusedRef.current ||
    !!wrapperRef.current?.contains(document.activeElement);

  const emitIfChanged = (em: SlotContentEm) => {
    const prev = lastEmRef.current;
    if (
      prev &&
      Math.abs(prev.widthEm - em.widthEm) < 0.01 &&
      Math.abs(prev.heightEm - em.heightEm) < 0.01
    ) {
      return;
    }
    lastEmRef.current = em;
    emitRef.current?.(em);
  };

  const fitCurrentSlot = () => {
    const wrapper = wrapperRef.current;
    if (!wrapper) return null;
    const box =
      wrapper.closest<HTMLElement>(".qti-ext-mjx-blank-slot") ?? wrapper;
    const size = readContentSize();
    if (!size) return null;
    return fitSlotToContent(
      box,
      getComputedStyle(wrapper),
      size.width,
      size.height,
      widthCh,
      hostScale,
    );
  };

  useLayoutEffect(() => {
    const em = fitCurrentSlot();
    if (!em) return;
    if (isEditing()) return;
    const frame = window.requestAnimationFrame(() => {
      if (isEditing()) return;
      emitIfChanged(em);
    });
    return () => window.cancelAnimationFrame(frame);
  }, [measured, useKeypad, value, widthCh]);

  const setEditing = (editing: boolean) => {
    focusedRef.current = editing;
    if (editing) return;
    const em = fitCurrentSlot();
    if (em) emitIfChanged(em);
  };

  const openKeypadFromBox = (event: ReactPointerEvent<HTMLSpanElement>) => {
    if (event.button !== 0 || readOnly) return;
    const valueEl = wrapperRef.current?.querySelector<HTMLElement>(
      ".qti-ext-math-keyboard-value",
    );
    if (!valueEl || valueEl.contains(event.target as Node)) return;
    event.preventDefault();
    valueEl.click();
  };

  return (
    <span
      ref={wrapperRef}
      className={clsx(
        "qti-ext-math-blank-field qti-ext-input-blank qti-ext-text-entry-input",
        useKeypad && "qti-ext-math-blank-field--keypad",
        fitFormulaHost && "qti-ext-math-blank-slot-content",
        stateClassName,
      )}
      style={{
        minWidth:
          hostWidthScale === 1
            ? markerSlotWidthEm(widthCh)
            : `calc(${markerSlotWidthEm(widthCh)} * ${hostWidthScale})`,
      }}
      data-response-identifier={id}
      onPointerDown={useKeypad ? openKeypadFromBox : undefined}
    >
      {useKeypad ? (
        <MathKeyboard
          embedded
          value={value}
          onChange={(latex) => onChange(id, latex)}
          readOnly={readOnly}
          level={level}
          historyScope={historyScope}
          onContentSize={handleContentSize}
          ariaLabel={`${id} 입력`}
        />
      ) : (
        <input
          ref={inputRef}
          className="qti-ext-input-blank__field"
          type="text"
          size={1}
          value={value}
          readOnly={readOnly}
          data-response-identifier={id}
          aria-label={`${id} 입력`}
          onFocus={() => setEditing(true)}
          onBlur={() => setEditing(false)}
          onChange={(event) => onChange(id, event.target.value)}
        />
      )}
      {showPencil ? (
        <Pencil className="qti-ext-text-entry-pencil" aria-hidden="true" />
      ) : null}
    </span>
  );
}

type FormulaSlotLatexDisplayProps = {
  children: ReactNode;
  widthCh?: number;
  stateClassName?: string;
  variant?: BlankVariant;
  /** 빈 표시용 상자. 슬롯만 채우고 내용으로 키우지 않는다. */
  fillSlot?: boolean;
  fitFormulaHost?: boolean;
  /** 맞춘 칸 크기를 알린다. 식 쪽 `\Rule`을 같은 크기로 다시 만들 때 쓴다. */
  onContentEm?: (em: SlotContentEm) => void;
};

/** MathJax 표시. 값이 있으면 조판 후 슬롯을 맞춘다. `fillSlot`이면 빈 상자 크기를 유지한다. */
export function FormulaSlotLatexDisplay({
  children,
  widthCh,
  stateClassName,
  variant = "blank-box",
  fillSlot = false,
  fitFormulaHost = false,
  onContentEm,
}: FormulaSlotLatexDisplayProps) {
  const wrapperRef = useRef<HTMLSpanElement>(null);
  const contentRef = useRef<HTMLSpanElement>(null);
  const growToContent = !fillSlot;
  /* 미리보기 조판도 풀어보기 입력 칸과 같은 배율이다. scale 1이면 칸이 2em으로 커지고 분수 정렬이 밀린다. */
  const sizeScale = fitFormulaHost
    ? VCQ_FORMULA_SLOT_SCALE
    : variant === "blank-box"
      ? MATH_BLANK_DISPLAY_SCALE
      : 1;
  const emitRef = useRef(onContentEm);

  useEffect(() => {
    emitRef.current = onContentEm;
  }, [onContentEm]);

  useEffect(() => {
    const wrapper = wrapperRef.current;
    const box =
      wrapper?.closest<HTMLElement>(".qti-ext-mjx-blank-slot") ?? wrapper;
    if (!growToContent) {
      if (!box) return;
      clearSlotInlineSize(box);
      return;
    }
    if (!wrapper || !box) return;
    const content = contentRef.current;
    let frame = 0;

    const tryApply = () => {
      if (!content) return false;
      const size = readSlotContentSize(content);
      // 조판 전에는 공백으로 보지 않고 다시 잰다.
      if (size === "pending") return false;
      // 공백 정답은 선언된 \Rule 폭만 남긴다. 100% 라벨을 재면 칸이 계속 길어진다.
      if (size === "empty") {
        if (!fitFormulaHost) {
          clearSlotInlineSize(box);
          return true;
        }
        pinVcqBaseHeight(
          box,
          parseFloat(getComputedStyle(wrapper).fontSize) || 16,
          sizeScale,
        );
        return true;
      }
      if (size.w === 0 && size.h === 0) return false;
      const tallAnswer =
        fitFormulaHost && Boolean(content.querySelector(TALL_ANSWER_SELECTOR));
      const em = fitSlotToContent(
        box,
        getComputedStyle(wrapper),
        size.w,
        /* 한 줄 숫자는 높이 0이라 기본 칸을 유지한다. 답 자체의 분수·지수만 조판 높이를 쓴다. */
        fitFormulaHost && !tallAnswer ? 0 : size.h,
        widthCh,
        sizeScale,
      );
      emitRef.current?.(em);
      return true;
    };

    const applyAfterLayout = () => {
      frame = window.requestAnimationFrame(() => {
        tryApply();
      });
    };

    if (!fitFormulaHost) {
      if (!content) return;
      let stopped = false;
      let quietFrames = 0;
      const tick = () => {
        if (stopped) return;
        quietFrames += 1;
        if (quietFrames < 2) {
          frame = window.requestAnimationFrame(tick);
          return;
        }
        if (tryApply() || quietFrames > 30) return;
        frame = window.requestAnimationFrame(tick);
      };
      const poke = () => {
        if (stopped) return;
        quietFrames = 0;
        window.cancelAnimationFrame(frame);
        frame = window.requestAnimationFrame(tick);
      };
      const mutationObserver = new MutationObserver(poke);
      mutationObserver.observe(content, {
        childList: true,
        subtree: true,
        attributes: true,
      });
      document.fonts?.ready.then(poke).catch(poke);
      poke();
      return () => {
        stopped = true;
        mutationObserver.disconnect();
        window.cancelAnimationFrame(frame);
      };
    }
    if (!content) return;

    const resizeObserver = new ResizeObserver(applyAfterLayout);
    const observeIntrinsicSize = () => {
      resizeObserver.disconnect();
      // 슬롯을 채우는 라벨이 아니라 조판된 수식만 본다. 공백 칸은 관찰하지 않는다.
      const typeset = content.querySelector<HTMLElement>("mjx-math");
      if (typeset) resizeObserver.observe(typeset);
    };
    const mutationObserver = new MutationObserver(() => {
      observeIntrinsicSize();
      applyAfterLayout();
    });
    mutationObserver.observe(content, { childList: true, subtree: true });
    observeIntrinsicSize();
    document.fonts?.ready.then(applyAfterLayout).catch(() => undefined);
    applyAfterLayout();
    return () => {
      mutationObserver.disconnect();
      resizeObserver.disconnect();
      window.cancelAnimationFrame(frame);
    };
  }, [children, fitFormulaHost, growToContent, sizeScale, widthCh]);

  return (
    <span
      ref={wrapperRef}
      className={clsx(
        "qti-ext-input-blank",
        fitFormulaHost && "qti-ext-math-blank-slot-content",
        getBlankVariantClass(variant),
        growToContent &&
          (!fitFormulaHost || hasSlotChildren(children)) &&
          "qti-ext-input-blank--latex-content",
        stateClassName,
      )}
    >
      <span ref={contentRef} className="qti-ext-input-blank__label">
        {children}
      </span>
    </span>
  );
}
