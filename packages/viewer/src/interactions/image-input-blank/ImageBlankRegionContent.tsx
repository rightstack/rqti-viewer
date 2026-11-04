import clsx from "clsx";
import { Pencil } from "lucide-react";
import { stripOuterMathDelimiters } from "../../utils/latex";
import { MathKeyboard, type MathLevel } from "../../math-keyboard";
import { renderLaTeX } from "../../parser/parseLatexToReact";
import { isMathLatexAnswer } from "../../utils";
import { buildFractionLatexFromParts } from "../../utils/choiceAnswerDisplayFromQti";
import { textEntryValueMatches } from "../text-entry/utils";
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
  readOnly: boolean;
  /** 값을 보여주기만 하는 화면(미리보기·채점)인지 */
  showMath: boolean;
  /** 이 칸의 정답 문자열. `$$...$$` 정답이면 저장값도 같은 형태로 감싼다. */
  correctAnswer?: string;
  alternativeAnswers?: string[];
  /** 제출(채점)일 때만 칸 글자색으로 정오답을 표시한다. */
  isSubmit?: boolean;
  historyScope?: string;
  mathKeyboardLevel?: MathLevel | null;
  onChange: (responseIdentifier: string, value: string) => void;
}

/**
 * 학습자 입력 칸. 텍스트 칸의 크기는 상위 영역이 정한다.
 * 분수 파트는 숨은 sizer가 글자 너비를 재고, 그 칸은 영역 안에서만 커진다.
 * `autocomplete`·`spellcheck`는 건드리지 않는다.
 */
function ImageBlankInput({
  responseIdentifier,
  label,
  numeric,
  partClassName,
  value,
  readOnly,
  showMath,
  correctAnswer,
  alternativeAnswers,
  isSubmit,
  historyScope,
  mathKeyboardLevel,
  onChange,
}: ImageBlankInputProps) {
  // 제출 후에만. 정답 문자열이 없으면 색을 매기지 않는다. 선택 상태에는 쓰지 않는다.
  const gradeClass =
    isSubmit === true && correctAnswer !== undefined
      ? textEntryValueMatches(value, [correctAnswer, ...(alternativeAnswers ?? [])])
        ? "correct"
        : "incorrect"
      : undefined;
  const inputGradeClass = gradeClass
    ? `qti-ext-image-input-blank__input--${gradeClass}`
    : undefined;
  const fieldGradeClass = gradeClass
    ? `qti-ext-image-input-blank__field--${gradeClass}`
    : undefined;

  // 수식은 `$$...$$`로 감싸여 들어온다. renderLaTeX가 바깥 구분자를 벗긴다.
  if (showMath && value.trim() !== "" && isMathLatexAnswer(value)) {
    return (
      <span
        className={clsx(
          "qti-ext-image-input-blank__input",
          "qti-ext-image-input-blank__math",
          partClassName,
          inputGradeClass
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
          partClassName,
          fieldGradeClass
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
    <span className={clsx("qti-ext-image-input-blank__field", partClassName, fieldGradeClass)}>
      {numeric ? (
        <span className="qti-ext-image-input-blank__fraction-sizer" aria-hidden="true">
          {value || "\u00a0"}
        </span>
      ) : null}
      <input
        type="text"
        inputMode={numeric ? "numeric" : undefined}
        className="qti-ext-image-input-blank__input"
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
  /** 칸의 정답 문자열. `$$...$$` 정답이면 저장값도 같은 형태로 감싼다. */
  correctAnswerOf?: (responseIdentifier: string) => string;
  alternativeAnswersOf?: (responseIdentifier: string) => string[];
  /** 제출(채점)일 때만 칸 글자색으로 정오답을 표시한다. */
  isSubmit?: boolean;
  historyScope?: string;
  mathKeyboardLevel?: MathLevel | null;
  onChange: (responseIdentifier: string, value: string) => void;
}

/** 분수·대분수 공통 스택. em 레이아웃은 저작 영역 내부와 같다. */
function ImageBlankFractionStack({
  numeratorId,
  denominatorId,
  displayIndex,
  readOnly,
  showMath,
  valueOf,
  correctAnswerOf,
  alternativeAnswersOf,
  isSubmit,
  onChange,
}: {
  numeratorId: string;
  denominatorId: string;
} & Omit<ImageBlankRegionContentProps, "region" | "showFractionAsLatex">) {
  return (
    <span className="qti-ext-image-input-blank__fraction-stack">
      <ImageBlankInput
        responseIdentifier={numeratorId}
        label={`이미지 빈칸 ${displayIndex} 분자`}
        numeric
        partClassName="qti-ext-image-input-blank__fraction-part"
        value={valueOf(numeratorId)}
        readOnly={readOnly}
        showMath={showMath}
        correctAnswer={correctAnswerOf?.(numeratorId)}
        alternativeAnswers={alternativeAnswersOf?.(numeratorId)}
        isSubmit={isSubmit}
        onChange={onChange}
      />
      <span className="qti-ext-image-input-blank__fraction-line" aria-hidden="true" />
      <ImageBlankInput
        responseIdentifier={denominatorId}
        label={`이미지 빈칸 ${displayIndex} 분모`}
        numeric
        partClassName="qti-ext-image-input-blank__fraction-part"
        value={valueOf(denominatorId)}
        readOnly={readOnly}
        showMath={showMath}
        correctAnswer={correctAnswerOf?.(denominatorId)}
        alternativeAnswers={alternativeAnswersOf?.(denominatorId)}
        isSubmit={isSubmit}
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
  correctAnswerOf,
  alternativeAnswersOf,
  isSubmit,
  historyScope,
  mathKeyboardLevel,
  onChange,
}: ImageBlankRegionContentProps) {
  const shared = {
    displayIndex,
    readOnly,
    showMath,
    valueOf,
    correctAnswerOf,
    alternativeAnswersOf,
    isSubmit,
    onChange,
  };

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
        readOnly={readOnly}
        showMath={showMath}
        correctAnswer={correctAnswerOf?.(region.responseIdentifier)}
        alternativeAnswers={alternativeAnswersOf?.(region.responseIdentifier)}
        isSubmit={isSubmit}
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
          readOnly={readOnly}
          showMath={showMath}
          correctAnswer={correctAnswerOf?.(region.wholeId)}
          alternativeAnswers={alternativeAnswersOf?.(region.wholeId)}
          isSubmit={isSubmit}
          onChange={onChange}
        />
        <ImageBlankFractionStack
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
