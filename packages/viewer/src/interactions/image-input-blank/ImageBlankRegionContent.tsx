import clsx from "clsx";
import { Pencil } from "lucide-react";
import { stripOuterMathDelimiters } from "../../utils/latex";
import { MathKeyboard, type MathLevel } from "../../math-keyboard";
import { renderLaTeX } from "../../parser/parseLatexToReact";
import { isMathLatexAnswer } from "../../utils";
import { buildFractionLatexFromParts } from "../../utils/choiceAnswerDisplayFromQti";
import { type ImageBlankRegion } from "./utils";

const DOLLAR_WRAPPED_RE = /^\$\$[\s\S]*\$\$$/;

/** 정답이 `$$...$$`이면 저장값도 같은 형태로 감싼다. 빈 값은 빈 문자열. */
function wrapLikeAnswer(latex: string, correctAnswer: string): string {
  if (latex.trim() === "") return "";
  return DOLLAR_WRAPPED_RE.test(correctAnswer.trim()) ? `$$${latex}$$` : latex;
}

interface ImageBlankInputProps {
  responseIdentifier: string;
  label: string;
  /** 분수 파트는 숫자 키패드. 값 검증은 아니다. */
  numeric?: boolean;
  partClassName: string;
  value: string;
  stateClassName: string;
  readOnly: boolean;
  /** 값을 보여주기만 하는 화면(미리보기·채점)인지 */
  showMath: boolean;
  /** 이 칸의 정답 문자열. `$$...$$` 정답이면 저장값도 같은 형태로 감싼다. */
  correctAnswer?: string;
  historyScope?: string;
  mathKeyboardLevel?: MathLevel | null;
  onChange: (responseIdentifier: string, value: string) => void;
}

/**
 * 학습자 입력 칸. 값 길이·IME·테마로 칸이 커지면 저작 좌표와 어긋나므로
 * 크기는 전부 상위 영역이 정한다. `autocomplete`·`spellcheck`는 건드리지 않는다.
 */
function ImageBlankInput({
  responseIdentifier,
  label,
  numeric,
  partClassName,
  value,
  stateClassName,
  readOnly,
  showMath,
  correctAnswer,
  historyScope,
  mathKeyboardLevel,
  onChange,
}: ImageBlankInputProps) {
  // 수식은 `$$...$$`로 감싸여 들어온다. renderLaTeX가 바깥 구분자를 벗긴다.
  if (showMath && value.trim() !== "" && isMathLatexAnswer(value)) {
    return (
      <span
        className={clsx(
          "qti-ext-image-input-blank__input",
          "qti-ext-image-input-blank__math",
          partClassName,
          stateClassName
        )}
        data-response-identifier={responseIdentifier}
        aria-label={label}
      >
        {renderLaTeX(value, `image-blank-${responseIdentifier}`, false)}
      </span>
    );
  }

  const showPencil = !readOnly && value === "";

  // 텍스트 칸은 CLOZE와 같이 수식 키패드. 분수·대분수 파트(numeric)는 일반 입력.
  // 영역 크기는 저작 좌표 그대로다. 넘치는 내용은 영역(overflow: hidden) 안에서 잘린다.
  if (!numeric && mathKeyboardLevel) {
    return (
      <span
        className={clsx(
          "qti-ext-image-input-blank__field",
          "qti-ext-image-input-blank__field--keypad",
          partClassName
        )}
        data-response-identifier={responseIdentifier}
      >
        <MathKeyboard
          embedded
          value={stripOuterMathDelimiters(value)}
          onChange={(latex) =>
            onChange(responseIdentifier, wrapLikeAnswer(latex, correctAnswer ?? ""))
          }
          readOnly={readOnly}
          level={mathKeyboardLevel}
          historyScope={historyScope}
          ariaLabel={label}
        />
        {showPencil ? (
          <Pencil className="qti-ext-image-input-blank__pencil" aria-hidden="true" />
        ) : null}
      </span>
    );
  }

  return (
    <span className={clsx("qti-ext-image-input-blank__field", partClassName)}>
      <input
        type="text"
        inputMode={numeric ? "numeric" : undefined}
        className={clsx("qti-ext-image-input-blank__input", stateClassName)}
        data-response-identifier={responseIdentifier}
        aria-label={label}
        value={value}
        readOnly={readOnly}
        onChange={(event) => onChange(responseIdentifier, event.target.value)}
      />
      {showPencil ? (
        <Pencil className="qti-ext-image-input-blank__pencil" aria-hidden="true" />
      ) : null}
    </span>
  );
}

interface ImageBlankRegionContentProps {
  region: ImageBlankRegion;
  /** 화면 안내용 번호. 저장 식별자가 아니다. */
  displayIndex: number;
  readOnly: boolean;
  showMath: boolean;
  /** 정답 영역에서 분수·대분수를 LaTeX 하나로 그린다. */
  showFractionAsLatex: boolean;
  valueOf: (responseIdentifier: string) => string;
  stateClassOf: (responseIdentifier: string) => string;
  /** 칸의 정답 문자열. `$$...$$` 정답이면 저장값도 같은 형태로 감싼다. */
  correctAnswerOf?: (responseIdentifier: string) => string;
  historyScope?: string;
  mathKeyboardLevel?: MathLevel | null;
  onChange: (responseIdentifier: string, value: string) => void;
}

/** 분수 선 색을 정할 때 여러 칸 상태 중 먼저 걸리는 쪽을 쓴다. */
const FRACTION_LINE_STATE_PRIORITY = ["incorrect", "correct", "selected"] as const;

function fractionStackStateClass(...cellStates: string[]): string {
  const state = FRACTION_LINE_STATE_PRIORITY.find((name) =>
    cellStates.includes(`qti-ext-image-input-blank__input--${name}`)
  );
  return state ? `qti-ext-image-input-blank__fraction-stack--${state}` : "";
}

/** 분수·대분수 공통 스택. em 레이아웃은 저작 영역 내부와 같다. */
function ImageBlankFractionStack({
  wholeId,
  numeratorId,
  denominatorId,
  displayIndex,
  readOnly,
  showMath,
  valueOf,
  stateClassOf,
  onChange,
}: {
  /** 대분수 정수부. 칸은 스택 밖에 있지만 분수 선 색에는 함께 반영한다. */
  wholeId?: string;
  numeratorId: string;
  denominatorId: string;
} & Omit<ImageBlankRegionContentProps, "region" | "showFractionAsLatex">) {
  const numeratorState = stateClassOf(numeratorId);
  const denominatorState = stateClassOf(denominatorId);

  return (
    <span
      className={clsx(
        "qti-ext-image-input-blank__fraction-stack",
        fractionStackStateClass(
          wholeId ? stateClassOf(wholeId) : "",
          numeratorState,
          denominatorState
        )
      )}
    >
      <ImageBlankInput
        responseIdentifier={numeratorId}
        label={`이미지 빈칸 ${displayIndex} 분자`}
        numeric
        partClassName="qti-ext-image-input-blank__fraction-part"
        value={valueOf(numeratorId)}
        stateClassName={numeratorState}
        readOnly={readOnly}
        showMath={showMath}
        onChange={onChange}
      />
      <span className="qti-ext-image-input-blank__fraction-line" aria-hidden="true" />
      <ImageBlankInput
        responseIdentifier={denominatorId}
        label={`이미지 빈칸 ${displayIndex} 분모`}
        numeric
        partClassName="qti-ext-image-input-blank__fraction-part"
        value={valueOf(denominatorId)}
        stateClassName={denominatorState}
        readOnly={readOnly}
        showMath={showMath}
        onChange={onChange}
      />
    </span>
  );
}

export function ImageBlankRegionContent({
  region,
  displayIndex,
  readOnly,
  showMath,
  showFractionAsLatex,
  valueOf,
  stateClassOf,
  correctAnswerOf,
  historyScope,
  mathKeyboardLevel,
  onChange,
}: ImageBlankRegionContentProps) {
  const shared = { displayIndex, readOnly, showMath, valueOf, stateClassOf, onChange };

  if (showFractionAsLatex && region.inputType !== "text") {
    const latex = buildFractionLatexFromParts(
      region.inputType === "mixedFraction" ? valueOf(region.wholeId).trim() : "",
      valueOf(region.numeratorId).trim(),
      valueOf(region.denominatorId).trim()
    );
    if (latex) {
      return (
        <span
          className="qti-ext-image-input-blank__fraction-latex"
          aria-label={`이미지 빈칸 ${displayIndex}`}
        >
          {renderLaTeX(latex, `image-blank-fraction-${region.id}`, false)}
        </span>
      );
    }
  }

  if (region.inputType === "text") {
    return (
      <ImageBlankInput
        responseIdentifier={region.responseIdentifier}
        label={`이미지 빈칸 ${displayIndex}`}
        partClassName="qti-ext-image-input-blank__text"
        value={valueOf(region.responseIdentifier)}
        stateClassName={stateClassOf(region.responseIdentifier)}
        readOnly={readOnly}
        showMath={showMath}
        correctAnswer={correctAnswerOf?.(region.responseIdentifier)}
        historyScope={historyScope}
        mathKeyboardLevel={mathKeyboardLevel}
        onChange={onChange}
      />
    );
  }

  if (region.inputType === "mixedFraction") {
    return (
      <span className="qti-ext-image-input-blank__fraction qti-ext-image-input-blank__fraction--mixed">
        <ImageBlankInput
          responseIdentifier={region.wholeId}
          label={`이미지 빈칸 ${displayIndex} 정수`}
          numeric
          partClassName="qti-ext-image-input-blank__fraction-whole"
          value={valueOf(region.wholeId)}
          stateClassName={stateClassOf(region.wholeId)}
          readOnly={readOnly}
          showMath={showMath}
          onChange={onChange}
        />
        <ImageBlankFractionStack
          wholeId={region.wholeId}
          numeratorId={region.numeratorId}
          denominatorId={region.denominatorId}
          {...shared}
        />
      </span>
    );
  }

  return (
    <span className="qti-ext-image-input-blank__fraction">
      <ImageBlankFractionStack
        numeratorId={region.numeratorId}
        denominatorId={region.denominatorId}
        {...shared}
      />
    </span>
  );
}
