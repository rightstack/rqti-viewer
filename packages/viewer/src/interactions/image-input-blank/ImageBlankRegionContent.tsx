import clsx from "clsx";
import { renderLaTeX } from "../../parser/parseLatexToReact";
import { isMathLatexAnswer } from "../../utils";
import { IMAGE_BLANK_INPUT_MAX_LENGTH, type ImageBlankRegion } from "./utils";

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

  return (
    <input
      type="text"
      inputMode={numeric ? "numeric" : undefined}
      className={clsx("qti-ext-image-input-blank__input", partClassName, stateClassName)}
      data-response-identifier={responseIdentifier}
      aria-label={label}
      value={value}
      maxLength={IMAGE_BLANK_INPUT_MAX_LENGTH}
      readOnly={readOnly}
      onChange={(event) => onChange(responseIdentifier, event.target.value)}
    />
  );
}

interface ImageBlankRegionContentProps {
  region: ImageBlankRegion;
  /** 화면 안내용 번호. 저장 식별자가 아니다. */
  displayIndex: number;
  readOnly: boolean;
  showMath: boolean;
  valueOf: (responseIdentifier: string) => string;
  stateClassOf: (responseIdentifier: string) => string;
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
} & Omit<ImageBlankRegionContentProps, "region">) {
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
  valueOf,
  stateClassOf,
  onChange,
}: ImageBlankRegionContentProps) {
  const shared = { displayIndex, readOnly, showMath, valueOf, stateClassOf, onChange };

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
