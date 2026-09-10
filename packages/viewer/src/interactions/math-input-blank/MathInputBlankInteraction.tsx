import { type ReactNode, useMemo } from "react";
import clsx from "clsx";
import { renderLaTeX } from "../../parser/parseLatexToReact";
import type { QTIParserOptions, ResponseValue, ResponseValueMap } from "../../types";
import { FormulaSlotInput, FormulaSlotLatexDisplay } from "./FormulaSlotInput";
import { MathBlankFormula } from "./MathBlankFormula";
import { MergedBlankSlot } from "./MergedBlankSlot";
import { MATH_BLANK_DISPLAY_SCALE, hasFormulaContext } from "./mathBlankLatex";
import {
  type BlankVariant,
  type DisplayBlankLabel,
  type MathBlankSegment,
  extractInputWidthCh,
  extractResponseIds,
  findMarkupDiv,
  getBlankVariantClass,
  getInputBlankStateClass,
  getResponseString,
  hasLatexCommand,
  isMathInputBlankDisplay,
  isMathResponseId,
  parseMathBlankSegments,
  readDisplayBlankLabels,
} from "./utils";
import {
  isVcqBlankCell,
  isVcqNarrowCell,
  readMathBlankAlignClass,
  readMergedColSpan,
} from "./vcqMergedAlign";

type BlankOptions = Omit<QTIParserOptions, "onResponseChange" | "responses"> & {
  onResponseChange?: (identifier: string, value: ResponseValue) => void;
  responses?: ResponseValueMap;
};

function needsMathRender(id: string | undefined, text: string, isMathContext = false): boolean {
  return hasLatexCommand(text) || isMathResponseId(id ?? "") || isMathContext;
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

/** preview는 correctAnswers 우선. record 값은 inputblank 등장 순으로 매핑. */
function buildAnswerSource(
  isPreview: boolean,
  correctAnswers: Record<string, unknown> | undefined,
  responses: Record<string, unknown> | undefined,
  responseId: string | undefined,
  latex: string
): Record<string, unknown> | undefined {
  const raw =
    isPreview && correctAnswers && Object.keys(correctAnswers).length > 0
      ? correctAnswers
      : responses;
  if (!raw) return undefined;

  const flat: Record<string, unknown> = { ...raw };
  const blankIds = extractResponseIds(latex);

  if (blankIds.some((id) => !(id in flat))) {
    const parentValue = responseId ? raw[responseId] : undefined;
    const arr = Array.isArray(parentValue)
      ? parentValue
      : Object.values(raw).find((v) => Array.isArray(v) && v.length > 0);
    if (Array.isArray(arr)) {
      for (let i = 0; i < Math.min(arr.length, blankIds.length); i++) {
        if (!(blankIds[i] in flat)) flat[blankIds[i]] = arr[i];
      }
    }
  }
  return flat;
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
  const segments = useMemo(() => parseMathBlankSegments(latex), [latex]);
  const fallbackWidthCh = extractInputWidthCh(
    markup?.getAttribute("class") ?? "",
    contextElement.getAttribute("class") ?? ""
  );
  const mergedColSpan = readMergedColSpan(contextElement);
  const alignClass = readMathBlankAlignClass(contextElement, markup);
  const formulaContext = hasFormulaContext(latex);
  const useFormulaPath = mergedColSpan < 2 && formulaContext;
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
  const isReadOnly = displayOnly || isPreview;
  const isMathContext =
    isMathResponseId(responseId ?? "") || isVcqBlankCell(contextElement) || mergedColSpan >= 2;

  const answerSource = useMemo(
    () =>
      buildAnswerSource(
        isPreview,
        options.correctAnswers as Record<string, unknown>,
        options.responses as Record<string, unknown>,
        responseId,
        latex
      ),
    [isPreview, latex, options.correctAnswers, options.responses, responseId]
  );

  const blankIds = useMemo(() => extractResponseIds(latex), [latex]);

  const labelMap = useMemo(
    () => (displayOnly ? buildLabelMap(blankIds, displayLabels) : new Map<string, string>()),
    [blankIds, displayLabels, displayOnly]
  );

  const handleChange = (id: string, value: string) => {
    if (!isReadOnly) options.onResponseChange?.(id, value);
  };

  const answerRevealVariant: BlankVariant =
    isPreview || Boolean(options.isSubmit) || options.correct === true ? "text-entry" : "blank-box";

  const blankDisplayState = (id: string) => {
    const correctMap = options.correctAnswers as Record<string, unknown> | undefined;
    const hasPerId = !!correctMap && Object.prototype.hasOwnProperty.call(correctMap, id);
    const feedback = {
      isSubmit: options.isSubmit,
      correctAnswer: hasPerId ? getResponseString(correctMap, id) : undefined,
      forceSelected: options.correct === true,
    };
    return {
      feedback,
      stateClass: getInputBlankStateClass({
        value: displayOnly ? (labelMap.get(id) ?? "") : getResponseString(answerSource, id),
        ...feedback,
      }),
    };
  };

  const renderSizedBlank = (id: string, key: string, treatAsMath: boolean) => {
    const widthCh = blankWidthMap.get(id) ?? fallbackWidthCh;
    const { feedback, stateClass } = blankDisplayState(id);

    if (displayOnly) {
      const label = labelMap.get(id);
      return (
        <span key={key} className="qti-ext-math-blank-inline">
          <FormulaSlotLatexDisplay
            widthCh={widthCh}
            stateClassName={stateClass}
            variant="blank-box"
            fillSlot={!label}
          >
            {label ? renderLabelContent(label, `label-${id}`, id, treatAsMath) : null}
          </FormulaSlotLatexDisplay>
        </span>
      );
    }

    const value = getResponseString(answerSource, id);
    if (isReadOnly && needsMathRender(id, value, treatAsMath)) {
      return (
        <span key={key} className="qti-ext-math-blank-inline">
          <FormulaSlotLatexDisplay
            widthCh={widthCh}
            stateClassName={stateClass}
            variant={answerRevealVariant}
          >
            {renderLaTeX(value, `blank-val-${id}`, false)}
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
          isSubmit={feedback.isSubmit}
          correctAnswer={feedback.correctAnswer}
          forceSelected={feedback.forceSelected}
        />
      </span>
    );
  };

  const renderBlankSlot = (id: string, key: string, treatAsMath: boolean) => {
    const { feedback, stateClass } = blankDisplayState(id);
    const displayVariantClass = getBlankVariantClass(answerRevealVariant);

    if (mergedColSpan >= 2) {
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
          isSubmit={feedback.isSubmit}
          correctAnswer={feedback.correctAnswer}
          forceSelected={feedback.forceSelected}
          displayVariant={answerRevealVariant}
        />
      );
    }

    if (!formulaContext && (isVcqNarrowCell(contextElement) || isVcqBlankCell(contextElement))) {
      const value = getResponseString(answerSource, id);
      const text = displayOnly ? (labelMap.get(id) ?? "") : value;
      const showInput = !displayOnly && !isReadOnly;
      const overlayClass = clsx(
        "qti-ext-input-blank",
        isReadOnly || displayOnly ? displayVariantClass : "qti-ext-text-entry-input",
        stateClass
      );

      return (
        <span key={key} className="qti-ext-math-blank-inline">
          <span className={overlayClass} aria-hidden="true" />
          {text ? renderCellText(text, `vcq-text-${id}`, id, true) : null}
          {showInput && (
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
      className={clsx(
        "qti-ext-math-input-blank",
        displayOnly && "qti-ext-math-input-blank--display",
        mergedColSpan >= 2 && "qti-ext-math-input-blank--merged",
        alignClass
      )}
      data-index={index}
    >
      {useFormulaPath ? (
        <MathBlankFormula
          latex={latex}
          instanceId={String(index)}
          renderSlot={(id) => renderBlankSlot(id, id, false)}
          fallback={renderSegments(segments, `math-blank-${index}`)}
          slotScale={displayOnly ? MATH_BLANK_DISPLAY_SCALE : 1}
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

    return (
      <span
        className={clsx(
          "qti-ext-math-input-blank",
          "qti-ext-math-input-blank--display",
          mergedColSpan >= 2 && "qti-ext-math-input-blank--merged"
        )}
        data-index={index}
      >
        {displayLabels.map((label) => (
          <span
            key={`display-label-${index}-${label.id ?? label.text}`}
            className={clsx(
              useOverlay && "qti-ext-math-blank-inline",
              !useOverlay && mergedColSpan < 2 && "qti-ext-math-blank-field",
              !useOverlay && "qti-ext-input-blank qti-ext-input-blank--display",
              mergedColSpan >= 2 && "qti-ext-vcq-merged-display"
            )}
          >
            {useOverlay && (
              <span
                className="qti-ext-input-blank qti-ext-input-blank--display"
                aria-hidden="true"
              />
            )}
            {useOverlay
              ? renderCellText(
                  label.text,
                  `display-label-${index}-${label.id ?? label.text}`,
                  label.id,
                  true
                )
              : null}
            {!useOverlay && mergedColSpan < 2 && (
              <span className="qti-ext-input-blank__sizer" aria-hidden="true">
                {"\u00a0"}
              </span>
            )}
            {!useOverlay && label.text ? (
              <span className="qti-ext-input-blank__label">{label.text}</span>
            ) : null}
          </span>
        ))}
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
