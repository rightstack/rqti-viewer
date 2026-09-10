import {
  ITEM_TYPE,
  type QuestionItem,
  type SampleItem,
} from "@rightstack/rqti-viewer";

/**
 * QMS 상세 API에 없는 로컬 테스트 문항.
 * playground에서 API fetch를 건너뛰고 qtiXml을 직접 렌더한다.
 */

const CORRECT_FEEDBACK = {
  id: 1,
  assessmentId: -1,
  feedbackType: "CORRECT",
  feedbackTypeLabel: "해설",
  title: "정답입니다!",
  editorJson: [],
  content:
    "<p>헨젤은 처음에 집으로 돌아가기 위해 조약돌을 떨어뜨렸다. 두번째에는 빵 조각을 떨어뜨렸지만 숲속의 새들이 모두 먹어 버렸다. 그 뒤 헨젤과 그레텔은 숲속에서 과자 집을 발견했다.</p>",
  conditionPresetId: null,
  conditionPresetName: null,
  customCondition: null,
  effectiveCondition: "CORRECT",
  displayOrder: 0,
  createdAt: "",
  updatedAt: "",
};

const HINT_FEEDBACK = {
  id: 2,
  assessmentId: -1,
  feedbackType: "HINT",
  feedbackTypeLabel: "힌트",
  title: "힌트",
  editorJson: [],
  content:
    "<p>헨젤이 길을 찾기 위해 처음에 무엇을 떨어뜨렸는지 떠올려 보자. 그다음 무엇이 없어져 길을 잃게 되었는지 생각해 보자.</p>",
  conditionPresetId: null,
  conditionPresetName: null,
  customCondition: null,
  effectiveCondition: "HINT",
  displayOrder: 1,
  createdAt: "",
  updatedAt: "",
};

/** 순서 정하기 XML 생성기 (선택 방식/라벨 class를 조합해 전달) */
function hanselGretelXml(interactionClass: string) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0"
    identifier="THI_05_HANSEL_GRETEL"
    title="헨젤과 그레텔에게 일어난 일을 순서대로 놓아 보세요."
    adaptive="false"
    time-dependent="false">
    <qti-response-declaration identifier="RESPONSE" cardinality="ordered" base-type="identifier">
        <qti-correct-response>
            <qti-value>CHOICE_2</qti-value>
            <qti-value>CHOICE_3</qti-value>
            <qti-value>CHOICE_1</qti-value>
        </qti-correct-response>
    </qti-response-declaration>
    <qti-item-body>
        <qti-order-interaction response-identifier="RESPONSE"
          class="${interactionClass}">
            <qti-prompt>헨젤과 그레텔에게 일어난 일을 순서대로 놓아 보세요.</qti-prompt>
            <qti-simple-choice identifier="CHOICE_1">헨젤과 그레텔이 과자 집을 발견했어요.</qti-simple-choice>
            <qti-simple-choice identifier="CHOICE_2">헨젤이 조약돌을 떨어뜨렸어요.</qti-simple-choice>
            <qti-simple-choice identifier="CHOICE_3">숲속의 새들이 빵을 먹어 버렸어요.</qti-simple-choice>
        </qti-order-interaction>
    </qti-item-body>
</qti-assessment-item>`;
}

const ORDER_CORRECT_ANSWER = { RESPONSE: ["CHOICE_2", "CHOICE_3", "CHOICE_1"] };

const GAP_MATCH_CORRECT_FEEDBACK = {
  ...CORRECT_FEEDBACK,
  content:
    "<p>가장 큰 행성은 <b>목성</b>, 태양에서 가장 가까운 행성은 <b>수성</b>이에요. 화성은 지구 바로 바깥쪽에 있는 붉은 행성이랍니다.</p>",
};

const GAP_MATCH_HINT_FEEDBACK = {
  ...HINT_FEEDBACK,
  content:
    "<p>행성의 크기와 태양으로부터의 거리를 떠올려 보세요. 수성은 태양과 가장 가깝고, 목성은 태양계에서 가장 큰 행성이에요.</p>",
};

const GAP_MATCH_CORRECT_ANSWER: Record<string, Array<[string, string]>> = {
  RESPONSE: [
    ["GAP_1", "JUPITER"],
    ["GAP_2", "MERCURY"],
    ["GAP_3", "MARS"],
    ["GAP_4", "JUPITER"],
  ],
};

/**
 * 빈칸 매칭(gap-match) XML 생성기.
 * - 선택지는 상단(qti-choices-top) 고정
 * - match-max="0" → 같은 선택지를 여러 빈칸에 반복 배치 가능(multiple)
 * - gap 라벨은 qti-list-style-type-* 로 결정 (여기서는 원문자 ①②③)
 * @param modeClass qti-ext-gap-match-click | qti-ext-gap-match-drag
 */
function planetGapMatchXml(modeClass: string) {
  const interactionClass = `${modeClass} qti-choices-top qti-list-style-type-hangul-syllable`;
  return `<?xml version="1.0" encoding="UTF-8"?><qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0" identifier="GMQ_PLANETS" title="문장의 빈칸에 알맞은 행성을 골라 넣으세요." adaptive="false" time-dependent="false"><qti-response-declaration identifier="RESPONSE" cardinality="multiple" base-type="directedPair"><qti-correct-response><qti-value>JUPITER GAP_1</qti-value><qti-value>MERCURY GAP_2</qti-value><qti-value>MARS GAP_3</qti-value><qti-value>JUPITER GAP_4</qti-value></qti-correct-response></qti-response-declaration><qti-item-body><qti-gap-match-interaction response-identifier="RESPONSE" class="${interactionClass}"><qti-gap-text identifier="JUPITER" match-max="0">목성</qti-gap-text><qti-gap-text identifier="MERCURY" match-max="0">수성</qti-gap-text><qti-gap-text identifier="MARS" match-max="0">화성</qti-gap-text><div class="qti-ext-prompt"><p>문장의 빈칸에 알맞은 행성을 골라 넣으세요.</p></div><div class="qti-ext-example"><span class="qti-ext-example-label">보기</span><p>보기 영역입니다.</p></div><div class="qti-ext-stimulus"><p>지문 영역입니다.</p></div><div class="qti-ext-gap-text-panel"/><p>태양계에서 가장 큰 행성은 <qti-gap identifier="GAP_1"/>이고, 태양에서 가장 가까운 행성은 <qti-gap identifier="GAP_2"/>이며, 지구 바로 바깥쪽에 있는 붉은 행성은 <qti-gap identifier="GAP_3"/>입니다. 태양계에서 가장 무거운 행성 역시 <qti-gap identifier="GAP_4"/>이에요.</p></qti-gap-match-interaction></qti-item-body></qti-assessment-item>`;
}

function vcqPci(id: string, width = 1): string {
  return `<qti-portable-custom-interaction custom-interaction-type-identifier="math-input-blank" response-identifier="${id}"><qti-interaction-markup><div class="qti-ext-input-blank" data-latex="\\inputblank{${id}}{${width}}"></div></qti-interaction-markup></qti-portable-custom-interaction>`;
}

function vcqPciCell(id: string, extraAttrs = "", width = 1): string {
  return `<div class="qti-ext-vcq-cell qti-ext-vcq-cell--blank"${extraAttrs ? ` ${extraAttrs}` : ""}>${vcqPci(id, width)}</div>`;
}

function vcqMathCell(latex: string): string {
  return `<div class="qti-ext-vcq-cell"><span class="qti-ext-mathfield">${latex}</span></div>`;
}

const VCQ_ARITHMETIC_XML = `<?xml version="1.0" encoding="UTF-8"?>
<qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0" identifier="quiz_vcq_arithmetic" title="세로셈 곱셈" xml:lang="ko-KR">
  <qti-response-declaration identifier="RESPONSE_ANS" cardinality="single" base-type="string"><qti-correct-response><qti-value>74</qti-value></qti-correct-response></qti-response-declaration>
  <qti-response-declaration identifier="RESPONSE_1" cardinality="single" base-type="string"><qti-correct-response><qti-value>1</qti-value></qti-correct-response></qti-response-declaration>
  <qti-response-declaration identifier="RESPONSE_2" cardinality="single" base-type="string"><qti-correct-response><qti-value>7</qti-value></qti-correct-response></qti-response-declaration>
  <qti-response-declaration identifier="RESPONSE_3" cardinality="single" base-type="string"><qti-correct-response><qti-value>4</qti-value></qti-correct-response></qti-response-declaration>
  <qti-item-body>
    <p>다음을 계산하시오.</p>
    <p>37 × 2 = ${vcqPci("RESPONSE_ANS", 2)}</p>
    <div class="qti-ext-vcq-grid qti-ext-vcq-grid--response qti-ext-vcq-grid--template-arithmetic qti-ext-vcq-grid--align-center qti-align-right">
      <div class="qti-ext-vcq-row qti-ext-vcq-row--carry">${vcqPciCell("RESPONSE_1")}<div class="qti-ext-vcq-cell"></div></div>
      <div class="qti-ext-vcq-row">${vcqMathCell("3")}${vcqMathCell("7")}</div>
      <div class="qti-ext-vcq-row">${vcqMathCell("\\times")}${vcqMathCell("2")}</div>
      <div class="qti-ext-vcq-row">${vcqPciCell("RESPONSE_2", 'data-vcq-border-top="1"')}${vcqPciCell("RESPONSE_3", 'data-vcq-border-top="1"')}</div>
    </div>
  </qti-item-body>
</qti-assessment-item>`;

const VCQ_CORRECT_ANSWER = {
  RESPONSE_ANS: ["74"],
  RESPONSE_1: ["1"],
  RESPONSE_2: ["7"],
  RESPONSE_3: ["4"],
};

const VCQ_FEEDBACK = {
  ...CORRECT_FEEDBACK,
  content: "<p>7 × 2 = 14이므로 받아올림 1을 적고, 3 × 2 + 1 = 7입니다. 정답은 74입니다.</p>",
};

/** 운영 QMS 문항 i_ff9bgpyu1s9y6d9r — 병합 빈칸 + 나눗셈 브래킷 */
const VCQ_DIV_MERGED_XML = `<?xml version="1.0" encoding="UTF-8"?>
<qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0" identifier="i_ff9bgpyu1s9y6d9r" title="세로셈 병합 빈칸" time-dependent="false">
  <qti-response-declaration identifier="RESPONSE_1" cardinality="single" base-type="string"><qti-correct-response><qti-value>12</qti-value></qti-correct-response></qti-response-declaration>
  <qti-response-declaration identifier="RESPONSE_2" cardinality="single" base-type="string"><qti-correct-response><qti-value>2</qti-value></qti-correct-response></qti-response-declaration>
  <qti-item-body>
    <div class="qti-ext-question">
      <div class="qti-ext-vcq-grid qti-ext-vcq-grid--response qti-ext-vcq-grid--template-div-forward qti-align-center">
        <div class="qti-ext-vcq-row">
          <div class="qti-ext-vcq-cell"></div>
          <div class="qti-ext-vcq-cell qti-ext-vcq-cell--blank qti-ext-vcq-cell--merged" data-vcq-colspan="2">${vcqPci("RESPONSE_1", 2)}</div>
        </div>
        <div class="qti-ext-vcq-row">
          ${vcqMathCell("2")}${vcqMathCell("2")}${vcqMathCell("4")}
        </div>
        <div class="qti-ext-vcq-row">
          <div class="qti-ext-vcq-cell"></div>
          ${vcqPciCell("RESPONSE_2")}
          ${vcqMathCell("4")}
        </div>
        <span class="qti-ext-vcq-division-bar-track" data-vcq-grid-column="2 / 4" data-vcq-grid-row="2 / 3" aria-hidden="true"><span class="qti-ext-vcq-division-bar"></span></span>
      </div>
    </div>
  </qti-item-body>
</qti-assessment-item>`;

const VCQ_DIV_MERGED_ANSWER = {
  RESPONSE_1: ["12"],
  RESPONSE_2: ["2"],
};

const VCQ_DIV_MERGED_FEEDBACK = {
  ...CORRECT_FEEDBACK,
  content: "<p>24 ÷ 2 = 12입니다. 몫은 두 칸을 이은 빈칸에 12, 아래 칸에는 2를 적습니다.</p>",
};

const VCQ_DIV_MERGED_HINT = {
  ...HINT_FEEDBACK,
  content: "<p>나누는 수 2가 24의 십의 자리에 몇 번 들어가는지부터 생각해 보세요.</p>",
};

/** 운영 QMS 문항 i_mezwlstrosh33wqi — 수식 안 빈칸 + 단독 수식 빈칸 + 단답 */
const MATH_BLANK_CLOZE_XML = String.raw`<?xml version="1.0" encoding="UTF-8"?>
<qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0" identifier="i_mezwlstrosh33wqi" title="수식내빈칸뷰어테스트" time-dependent="false">
  <qti-response-declaration identifier="BLANK_1" cardinality="single" base-type="string"><qti-correct-response><qti-value>x-1</qti-value></qti-correct-response></qti-response-declaration>
  <qti-response-declaration identifier="MATH_RESPONSE_1" cardinality="record">
    <qti-correct-response>
      <qti-value field-identifier="RESPONSE_9" base-type="string">\frac{3}{4}</qti-value>
      <qti-value field-identifier="RESPONSE_10" base-type="string">5</qti-value>
      <qti-value field-identifier="RESPONSE_11" base-type="string">\frac{4}{5}</qti-value>
      <qti-value field-identifier="RESPONSE_12" base-type="string">-6</qti-value>
    </qti-correct-response>
  </qti-response-declaration>
  <qti-response-declaration identifier="MATH_RESPONSE_2" cardinality="record">
    <qti-correct-response>
      <qti-value field-identifier="RESPONSE_14" base-type="string">\frac{3}{4}</qti-value>
    </qti-correct-response>
  </qti-response-declaration>
  <qti-item-body>
    <div class="qti-ext-question">
      <div>
        <qti-portable-custom-interaction response-identifier="MATH_RESPONSE_1" custom-interaction-type-identifier="math-input-blank">
          <qti-interaction-markup>
            <div class="qti-ext-math-input-blank" data-latex="\begin{align}\frac{3}{4}\times\left({-11}\right)+\frac{3}{4}\times3\\= \inputblank{RESPONSE_9}{2}\times\left\{{\left({-11}\right)}+\inputblank{RESPONSE_10}{3}\right\}\\=\inputblank{RESPONSE_11}{1}\times\left({-8}\right)\\=\inputblank{RESPONSE_12}{5}\end{align}"/>
          </qti-interaction-markup>
        </qti-portable-custom-interaction>
      </div>
      <div>
        <qti-portable-custom-interaction response-identifier="MATH_RESPONSE_2" custom-interaction-type-identifier="math-input-blank">
          <qti-interaction-markup>
            <div class="qti-ext-math-input-blank" data-latex="\inputblank{RESPONSE_14}{1}"/>
          </qti-interaction-markup>
        </qti-portable-custom-interaction>
        <qti-text-entry-interaction response-identifier="BLANK_1" expected-length="50"/>
      </div>
    </div>
  </qti-item-body>
</qti-assessment-item>`;

const MATH_BLANK_CLOZE_ANSWER = {
  RESPONSE_9: [String.raw`\frac{3}{4}`],
  RESPONSE_10: ["5"],
  RESPONSE_11: [String.raw`\frac{4}{5}`],
  RESPONSE_12: ["-6"],
  RESPONSE_14: [String.raw`\frac{3}{4}`],
  BLANK_1: ["x-1"],
};

const MATH_BLANK_CLOZE_FEEDBACK = {
  ...CORRECT_FEEDBACK,
  content:
    "<p>분배법칙으로 \\(\\frac{3}{4}\\times(-11+3)=\\frac{3}{4}\\times(-8)=-6\\) 입니다. 마지막 단답은 \\(x-1\\) 입니다.</p>",
};

const MATH_BLANK_CLOZE_HINT = {
  ...HINT_FEEDBACK,
  content: "<p>같은 계수 \\(\\frac{3}{4}\\)를 괄호 밖으로 묶어 보세요.</p>",
};

/** 운영 QMS 문항 i_8dsb050czsu2egb6 — 받아올림·소수 좁은 칸·병합 */
const VCQ_DECIMAL_MERGED_XML = String.raw`<?xml version="1.0" encoding="UTF-8"?>
<qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0" identifier="i_8dsb050czsu2egb6" title="세로셈 테스트" time-dependent="false">
  <qti-response-declaration identifier="RESPONSE_1" cardinality="single" base-type="string"><qti-correct-response><qti-value>.</qti-value></qti-correct-response></qti-response-declaration>
  <qti-response-declaration identifier="RESPONSE_2" cardinality="single" base-type="string"><qti-correct-response><qti-value>3</qti-value></qti-correct-response></qti-response-declaration>
  <qti-item-body>
    <div class="qti-ext-question">
      <div class="qti-ext-vcq-grid qti-ext-vcq-grid--response qti-ext-vcq-grid--template-arithmetic qti-align-right">
        <div class="qti-ext-vcq-row qti-ext-vcq-row--carry">
          <div class="qti-ext-vcq-cell qti-ext-vcq-cell--carry"></div>
          <div class="qti-ext-vcq-cell qti-ext-vcq-cell--carry"><span class="qti-ext-mathfield" data-latex="2">2</span></div>
          <div class="qti-ext-vcq-cell qti-ext-vcq-cell--carry"></div>
          <div class="qti-ext-vcq-cell qti-ext-vcq-cell--carry qti-ext-vcq-col--narrow"></div>
          <div class="qti-ext-vcq-cell qti-ext-vcq-cell--carry"></div>
          <div class="qti-ext-vcq-cell qti-ext-vcq-cell--carry qti-ext-vcq-col--narrow"></div>
          <div class="qti-ext-vcq-cell qti-ext-vcq-cell--carry"></div>
        </div>
        <div class="qti-ext-vcq-row">
          <div class="qti-ext-vcq-cell"></div>
          <div class="qti-ext-vcq-cell"><span class="qti-ext-mathfield" data-latex="1">1</span></div>
          <div class="qti-ext-vcq-cell"><span class="qti-ext-mathfield" data-latex="5">5</span></div>
          <div class="qti-ext-vcq-cell qti-ext-vcq-col--narrow qti-ext-vcq-cell--blank">${vcqPci("RESPONSE_1")}</div>
          <div class="qti-ext-vcq-cell qti-ext-vcq-cell--blank">${vcqPci("RESPONSE_2")}</div>
          <div class="qti-ext-vcq-cell qti-ext-vcq-col--narrow"></div>
          <div class="qti-ext-vcq-cell"></div>
        </div>
        <div class="qti-ext-vcq-row">
          <div class="qti-ext-vcq-cell"><span class="qti-ext-mathfield" data-latex="+">+</span></div>
          <div class="qti-ext-vcq-cell"><span class="qti-ext-mathfield" data-latex="2">2</span></div>
          <div class="qti-ext-vcq-cell"><span class="qti-ext-mathfield" data-latex="5">5</span></div>
          <div class="qti-ext-vcq-cell qti-ext-vcq-col--narrow"><span class="qti-ext-mathfield" data-latex=".">.</span></div>
          <div class="qti-ext-vcq-cell"><span class="qti-ext-mathfield" data-latex="3">3</span></div>
          <div class="qti-ext-vcq-cell qti-ext-vcq-col--narrow"></div>
          <div class="qti-ext-vcq-cell"></div>
        </div>
        <div class="qti-ext-vcq-row">
          <div class="qti-ext-vcq-cell" data-vcq-border-top="1"></div>
          <div class="qti-ext-vcq-cell qti-ext-vcq-cell--merged" data-vcq-colspan="2" data-vcq-border-top="1"><span class="qti-ext-mathfield" data-latex="2">2</span></div>
          <div class="qti-ext-vcq-cell qti-ext-vcq-col--narrow qti-ext-vcq-cell--merged" data-vcq-colspan="2" data-vcq-border-top="1"><span class="qti-ext-mathfield" data-latex="3">3</span></div>
          <div class="qti-ext-vcq-cell qti-ext-vcq-col--narrow"></div>
          <div class="qti-ext-vcq-cell"><span class="qti-ext-mathfield" data-latex="1">1</span></div>
        </div>
        <div class="qti-ext-vcq-row">
          <div class="qti-ext-vcq-cell"></div>
          <div class="qti-ext-vcq-cell"></div>
          <div class="qti-ext-vcq-cell"><span class="qti-ext-mathfield" data-latex="2">2</span></div>
          <div class="qti-ext-vcq-cell qti-ext-vcq-col--narrow"><span class="qti-ext-mathfield" data-latex=".">.</span></div>
          <div class="qti-ext-vcq-cell qti-ext-vcq-cell--merged" data-vcq-colspan="3"><span class="qti-ext-mathfield" data-latex="3">3</span></div>
        </div>
      </div>
    </div>
  </qti-item-body>
</qti-assessment-item>`;

const VCQ_DECIMAL_MERGED_ANSWER = {
  RESPONSE_1: ["."],
  RESPONSE_2: ["3"],
};

const VCQ_DECIMAL_MERGED_FEEDBACK = {
  ...CORRECT_FEEDBACK,
  content: "<p>15.3 + 25.3 = 40.6이 아니라, 이 문항은 소수점을 맞추고 받아올림 2를 반영한 세로셈 배치를 확인합니다. 빈칸은 소수점과 3입니다.</p>",
};

const VCQ_DECIMAL_MERGED_HINT = {
  ...HINT_FEEDBACK,
  content: "<p>아래 더하는 수의 소수점 위치와 맞춰 보세요.</p>",
};

function vcqEmptyCell(): string {
  return `<div class="qti-ext-vcq-cell"></div>`;
}

/** 운영 QMS 문항 i_3k2jyzlz5otx3k36 — 조립제법 2단 ㄴ 브래킷 */
const VCQ_SYNTHETIC_XML = String.raw`<?xml version="1.0" encoding="UTF-8"?>
<qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0" identifier="i_3k2jyzlz5otx3k36" title="조립제법" time-dependent="false">
  <qti-response-declaration identifier="RESPONSE_1" cardinality="single" base-type="string"><qti-correct-response><qti-value>3</qti-value></qti-correct-response></qti-response-declaration>
  <qti-response-declaration identifier="RESPONSE_2" cardinality="single" base-type="string"><qti-correct-response><qti-value>7</qti-value></qti-correct-response></qti-response-declaration>
  <qti-response-declaration identifier="RESPONSE_3" cardinality="single" base-type="string"><qti-correct-response><qti-value>2</qti-value></qti-correct-response></qti-response-declaration>
  <qti-response-declaration identifier="RESPONSE_4" cardinality="single" base-type="string"><qti-correct-response><qti-value>2</qti-value></qti-correct-response></qti-response-declaration>
  <qti-response-declaration identifier="RESPONSE_5" cardinality="single" base-type="string"><qti-correct-response><qti-value>-3</qti-value></qti-correct-response></qti-response-declaration>
  <qti-response-declaration identifier="RESPONSE_6" cardinality="single" base-type="string"><qti-correct-response><qti-value>-4</qti-value></qti-correct-response></qti-response-declaration>
  <qti-response-declaration identifier="RESPONSE_7" cardinality="single" base-type="string"><qti-correct-response><qti-value>4</qti-value></qti-correct-response></qti-response-declaration>
  <qti-item-body>
    <div class="qti-ext-question">
      <p>다음은 다항식 <span class="qti-ext-mathfield" data-latex="ax^3 + bx^2 + cx+2">ax^3 + bx^2 + cx+2</span>를 <span class="qti-ext-mathfield" data-latex="x^2 -1">x^2 -1</span>로 나누었을 때의 몫 Q(x) 와 나머지 R(x)를 구하기 위해 조립제법을 2번 이용하는 과정이다. 각 상자에 들어갈 알맞은 값을 순서대로 넣으세요.</p>
      <div class="qti-ext-vcq-grid qti-ext-vcq-grid--response qti-ext-vcq-grid--template-synthetic-2 qti-align-center">
        <div class="qti-ext-vcq-row">${vcqMathCell("1")}${vcqMathCell("a")}${vcqMathCell("b")}${vcqMathCell("c")}${vcqMathCell("d")}</div>
        <div class="qti-ext-vcq-row">${vcqEmptyCell()}${vcqEmptyCell()}${vcqPciCell("RESPONSE_1")}${vcqPciCell("RESPONSE_2")}${vcqPciCell("RESPONSE_3")}</div>
        <div class="qti-ext-vcq-row">${vcqMathCell("-1")}${vcqMathCell("3")}${vcqMathCell("7")}${vcqPciCell("RESPONSE_4")}${vcqMathCell("5")}</div>
        <div class="qti-ext-vcq-row">${vcqEmptyCell()}${vcqEmptyCell()}${vcqPciCell("RESPONSE_5", "", 2)}${vcqPciCell("RESPONSE_6", "", 2)}${vcqEmptyCell()}</div>
        <div class="qti-ext-vcq-row">${vcqEmptyCell()}${vcqMathCell("3")}${vcqPciCell("RESPONSE_7")}${vcqMathCell("-2")}${vcqEmptyCell()}</div>
        <span class="qti-ext-vcq-synthetic-bracket" data-vcq-grid-column="2 / 6" data-vcq-grid-row="1 / 3" aria-hidden="true"></span>
        <span class="qti-ext-vcq-synthetic-bracket qti-ext-vcq-synthetic-bracket--stacked" data-vcq-grid-column="2 / 5" data-vcq-grid-row="3 / 5" aria-hidden="true"></span>
        <span class="qti-ext-vcq-remainder" data-vcq-grid-column="5 / 6" data-vcq-grid-row="3 / 4" aria-hidden="true"></span>
        <span class="qti-ext-vcq-remainder" data-vcq-grid-column="4 / 5" data-vcq-grid-row="5 / 6" aria-hidden="true"></span>
      </div>
    </div>
  </qti-item-body>
</qti-assessment-item>`;

const VCQ_SYNTHETIC_ANSWER = {
  RESPONSE_1: ["3"],
  RESPONSE_2: ["7"],
  RESPONSE_3: ["2"],
  RESPONSE_4: ["2"],
  RESPONSE_5: ["-3"],
  RESPONSE_6: ["-4"],
  RESPONSE_7: ["4"],
};

const VCQ_SYNTHETIC_FEEDBACK = {
  ...CORRECT_FEEDBACK,
  content: "<p>조립제법을 두 번 적용한 표입니다. 위 ㄴ은 계수 행을, 아래 ㄴ은 두 번째 조립 구간을 감쌉니다.</p>",
};

const VCQ_SYNTHETIC_HINT = {
  ...HINT_FEEDBACK,
  content: "<p>첫 조립에서 내려온 값을 다음 칸에 곱해 더해 보세요.</p>",
};

export const LOCAL_ITEMS: Record<string, QuestionItem> = {
  ORDER_CLICK_HANSEL: {
    id: -1,
    qtiIdentifier: "ORDER_CLICK_HANSEL",
    title: "헨젤과 그레텔 (클릭 순서)",
    type: ITEM_TYPE.ORDER,
    qtiXml: hanselGretelXml(
      "qti-ext-ordering-click qti-list-style-type-upper-alpha",
    ),
    correctAnswer: ORDER_CORRECT_ANSWER,
    settings: null,
    feedbacks: [CORRECT_FEEDBACK, HINT_FEEDBACK],
  },
  ORDER_DRAG_HANSEL: {
    id: -2,
    qtiIdentifier: "ORDER_DRAG_HANSEL",
    title: "헨젤과 그레텔 (드래그 순서)",
    type: ITEM_TYPE.ORDER,
    qtiXml: hanselGretelXml(
      "qti-ext-ordering-drag qti-list-style-type-upper-alpha",
    ),
    correctAnswer: ORDER_CORRECT_ANSWER,
    settings: null,
    feedbacks: [CORRECT_FEEDBACK, HINT_FEEDBACK],
  },
  GAP_MATCH_PLANETS_CLICK: {
    id: -3,
    qtiIdentifier: "GAP_MATCH_PLANETS_CLICK",
    title: "행성 빈칸 매칭 (클릭)",
    type: ITEM_TYPE.GMQ,
    qtiXml: planetGapMatchXml("qti-ext-gap-match-click"),
    correctAnswer: GAP_MATCH_CORRECT_ANSWER,
    settings: null,
    feedbacks: [GAP_MATCH_CORRECT_FEEDBACK, GAP_MATCH_HINT_FEEDBACK],
  },
  GAP_MATCH_PLANETS_DRAG: {
    id: -4,
    qtiIdentifier: "GAP_MATCH_PLANETS_DRAG",
    title: "행성 빈칸 매칭 (드래그)",
    type: ITEM_TYPE.GMQ,
    qtiXml: planetGapMatchXml("qti-ext-gap-match-drag"),
    correctAnswer: GAP_MATCH_CORRECT_ANSWER,
    settings: null,
    feedbacks: [GAP_MATCH_CORRECT_FEEDBACK, GAP_MATCH_HINT_FEEDBACK],
  },
  VCQ_ARITHMETIC: {
    id: -5,
    qtiIdentifier: "VCQ_ARITHMETIC",
    title: "세로셈 곱셈",
    type: ITEM_TYPE.VCQ,
    qtiXml: VCQ_ARITHMETIC_XML,
    correctAnswer: VCQ_CORRECT_ANSWER,
    settings: null,
    feedbacks: [VCQ_FEEDBACK, HINT_FEEDBACK],
  },
  VCQ_DIV_MERGED: {
    id: -6,
    qtiIdentifier: "VCQ_DIV_MERGED",
    title: "세로셈 병합 빈칸",
    type: ITEM_TYPE.VCQ,
    qtiXml: VCQ_DIV_MERGED_XML,
    correctAnswer: VCQ_DIV_MERGED_ANSWER,
    settings: null,
    feedbacks: [VCQ_DIV_MERGED_FEEDBACK, VCQ_DIV_MERGED_HINT],
  },
  MATH_BLANK_CLOZE: {
    id: -7,
    qtiIdentifier: "MATH_BLANK_CLOZE",
    title: "수식 내 빈칸",
    type: ITEM_TYPE.CLOZE,
    qtiXml: MATH_BLANK_CLOZE_XML,
    correctAnswer: MATH_BLANK_CLOZE_ANSWER,
    settings: null,
    feedbacks: [MATH_BLANK_CLOZE_FEEDBACK, MATH_BLANK_CLOZE_HINT],
  },
  VCQ_DECIMAL_MERGED: {
    id: -8,
    qtiIdentifier: "VCQ_DECIMAL_MERGED",
    title: "세로셈 소수·병합",
    type: ITEM_TYPE.VCQ,
    qtiXml: VCQ_DECIMAL_MERGED_XML,
    correctAnswer: VCQ_DECIMAL_MERGED_ANSWER,
    settings: null,
    feedbacks: [VCQ_DECIMAL_MERGED_FEEDBACK, VCQ_DECIMAL_MERGED_HINT],
  },
  VCQ_SYNTHETIC: {
    id: -9,
    qtiIdentifier: "VCQ_SYNTHETIC",
    title: "조립제법",
    type: ITEM_TYPE.VCQ,
    qtiXml: VCQ_SYNTHETIC_XML,
    correctAnswer: VCQ_SYNTHETIC_ANSWER,
    settings: null,
    feedbacks: [VCQ_SYNTHETIC_FEEDBACK, VCQ_SYNTHETIC_HINT],
  },
};

export const LOCAL_SAMPLE_ITEMS: SampleItem[] = [
  {
    type: ITEM_TYPE.ORDER,
    label: "순서 배열형 · 클릭 (ORDER)",
    qtiIdentifier: "ORDER_CLICK_HANSEL",
  },
  {
    type: ITEM_TYPE.ORDER,
    label: "순서 배열형 · 드래그 (ORDER)",
    qtiIdentifier: "ORDER_DRAG_HANSEL",
  },
  {
    type: ITEM_TYPE.GMQ,
    label: "빈칸 매칭 · 클릭 (GMQ)",
    qtiIdentifier: "GAP_MATCH_PLANETS_CLICK",
  },
  {
    type: ITEM_TYPE.GMQ,
    label: "빈칸 매칭 · 드래그 (GMQ)",
    qtiIdentifier: "GAP_MATCH_PLANETS_DRAG",
  },
  {
    type: ITEM_TYPE.VCQ,
    label: "세로셈형 (VCQ)",
    qtiIdentifier: "VCQ_ARITHMETIC",
  },
  {
    type: ITEM_TYPE.VCQ,
    label: "세로셈형 · 나눗셈 병합 (VCQ)",
    qtiIdentifier: "VCQ_DIV_MERGED",
  },
  {
    type: ITEM_TYPE.CLOZE,
    label: "수식 내 빈칸 (CLOZE)",
    qtiIdentifier: "MATH_BLANK_CLOZE",
  },
  {
    type: ITEM_TYPE.VCQ,
    label: "세로셈형 · 소수 병합 (VCQ)",
    qtiIdentifier: "VCQ_DECIMAL_MERGED",
  },
  {
    type: ITEM_TYPE.VCQ,
    label: "세로셈형 · 조립제법 (VCQ)",
    qtiIdentifier: "VCQ_SYNTHETIC",
  },
];
