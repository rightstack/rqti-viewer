import {
  type ReactNode,
  type RefObject,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import clsx from "clsx";
import { renderLaTeX } from "../../parser/parseLatexToReact";
import type { QTIParserOptions, ResponseValue, ResponseValueMap } from "../../types";
import { isMathLatexAnswer } from "../../utils";
import { FormulaSlotInput, FormulaSlotLatexDisplay } from "./FormulaSlotInput";
import { MathBlankFormula } from "./MathBlankFormula";
import { MergedBlankSlot } from "./MergedBlankSlot";
import {
  MATH_BLANK_DISPLAY_SCALE,
  type SlotContentEm,
  buildMathBlankInstanceId,
  hasFormulaContext,
} from "./mathBlankLatex";
import {
  type BlankVariant,
  type DisplayBlankLabel,
  type MathBlankSegment,
  extractInputWidthCh,
  extractResponseIds,
  findMarkupDiv,
  getBlankVariantClass,
  getInputBlankStateClass,
  getResponseRawString,
  getResponseString,
  buildMathBlankAnswerSource,
  isMathInputBlankDisplay,
  isMathResponseId,
  parseMathBlankSegments,
  readDisplayBlankLabels,
} from "./utils";
import {
  isVcqBlankCell,
  isVcqCarryCell,
  isVcqNarrowCell,
  readMathBlankAlignClass,
  readMergedColSpan,
} from "./vcqMergedAlign";

type BlankOptions = Omit<QTIParserOptions, "onResponseChange" | "responses"> & {
  onResponseChange?: (identifier: string, value: ResponseValue) => void;
  responses?: ResponseValueMap;
};

function needsMathRender(id: string | undefined, text: string, isMathContext = false): boolean {
  return isMathLatexAnswer(text) || isMathResponseId(id ?? "") || isMathContext;
}

function renderLabelContent(
  text: string,
  key: string,
  id?: string,
  isMathContext = false
): ReactNode {
  if (needsMathRender(id, text, isMathContext)) {
    return renderLaTeX(text, key, false);
  }
  return text;
}

function renderCellText(text: string, key: string, id?: string, isMathContext = false): ReactNode {
  if (!text) return null;
  const content = renderLabelContent(text, key, id, isMathContext);
  if (typeof content === "string") {
    return <span className="qti-ext-mathfield">{content}</span>;
  }
  return content;
}

interface MathInputBlankViewProps {
  latex: string;
  options: BlankOptions;
  index: number;
  contextElement: Element;
  markup: Element | null;
  displayOnly: boolean;
  displayLabels?: DisplayBlankLabel[];
  responseId?: string;
}

interface MathInputBlankInteractionProps {
  element: Element;
  options: BlankOptions;
  index: number;
}

function recomputeVcqColumnWidth(grid: HTMLElement, column: number) {
  const cells = grid.querySelectorAll<HTMLElement>(`[data-vcq-intrinsic-column="${column}"]`);
  const width = Array.from(cells).reduce(
    (max, cell) => Math.max(max, Number.parseFloat(cell.dataset.vcqIntrinsicWidth ?? "0")),
    0
  );
  const property = `--vcq-col-${column}-content`;
  if (width > 0) grid.style.setProperty(property, `${width}px`);
  else grid.style.removeProperty(property);
}

function useVcqIntrinsicColumn(
  ref: RefObject<HTMLSpanElement | null>,
  enabled: boolean,
  contentVersion: string
) {
  useLayoutEffect(() => {
    if (!enabled) return;
    const root = ref.current;
    const cell = root?.closest<HTMLElement>(".qti-ext-vcq-cell");
    const row = cell?.parentElement;
    const grid = row?.closest<HTMLElement>(".qti-ext-vcq-grid");
    if (!root || !cell || !row || !grid) return;

    let column = 1;
    for (const sibling of Array.from(row.children)) {
      if (sibling === cell) break;
      if (!sibling.classList.contains("qti-ext-vcq-cell")) continue;
      const span = Number.parseInt(sibling.getAttribute("data-vcq-colspan") ?? "1", 10);
      column += Number.isFinite(span) && span >= 2 ? span : 1;
    }

    let active = true;
    const measure = () => {
      if (!active) return;
      const content =
        root.querySelector<HTMLElement>(
          ".qti-ext-math-blank-inline--vcq-standalone, .qti-ext-math-blank-formula"
        ) ?? root;
      const contentWidth = content.getBoundingClientRect().width;
      const style = getComputedStyle(cell);
      const padding =
        (Number.parseFloat(style.paddingLeft) || 0) + (Number.parseFloat(style.paddingRight) || 0);
      const width = Math.ceil(contentWidth + padding);
      if (width <= 0 || cell.dataset.vcqIntrinsicWidth === String(width)) return;
      cell.dataset.vcqIntrinsicColumn = String(column);
      cell.dataset.vcqIntrinsicWidth = String(width);
      recomputeVcqColumnWidth(grid, column);
    };

    const resizeObserver = new ResizeObserver(measure);
    resizeObserver.observe(
      root.querySelector<HTMLElement>(
        ".qti-ext-math-blank-inline--vcq-standalone, .qti-ext-math-blank-formula"
      ) ?? root
    );
    const mutationObserver = new MutationObserver(measure);
    mutationObserver.observe(root, { childList: true, subtree: true, characterData: true });
    document.fonts?.ready.then(measure).catch(() => undefined);
    measure();

    return () => {
      active = false;
      resizeObserver.disconnect();
      mutationObserver.disconnect();
      delete cell.dataset.vcqIntrinsicColumn;
      delete cell.dataset.vcqIntrinsicWidth;
      recomputeVcqColumnWidth(grid, column);
    };
  }, [contentVersion, enabled, ref]);
}


function buildLabelMap(ids: string[], displayLabels: DisplayBlankLabel[]): Map<string, string> {
  const byId = new Map<string, string>();
  const ordered: string[] = [];

  for (const label of displayLabels) {
    if (label.id) byId.set(label.id, label.text);
    else ordered.push(label.text);
  }

  const result = new Map<string, string>();
  let orderIdx = 0;

  for (const id of ids) {
    const fromId = byId.get(id);
    if (fromId !== undefined) {
      result.set(id, fromId);
      continue;
    }
    if (orderIdx < ordered.length) {
      result.set(id, ordered[orderIdx++]);
    }
  }
  return result;
}

function MathInputBlankView({
  latex,
  options,
  index,
  contextElement,
  markup,
  displayOnly,
  displayLabels = [],
  responseId,
}: MathInputBlankViewProps) {
  const rootRef = useRef<HTMLSpanElement>(null);
  const reactId = useId();
  const instanceId = buildMathBlankInstanceId({
    index,
    itemKey: options.itemKey,
    answerKeyPreview: options.answerKeyPreview === true,
    uid: reactId,
    responseId,
  });
  const segments = useMemo(() => parseMathBlankSegments(latex), [latex]);
  const fallbackWidthCh = extractInputWidthCh(
    markup?.getAttribute("class") ?? "",
    contextElement.getAttribute("class") ?? ""
  );
  const mergedColSpan = readMergedColSpan(contextElement);
  const alignClass = readMathBlankAlignClass(contextElement, markup);
  const formulaContext = hasFormulaContext(latex);
  const inVcqBlankCell = isVcqBlankCell(contextElement);
  const inVcqNarrowCell = isVcqNarrowCell(contextElement);
  const vcqCell = contextElement.closest(".qti-ext-vcq-cell");
  const canUseVcqTypedFlow =
    inVcqBlankCell &&
    !inVcqNarrowCell &&
    !isVcqCarryCell(contextElement) &&
    !vcqCell?.hasAttribute("data-vcq-width-unit");
  const useVcqContentFlow = canUseVcqTypedFlow && mergedColSpan < 2;
  const useVcqFormulaFlow = formulaContext && canUseVcqTypedFlow;
  const useVcqStandaloneFlow = !formulaContext && useVcqContentFlow;
  useVcqIntrinsicColumn(rootRef, useVcqContentFlow, String(options.mode));
  const inNarrowRow = Boolean(contextElement.closest(".qti-ext-vcq-row--narrow"));
  const inVcqCell = inVcqBlankCell || mergedColSpan >= 2;
  const fillDisplaySlot = inNarrowRow || inVcqCell;
  const blankWidthMap = useMemo(() => {
    const map = new Map<string, number>();
    for (const seg of segments) {
      if (seg.kind === "blank") {
        const w = seg.widthCh ?? fallbackWidthCh;
        if (w !== undefined && w > 0) map.set(seg.id, w);
      }
    }
    return map;
  }, [segments, fallbackWidthCh]);

  const isPreview = options.mode === "preview";
  const isThumbnail = options.mode === "thumbnail";
  const isReadOnly = displayOnly || isPreview || isThumbnail;
  const isMathContext = isMathResponseId(responseId ?? "") || inVcqBlankCell || mergedColSpan >= 2;

  const answerSource = useMemo(
    () =>
      buildMathBlankAnswerSource(
        options.answerKeyPreview === true,
        options.correctAnswers as Record<string, unknown>,
        options.responses as Record<string, unknown>,
        responseId,
        latex
      ),
    [latex, options.answerKeyPreview, options.correctAnswers, options.responses, responseId]
  );

  const blankIds = useMemo(() => extractResponseIds(latex), [latex]);

  const labelMap = useMemo(
    () => (displayOnly ? buildLabelMap(blankIds, displayLabels) : new Map<string, string>()),
    [blankIds, displayLabels, displayOnly]
  );

  /**
   * 조판된 칸 크기를 실측해 Rule에 되돌린다. LaTeX 원문 길이는 화면 폭과 다르다.
   * 값마다 한 번만 받는다. Rule을 바꾸면 재조판·재측정이 도는데 지수·분수 안에서는
   * em 기준 글자 크기가 미세하게 달라져 값이 계속 흔들린다.
   */
  const measureSlots = isReadOnly && formulaContext;
  const [slotContentEm, setSlotContentEm] = useState<
    Record<string, { value: string; em: SlotContentEm }>
  >({});

  const handleSlotContentEm = (id: string, value: string, em: SlotContentEm) => {
    setSlotContentEm((prev) =>
      prev[id]?.value === value ? prev : { ...prev, [id]: { value, em } }
    );
  };

  const slotRuleEm = useMemo(() => {
    const next: Record<string, SlotContentEm> = {};
    for (const [id, measured] of Object.entries(slotContentEm)) next[id] = measured.em;
    return next;
  }, [slotContentEm]);

  /** 실측이 덜 온 칸이 있으면 조판을 감춘다. 첫 조판은 Rule이 글자 수 기준이라 틀린 폭이다. */
  const awaitingMeasure =
    Boolean(measureSlots) &&
    !displayOnly &&
    blankIds.some((id) => slotContentEm[id]?.value !== getResponseString(answerSource, id));

  const handleChange = (id: string, value: string) => {
    if (!isReadOnly) options.onResponseChange?.(id, value);
  };

  const answerRevealVariant: BlankVariant =
    isPreview ||
    isThumbnail ||
    Boolean(options.isSubmit) ||
    options.correct === true
      ? "text-entry"
      : "blank-box";
  const slotVariant: BlankVariant = displayOnly ? "blank-box" : answerRevealVariant;

  const blankStateClass = (id: string) => {
    if (displayOnly) return "";
    const correctMap = options.correctAnswers as Record<string, unknown> | undefined;
    const hasCorrect = !!correctMap && Object.prototype.hasOwnProperty.call(correctMap, id);
    return getInputBlankStateClass({
      value: getResponseString(answerSource, id),
      isSubmit: isThumbnail ? false : options.isSubmit,
      correctAnswer: hasCorrect ? getResponseString(correctMap, id) : undefined,
      answerKey: options.answerKeyPreview === true,
      allowEmptySelected: isPreview && !options.answerKeyPreview && inVcqBlankCell,
    });
  };

  const renderSizedBlank = (id: string, key: string, treatAsMath: boolean) => {
    const widthCh = useVcqFormulaFlow ? undefined : (blankWidthMap.get(id) ?? fallbackWidthCh);
    const stateClass = blankStateClass(id);

    if (displayOnly) {
      const label = formulaContext ? undefined : labelMap.get(id);
      return (
        <span key={key} className="qti-ext-math-blank-inline">
          <FormulaSlotLatexDisplay
            widthCh={widthCh}
            stateClassName={stateClass}
            variant={slotVariant}
            fillSlot={!label || fillDisplaySlot}
            fitFormulaHost={useVcqFormulaFlow}
          >
            {label ? renderLabelContent(label, `label-${id}`, id, treatAsMath) : null}
          </FormulaSlotLatexDisplay>
        </span>
      );
    }

    const raw = getResponseRawString(answerSource, id);
    const value = getResponseString(answerSource, id);
    if (isReadOnly && needsMathRender(id, raw, treatAsMath)) {
      return (
        <span key={key} className="qti-ext-math-blank-inline">
          <FormulaSlotLatexDisplay
            widthCh={widthCh}
            stateClassName={stateClass}
            variant={slotVariant}
            fitFormulaHost={useVcqFormulaFlow}
            onContentEm={measureSlots ? (em) => handleSlotContentEm(id, value, em) : undefined}
          >
            {value ? renderLaTeX(value, `blank-val-${id}`, false, false) : null}
          </FormulaSlotLatexDisplay>
        </span>
      );
    }

    return (
      <span key={key} className="qti-ext-math-blank-inline">
        <FormulaSlotInput
          id={id}
          value={value}
          widthCh={widthCh}
          readOnly={isReadOnly}
          alignClass={alignClass}
          onChange={handleChange}
          stateClassName={stateClass}
          fitFormulaHost={useVcqFormulaFlow}
        />
      </span>
    );
  };

  const renderBlankSlot = (id: string, key: string, treatAsMath: boolean) => {
    const stateClass = blankStateClass(id);
    const displayVariantClass = getBlankVariantClass(slotVariant);

    if (mergedColSpan >= 2 && !formulaContext) {
      return (
        <MergedBlankSlot
          key={key}
          id={id}
          value={getResponseString(answerSource, id)}
          displayLabel={displayOnly ? labelMap.get(id) : undefined}
          displayOnly={displayOnly}
          isReadOnly={isReadOnly}
          alignClass={alignClass}
          mergedColSpan={mergedColSpan}
          contextElement={contextElement}
          onChange={handleChange}
          stateClassName={stateClass}
          displayVariant={slotVariant}
        />
      );
    }

    if (!displayOnly && !formulaContext && (inVcqNarrowCell || inVcqBlankCell)) {
      const value = getResponseString(answerSource, id);
      const overlayClass = clsx(
        "qti-ext-input-blank",
        isReadOnly ? displayVariantClass : "qti-ext-text-entry-input",
        stateClass
      );

      return (
        <span
          key={key}
          className={clsx(
            "qti-ext-math-blank-inline",
            useVcqStandaloneFlow && "qti-ext-math-blank-inline--vcq-standalone"
          )}
        >
          <span className={overlayClass} aria-hidden="true" />
          {value ? renderCellText(value, `vcq-text-${id}`, id, true) : null}
          {!isReadOnly && (
            <input
              className={clsx("qti-ext-input-blank__field", alignClass)}
              type="text"
              size={1}
              value={value}
              data-response-identifier={id}
              aria-label={`${id} 입력`}
              onChange={(e) => handleChange(id, e.target.value)}
            />
          )}
        </span>
      );
    }

    return renderSizedBlank(id, key, treatAsMath);
  };

  const renderSegments = (items: MathBlankSegment[], keyPrefix: string): ReactNode[] =>
    items.map((seg, i) => {
      const key = `${keyPrefix}-${i}`;
      if (seg.kind === "latex") {
        return (
          <span key={`${key}-ltx`} className="qti-ext-mathfield qti-ext-math-blank-latex">
            {renderLaTeX(seg.latex, `${key}-ltx`, false)}
          </span>
        );
      }
      return renderBlankSlot(seg.id, key, isMathContext);
    });

  if (latex === "") return null;

  return (
    <span
      ref={rootRef}
      className={clsx(
        "qti-ext-math-input-blank",
        displayOnly && "qti-ext-math-input-blank--display",
        mergedColSpan >= 2 && !useVcqFormulaFlow && "qti-ext-math-input-blank--merged",
        useVcqFormulaFlow && "qti-ext-math-input-blank--vcq-formula",
        alignClass
      )}
      data-index={index}
    >
      {formulaContext ? (
        <MathBlankFormula
          latex={latex}
          instanceId={instanceId}
          renderSlot={(id) => renderBlankSlot(id, id, isReadOnly)}
          fallback={renderSegments(segments, `math-blank-${instanceId}`)}
          slotScale={displayOnly && !fillDisplaySlot ? MATH_BLANK_DISPLAY_SCALE : 1}
          contentDrivenSlots={useVcqFormulaFlow}
          slotContentEm={measureSlots ? slotRuleEm : undefined}
          awaitingMeasure={awaitingMeasure}
        />
      ) : (
        renderSegments(segments, `math-blank-${index}`)
      )}
    </span>
  );
}

export function MathInputBlankInteraction({
  element,
  options,
  index,
}: MathInputBlankInteractionProps) {
  const markup = findMarkupDiv(element);
  const responseId = String(element.getAttribute("response-identifier") ?? "").trim();
  const rawLatex =
    String(markup?.getAttribute("data-latex") ?? "").trim() ||
    (responseId ? `\\inputblank{${responseId}}{1}` : "");
  const displayOnly = isMathInputBlankDisplay(markup?.getAttribute("class") ?? "");

  if (!markup || rawLatex === "") return null;

  return (
    <MathInputBlankView
      latex={rawLatex}
      options={options}
      index={index}
      contextElement={element}
      markup={markup}
      displayOnly={displayOnly}
      displayLabels={displayOnly ? readDisplayBlankLabels(markup) : []}
      responseId={responseId}
    />
  );
}

export function MathInputBlankDisplayMarkup({
  element,
  options,
  index,
}: MathInputBlankInteractionProps) {
  const attrLatex = String(element.getAttribute("data-latex") ?? "").trim();
  const fieldLatex =
    !attrLatex && element.classList.contains("qti-ext-mathfield")
      ? String(element.textContent ?? "").trim()
      : "";
  const rawLatex = attrLatex || fieldLatex;
  const displayLabels = readDisplayBlankLabels(element);

  if (rawLatex === "" && displayLabels.length === 0) return null;

  if (rawLatex === "") {
    const mergedColSpan = readMergedColSpan(element);
    const useOverlay = isVcqNarrowCell(element) || isVcqBlankCell(element);
    const blankClass = clsx("qti-ext-input-blank", getBlankVariantClass("blank-box"));

    return (
      <span
        className={clsx(
          "qti-ext-math-input-blank",
          "qti-ext-math-input-blank--display",
          mergedColSpan >= 2 && "qti-ext-math-input-blank--merged"
        )}
        data-index={index}
      >
        {displayLabels.map((label) =>
          useOverlay ? (
            <span
              key={`display-label-${index}-${label.id ?? label.text}`}
              className={clsx(blankClass, label.text && "qti-ext-input-blank--latex-content")}
            >
              {label.text ? (
                <span className="qti-ext-input-blank__label">
                  {renderCellText(
                    label.text,
                    `display-label-${index}-${label.id ?? label.text}`,
                    label.id,
                    true
                  )}
                </span>
              ) : null}
            </span>
          ) : (
            <span
              key={`display-label-${index}-${label.id ?? label.text}`}
              className={clsx(mergedColSpan < 2 && "qti-ext-math-blank-field", blankClass)}
            >
              {mergedColSpan < 2 && (
                <span className="qti-ext-input-blank__sizer" aria-hidden="true">
                  {"\u00a0"}
                </span>
              )}
              {label.text ? <span className="qti-ext-input-blank__label">{label.text}</span> : null}
            </span>
          )
        )}
      </span>
    );
  }

  return (
    <MathInputBlankView
      latex={rawLatex}
      options={options}
      index={index}
      contextElement={element}
      markup={element}
      displayOnly
      displayLabels={displayLabels}
    />
  );
}
