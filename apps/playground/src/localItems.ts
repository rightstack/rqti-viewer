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

/** 운영 QMS i_5myahne55j0o1wbm — PCI `MATH_RESPONSE_1` 배열로만 응답이 옴 */
const MATH_BLANK_EXPONENT_XML = `<?xml version="1.0" encoding="UTF-8"?>
<qti-assessment-item xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0" identifier="i_5myahne55j0o1wbm" title="수식 내 인풋박스 테스트" time-dependent="false"><qti-response-declaration identifier="MATH_RESPONSE_1" cardinality="record"><qti-correct-response><qti-value field-identifier="RESPONSE_1" base-type="string">$2$</qti-value><qti-value field-identifier="RESPONSE_2" base-type="string">$10$</qti-value><qti-value field-identifier="RESPONSE_3" base-type="string">$10$</qti-value><qti-value field-identifier="RESPONSE_4" base-type="string">$14$</qti-value></qti-correct-response></qti-response-declaration><qti-item-body><div class="qti-ext-question"><p>~~ 안에 알맞은 수를 써넣으시오.</p><div class="qti-ext-stimulus"><div class="qti-align-center"><qti-portable-custom-interaction response-identifier="MATH_RESPONSE_1" custom-interaction-type-identifier="math-input-blank"><qti-interaction-markup><div class="qti-ext-math-input-blank" data-latex="\\begin{aligned} \\left({x^5}\\right)^2 \\times x^4 &amp;= x^{5 \\times \\inputblank{RESPONSE_1}{1}} \\times x^4 = x^{\\inputblank{RESPONSE_2}{1}} \\times x^4 \\\\ &amp;= x^{\\inputblank{RESPONSE_3}{1}+4} = x^{\\inputblank{RESPONSE_4}{1}} \\end{aligned}"/></qti-interaction-markup></qti-portable-custom-interaction></div></div></div></qti-item-body></qti-assessment-item>`;

const MATH_BLANK_EXPONENT_ANSWER = {
  MATH_RESPONSE_1: ["$2$", "$10$", "$10$", "$14$"],
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

function vcqCancelPci(id: string, width = 1): string {
  return `<qti-portable-custom-interaction custom-interaction-type-identifier="math-input-blank" response-identifier="${id}"><qti-interaction-markup><div class="qti-ext-input-blank" data-latex="\\cancel{\\inputblank{${id}}{${width}}}"></div></qti-interaction-markup></qti-portable-custom-interaction>`;
}

const VCQ_CANCEL_BLANK_XML = `<?xml version="1.0" encoding="UTF-8"?>
<qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0" identifier="quiz_vcq_cancel_blank" title="세로셈 취소선 빈칸" xml:lang="ko-KR">
  <qti-response-declaration identifier="RESPONSE_1" cardinality="single" base-type="string"><qti-correct-response><qti-value>3</qti-value></qti-correct-response></qti-response-declaration>
  <qti-response-declaration identifier="RESPONSE_2" cardinality="single" base-type="string"><qti-correct-response><qti-value>2</qti-value></qti-correct-response></qti-response-declaration>
  <qti-item-body>
    <p>취소선이 있는 빈칸에 알맞은 수를 쓰시오.</p>
    <div class="qti-ext-vcq-grid qti-ext-vcq-grid--response qti-ext-vcq-grid--template-arithmetic qti-align-center">
      <div class="qti-ext-vcq-row">
        ${vcqMathCell("1")}${vcqMathCell("5")}
      </div>
      <div class="qti-ext-vcq-row">
        <div class="qti-ext-vcq-cell qti-ext-vcq-cell--blank">${vcqCancelPci("RESPONSE_1")}</div>
        <div class="qti-ext-vcq-cell qti-ext-vcq-cell--blank">${vcqPci("RESPONSE_2")}</div>
      </div>
    </div>
  </qti-item-body>
</qti-assessment-item>`;

const VCQ_CANCEL_BLANK_ANSWER = {
  RESPONSE_1: ["3"],
  RESPONSE_2: ["2"],
};

const VCQ_CANCEL_BLANK_FEEDBACK = {
  ...CORRECT_FEEDBACK,
  content: "<p>취소선이 그어진 칸에 3, 옆 칸에 2를 적습니다.</p>",
};

/** 운영 문항 i_6rceiajpw7kfhy3c — template-narrow 소인수분해 */
const GCD_NARROW_XML = String.raw`<?xml version="1.0" encoding="UTF-8"?>
<qti-assessment-item xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0" identifier="i_6rceiajpw7kfhy3c" title="맞춤온_연결지문 테스트2" time-dependent="false"><qti-response-declaration identifier="RESPONSE_1" cardinality="single" base-type="string"><qti-correct-response><qti-value>$7$</qti-value></qti-correct-response></qti-response-declaration><qti-response-declaration identifier="RESPONSE_3" cardinality="single" base-type="string"><qti-correct-response><qti-value>$14$</qti-value></qti-correct-response></qti-response-declaration><qti-response-declaration identifier="RESPONSE_4" cardinality="single" base-type="string"><qti-correct-response><qti-value>$2$</qti-value></qti-correct-response></qti-response-declaration><qti-response-declaration identifier="RESPONSE_5" cardinality="single" base-type="string"><qti-correct-response><qti-value>$3$</qti-value></qti-correct-response></qti-response-declaration><qti-response-declaration identifier="RESPONSE_6" cardinality="single" base-type="string"><qti-correct-response><qti-value>$7$</qti-value></qti-correct-response></qti-response-declaration><qti-item-body><div class="qti-ext-question"><p>(2) 나눗셈을 이용하는 방법</p><div class="qti-ext-vcq-grid qti-ext-vcq-grid--response qti-ext-vcq-grid--template-narrow qti-ext-vcq-grid--size-small qti-align-center"><div class="qti-ext-vcq-row qti-ext-vcq-row--normal"><div class="qti-ext-vcq-cell"><span class="qti-ext-mathfield" data-latex="2">2</span></div><div class="qti-ext-vcq-cell"><span class="qti-ext-mathfield" data-latex="28">28</span></div><div class="qti-ext-vcq-cell"><span class="qti-ext-mathfield" data-latex="42">42</span></div><div class="qti-ext-vcq-cell"/><div class="qti-ext-vcq-cell"/><div class="qti-ext-vcq-cell"/><div class="qti-ext-vcq-cell"/><div class="qti-ext-vcq-cell"/><div class="qti-ext-vcq-cell"/><div class="qti-ext-vcq-cell"/><div class="qti-ext-vcq-cell"/><div class="qti-ext-vcq-cell"/><div class="qti-ext-vcq-cell"/><div class="qti-ext-vcq-cell"/></div><div class="qti-ext-vcq-row qti-ext-vcq-row--normal"><div class="qti-ext-vcq-cell qti-ext-vcq-cell--blank"><qti-portable-custom-interaction response-identifier="RESPONSE_1" custom-interaction-type-identifier="math-input-blank" data-is-math="true" data-school-level="m"><qti-interaction-markup><div class="qti-ext-input-blank" data-latex="\inputblank{RESPONSE_1}{1}"/></qti-interaction-markup></qti-portable-custom-interaction></div><div class="qti-ext-vcq-cell qti-ext-vcq-cell--blank"><qti-portable-custom-interaction response-identifier="RESPONSE_3" custom-interaction-type-identifier="math-input-blank" data-is-math="true" data-school-level="m"><qti-interaction-markup><div class="qti-ext-input-blank" data-latex="\inputblank{RESPONSE_3}{2}"/></qti-interaction-markup></qti-portable-custom-interaction></div><div class="qti-ext-vcq-cell"><span class="qti-ext-mathfield" data-latex="21">21</span></div><div class="qti-ext-vcq-cell"/><div class="qti-ext-vcq-cell"/><div class="qti-ext-vcq-cell"/><div class="qti-ext-vcq-cell"/><div class="qti-ext-vcq-cell"/><div class="qti-ext-vcq-cell"/><div class="qti-ext-vcq-cell"/><div class="qti-ext-vcq-cell"/><div class="qti-ext-vcq-cell"/><div class="qti-ext-vcq-cell"/><div class="qti-ext-vcq-cell"/></div><div class="qti-ext-vcq-row qti-ext-vcq-row--normal"><div class="qti-ext-vcq-cell"/><div class="qti-ext-vcq-cell qti-ext-vcq-cell--blank"><qti-portable-custom-interaction response-identifier="RESPONSE_4" custom-interaction-type-identifier="math-input-blank" data-is-math="true" data-school-level="m"><qti-interaction-markup><div class="qti-ext-input-blank" data-latex="\inputblank{RESPONSE_4}{1}"/></qti-interaction-markup></qti-portable-custom-interaction></div><div class="qti-ext-vcq-cell qti-ext-vcq-cell--blank"><qti-portable-custom-interaction response-identifier="RESPONSE_5" custom-interaction-type-identifier="math-input-blank" data-is-math="true" data-school-level="m"><qti-interaction-markup><div class="qti-ext-input-blank" data-latex="\inputblank{RESPONSE_5}{1}"/></qti-interaction-markup></qti-portable-custom-interaction></div><div class="qti-ext-vcq-cell"/><div class="qti-ext-vcq-cell"/><div class="qti-ext-vcq-cell"/><div class="qti-ext-vcq-cell"/><div class="qti-ext-vcq-cell"/><div class="qti-ext-vcq-cell"/><div class="qti-ext-vcq-cell"/><div class="qti-ext-vcq-cell"/><div class="qti-ext-vcq-cell"/><div class="qti-ext-vcq-cell"/><div class="qti-ext-vcq-cell"/></div><div class="qti-ext-vcq-row qti-ext-vcq-row--normal"><div class="qti-ext-vcq-cell qti-ext-vcq-cell--blank qti-ext-vcq-cell--merged qti-align-left" data-vcq-colspan="13" data-vcq-content-layout="flow"><qti-portable-custom-interaction response-identifier="RESPONSE_6" custom-interaction-type-identifier="math-input-blank" data-is-math="true" data-school-level="m"><qti-interaction-markup><div class="qti-ext-input-blank" data-latex="⇒\text{ (최대공약수)}=2 \times \inputblank{RESPONSE_6}{1}=\text{(여기 인풋박스 하나 더 있어야 함.)}"/></qti-interaction-markup></qti-portable-custom-interaction></div><div class="qti-ext-vcq-cell"/></div><span class="qti-ext-vcq-division-bar-track qti-ext-vcq-division-bar-track--reverse" data-vcq-grid-column="2 / 4" data-vcq-grid-row="1 / 2" aria-hidden="true"><span class="qti-ext-vcq-division-bar"/></span><span class="qti-ext-vcq-division-bar-track qti-ext-vcq-division-bar-track--reverse" data-vcq-grid-column="2 / 4" data-vcq-grid-row="2 / 3" aria-hidden="true"><span class="qti-ext-vcq-division-bar"/></span></div><p/></div></qti-item-body></qti-assessment-item>`;

/** 운영 문항 i_8xhmbugp1csipoiq — 시프트엔터와 엔터 줄간격 */
const LINE_BREAK_XML = String.raw`<?xml version="1.0" encoding="UTF-8"?>
<qti-assessment-item xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0" identifier="i_8xhmbugp1csipoiq" title="줄바꿈 테스트" time-dependent="false"><qti-response-declaration identifier="RESPONSE" cardinality="single" base-type="string"><qti-correct-response><qti-value>$\frac{1}{2}$</qti-value></qti-correct-response></qti-response-declaration><qti-item-body><div class="qti-ext-question"><p class="qti-align-justify"><strong>[자동 줄바꿈] </strong>(가) 운 좋게 나무 열매나 고기를 구했다고 해도 거기서 얻을 수 있는 열량은 매우 적었습니다. 사과를 예로 들어 볼까요? 사과는 <span class="qti-ext-mathfield" data-latex="86">86</span>퍼센트가 수분이고 <span class="qti-ext-mathfield" data-latex="12">12</span>퍼센트가 당분입니다. 즉, <span class="qti-ext-mathfield" data-latex="200">200</span>그램짜리 사과 한 알을 먹었을 때 섭취하는 당분은 <span class="qti-ext-mathfield" data-latex="24">24</span>그램, 여기서 얻을 수 있는 열량은 <span class="qti-ext-mathfield" data-latex="96">96</span>킬로칼로리밖에 안 됩니다. 
<strong>[시프트엔터] </strong>하루에 필요한 열량을 사과로만 채우면 하루에 사과를 스무 개는 먹어야 합니다. 그런데 그만큼 많은 사과는 먹기도 힘들뿐더러 구하기도 어려웠습니다. 사과만 계속 먹다 보면 영양 불균형이 올 수도 있었고요.</p><p><strong>[엔터] </strong>이렇게 오랫동안 열량이 부족한 환경에서 살아온 인류는 열량이 많은 음식을 좋아하는 신체 구조로 진화했습니다.</p><p class="qti-text-indent-1 qti-list-style-type-disc">기존에는 저작 화면에서는 시프트엔터와 엔터 줄간격이 다르지만 뷰어에서는 동일했는데 
저작과 동일하게 간격 다른 것으로 나오고 있습니다. </p><p><qti-text-entry-interaction response-identifier="RESPONSE" expected-length="50" data-is-math="true" data-school-level="m"/></p></div></qti-item-body></qti-assessment-item>`;

/** 운영 문항 i_2buv7jpl7uyv6xtf — 수식과 단답 겹침 */
const MATH_TEXT_OVERLAP_XML = String.raw`<?xml version="1.0" encoding="UTF-8"?>
<qti-assessment-item xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0" identifier="i_2buv7jpl7uyv6xtf" title="수식+텍스트 에디터 겹침 테스트" time-dependent="false"><qti-response-declaration identifier="RESPONSE" cardinality="single" base-type="string"><qti-correct-response><qti-value>1</qti-value></qti-correct-response></qti-response-declaration><qti-item-body><div class="qti-ext-question"><p class="qti-text-indent-first-1">⑴ 동쪽으로 <span class="qti-ext-mathfield" data-latex="45\,\mathrm{m}">45\,\mathrm{m}</span> 떨어진 지점을 <span class="qti-ext-mathfield" data-latex="+45">+45</span>로 나타낼 때, 서쪽으로 <span class="qti-ext-mathfield" data-latex="20\,\mathrm{m}">20\,\mathrm{m}</span> 떨어진 지점</p><p class="qti-text-indent-first-1"/><div class="qti-ext-stimulus"><p class="qti-text-indent-first-2">Anne: What’s your favorite subject?</p><p class="qti-text-indent-first-2">Minho: My favorite subject is math. I like playing math games.
What’s your favorite subject, Anne?</p><p class="qti-text-indent-first-2">Anne: My favorite subject is Korean. I like writing stories.</p></div><p><qti-text-entry-interaction response-identifier="RESPONSE" expected-length="50" data-is-math="false" data-school-level="e"/></p></div></qti-item-body></qti-assessment-item>`;

/** 운영 문항 i_ykfpbk1as89t9w1k — 드롭다운 옵션 10개 */
const DROPDOWN_LONG_XML = String.raw`<?xml version="1.0" encoding="UTF-8"?>
<qti-assessment-item xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0" identifier="i_ykfpbk1as89t9w1k" title="[테스트] 드롭다운 옵션 개수 확장" time-dependent="false"><qti-response-declaration identifier="DROPDOWN_1" cardinality="single" base-type="identifier"><qti-correct-response><qti-value>DROPDOWN_1_1</qti-value></qti-correct-response></qti-response-declaration><qti-response-declaration identifier="DROPDOWN_2" cardinality="single" base-type="identifier"><qti-correct-response><qti-value>DROPDOWN_2_1</qti-value></qti-correct-response></qti-response-declaration><qti-response-declaration identifier="DROPDOWN_3" cardinality="single" base-type="identifier"><qti-correct-response><qti-value>DROPDOWN_3_2</qti-value></qti-correct-response></qti-response-declaration><qti-item-body><div class="qti-ext-question"><p>드롭다운 테스트 드롭다운 테스트 <span class="qti-underline"><span class="qti-italic"><strong>드롭다운 짧은 옵션</strong></span></span> <qti-inline-choice-interaction response-identifier="DROPDOWN_2" shuffle="false" min-choices="0"><qti-label>선택</qti-label><qti-inline-choice identifier="DROPDOWN_2_1">1</qti-inline-choice><qti-inline-choice identifier="DROPDOWN_2_2">2</qti-inline-choice><qti-inline-choice identifier="DROPDOWN_2_3">3</qti-inline-choice><qti-inline-choice identifier="DROPDOWN_2_4">4</qti-inline-choice><qti-inline-choice identifier="DROPDOWN_2_5">5</qti-inline-choice><qti-inline-choice identifier="DROPDOWN_2_6">6</qti-inline-choice><qti-inline-choice identifier="DROPDOWN_2_7">7</qti-inline-choice><qti-inline-choice identifier="DROPDOWN_2_8">8</qti-inline-choice><qti-inline-choice identifier="DROPDOWN_2_9">9</qti-inline-choice><qti-inline-choice identifier="DROPDOWN_2_10">10</qti-inline-choice></qti-inline-choice-interaction> 테스트 드롭다운 테스트 드롭다운 테스트 드롭다운 </p><figure class="qti-ext-figure"><img src="/api/v3/assessment-resource/object/15022" alt="OCR_200_02" width="906"/></figure><p><qti-inline-choice-interaction response-identifier="DROPDOWN_1" shuffle="false" min-choices="0"><qti-label>선택</qti-label><qti-inline-choice identifier="DROPDOWN_1_1">가나 다라마 바사 아 자차카</qti-inline-choice><qti-inline-choice identifier="DROPDOWN_1_2">가나 다라마 바사 아 자차카</qti-inline-choice><qti-inline-choice identifier="DROPDOWN_1_5">가나 다라마 바사 아 자차카 파하</qti-inline-choice><qti-inline-choice identifier="DROPDOWN_1_6">가나 다라마 바사 아 자차카</qti-inline-choice><qti-inline-choice identifier="DROPDOWN_1_7">가나 다라마 바사 아 자차카</qti-inline-choice><qti-inline-choice identifier="DROPDOWN_1_8">가나 다라마 바사 아 자차카</qti-inline-choice><qti-inline-choice identifier="DROPDOWN_1_9">가나 다라마 바사 아 자차카 파하</qti-inline-choice><qti-inline-choice identifier="DROPDOWN_1_10">가나 다라마 바사 아 자차카 파하</qti-inline-choice><qti-inline-choice identifier="DROPDOWN_1_3">가나 다라마 바사 아 자차카</qti-inline-choice><qti-inline-choice identifier="DROPDOWN_1_4">가나 다라마 바사 아 자차카</qti-inline-choice></qti-inline-choice-interaction> <span class="qti-underline"><span class="qti-italic"><strong>드롭다운 긴 옵션 테스트</strong></span></span> 드롭다운 테스트 드롭다운 테스트 드롭다운 테스트 드롭다운 테스트 드롭다운 테스트 드롭다운 테스트 드롭다운 테스트 드롭다운 테스트 드롭다운 테스트 드롭다운 테스트 드롭다운 테스트 드롭다운 테스트 <span class="qti-underline"><span class="qti-italic"><strong>여러 테스트</strong></span></span> <qti-inline-choice-interaction response-identifier="DROPDOWN_3" shuffle="false" min-choices="0"><qti-label>선택</qti-label><qti-inline-choice identifier="DROPDOWN_3_1">가나 다라마 바사 아 자차카</qti-inline-choice><qti-inline-choice identifier="DROPDOWN_3_2">1</qti-inline-choice><qti-inline-choice identifier="DROPDOWN_3_3">가나 다라마 바사 아 자차카</qti-inline-choice><qti-inline-choice identifier="DROPDOWN_3_4">2</qti-inline-choice><qti-inline-choice identifier="DROPDOWN_3_5">3</qti-inline-choice><qti-inline-choice identifier="DROPDOWN_3_6">가나 다라마 바사 아 자차카</qti-inline-choice><qti-inline-choice identifier="DROPDOWN_3_7">4</qti-inline-choice><qti-inline-choice identifier="DROPDOWN_3_8">5</qti-inline-choice><qti-inline-choice identifier="DROPDOWN_3_9">6</qti-inline-choice><qti-inline-choice identifier="DROPDOWN_3_10">7</qti-inline-choice></qti-inline-choice-interaction> 테스트 드롭다운 테스트 드롭다운 테스트 드롭다운 테스트 드롭다운 테스트 드롭다운 테스트 드롭다운 테스트 드롭다운 테스트 드롭다운 테스트 드롭다운 테스트 드롭다운 테스트 드롭다운 테스트 드롭다운 테스트 드롭다운 테스트 </p><p/></div></qti-item-body></qti-assessment-item>`;

/** 운영 문항 i_a9z2w7up1ybu5gi4 — 순환소수 세로셈 */
const REPEATING_DECIMAL_XML = String.raw`<?xml version="1.0" encoding="UTF-8"?>
<qti-assessment-item xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0" identifier="i_a9z2w7up1ybu5gi4" title="세로셈 테스트_2" time-dependent="false"><qti-response-declaration identifier="RESPONSE_4" cardinality="single" base-type="string"><qti-correct-response><qti-value>$10$</qti-value></qti-correct-response></qti-response-declaration><qti-response-declaration identifier="RESPONSE_5" cardinality="single" base-type="string"><qti-correct-response><qti-value>$9$</qti-value></qti-correct-response></qti-response-declaration><qti-response-declaration identifier="RESPONSE_6" cardinality="single" base-type="string"><qti-correct-response><qti-value>$16$</qti-value></qti-correct-response></qti-response-declaration><qti-response-declaration identifier="RESPONSE_7" cardinality="single" base-type="string"><qti-correct-response><qti-value>$\frac{16}{9}$</qti-value></qti-correct-response></qti-response-declaration><qti-item-body><div class="qti-ext-question"><p>~~ <span class="qti-ext-blank"><span class="qti-ext-blank-content"/></span> 안에 알맞은 수를 써넣으시오.</p><div class="qti-ext-stimulus"><p><span class="qti-ext-mathfield" data-latex="x=1.777\cdots">x=1.777\cdots</span>이라 하면</p><div class="qti-ext-vcq-grid qti-ext-vcq-grid--response qti-ext-vcq-grid--template-blank qti-ext-vcq-grid--size-normal qti-align-center"><div class="qti-ext-vcq-row qti-ext-vcq-row--narrow"><div class="qti-ext-vcq-cell"/><div class="qti-ext-vcq-cell qti-ext-vcq-cell--blank qti-align-right"><qti-portable-custom-interaction response-identifier="RESPONSE_4" custom-interaction-type-identifier="math-input-blank" data-is-math="true" data-school-level="e"><qti-interaction-markup><div class="qti-ext-input-blank" data-latex="\inputblank{RESPONSE_4}{2} x"/></qti-interaction-markup></qti-portable-custom-interaction></div><div class="qti-ext-vcq-cell"><span class="qti-ext-mathfield" data-latex="=">=</span></div><div class="qti-ext-vcq-cell qti-align-right"><span class="qti-ext-mathfield" data-latex="17.777\cdots">17.777\cdots</span></div></div><div class="qti-ext-vcq-row qti-ext-vcq-row--narrow"><div class="qti-ext-vcq-cell"><span class="qti-ext-mathfield" data-latex="-">-</span></div><div class="qti-ext-vcq-cell qti-align-right"><span class="qti-ext-mathfield" data-latex="x">x</span></div><div class="qti-ext-vcq-cell"><span class="qti-ext-mathfield" data-latex="=">=</span></div><div class="qti-ext-vcq-cell qti-align-right"><span class="qti-ext-mathfield" data-latex="1.777\cdots">1.777\cdots</span></div></div><div class="qti-ext-vcq-row qti-ext-vcq-row--narrow"><div class="qti-ext-vcq-cell"/><div class="qti-ext-vcq-cell qti-ext-vcq-cell--blank qti-align-right"><qti-portable-custom-interaction response-identifier="RESPONSE_5" custom-interaction-type-identifier="math-input-blank" data-is-math="true" data-school-level="e"><qti-interaction-markup><div class="qti-ext-input-blank" data-latex="\inputblank{RESPONSE_5}{1} x"/></qti-interaction-markup></qti-portable-custom-interaction></div><div class="qti-ext-vcq-cell"><span class="qti-ext-mathfield" data-latex="=">=</span></div><div class="qti-ext-vcq-cell qti-ext-vcq-cell--blank qti-align-left"><qti-portable-custom-interaction response-identifier="RESPONSE_6" custom-interaction-type-identifier="math-input-blank" data-is-math="true" data-school-level="e"><qti-interaction-markup><div class="qti-ext-input-blank" data-latex="\inputblank{RESPONSE_6}{2}"/></qti-interaction-markup></qti-portable-custom-interaction></div></div><div class="qti-ext-vcq-row qti-ext-vcq-row--normal"><div class="qti-ext-vcq-cell"/><div class="qti-ext-vcq-cell qti-ext-vcq-cell--blank qti-ext-vcq-cell--merged" data-vcq-colspan="3"><qti-portable-custom-interaction response-identifier="RESPONSE_7" custom-interaction-type-identifier="math-input-blank" data-is-math="true" data-school-level="e"><qti-interaction-markup><div class="qti-ext-input-blank" data-latex="\therefore\;x=\inputblank{RESPONSE_7}{12}"/></qti-interaction-markup></qti-portable-custom-interaction></div></div><span class="qti-ext-vcq-division-bar-track qti-ext-vcq-division-bar-track--reverse" data-vcq-grid-column="2 / 5" data-vcq-grid-row="2 / 3" aria-hidden="true"><span class="qti-ext-vcq-division-bar"/></span></div></div></div></qti-item-body></qti-assessment-item>`;

/** 운영 문항 i_gtlwi220pq0c0ya6 — 소인수분해 최대공약수 */
const GCD_FACTOR_XML = String.raw`<?xml version="1.0" encoding="UTF-8"?>
<qti-assessment-item xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0" identifier="i_gtlwi220pq0c0ya6" title="맞춤온_연결지문 테스트1" time-dependent="false"><qti-response-declaration identifier="RESPONSE_1" cardinality="single" base-type="string"><qti-correct-response><qti-value>$7$</qti-value></qti-correct-response></qti-response-declaration><qti-response-declaration identifier="RESPONSE_2" cardinality="single" base-type="string"><qti-correct-response><qti-value>$7$</qti-value></qti-correct-response></qti-response-declaration><qti-response-declaration identifier="RESPONSE_3" cardinality="single" base-type="string"><qti-correct-response><qti-value>$2$</qti-value></qti-correct-response></qti-response-declaration><qti-response-declaration identifier="RESPONSE_4" cardinality="single" base-type="string"><qti-correct-response><qti-value>$7$</qti-value></qti-correct-response></qti-response-declaration><qti-response-declaration identifier="RESPONSE_5" cardinality="single" base-type="string"><qti-correct-response><qti-value>$14$</qti-value></qti-correct-response></qti-response-declaration><qti-item-body><div class="qti-ext-question"><p>(1) 소인수분해를 이용하는 방법</p><div class="qti-ext-vcq-grid qti-ext-vcq-grid--response qti-ext-vcq-grid--template-narrow qti-ext-vcq-grid--size-small qti-align-center"><div class="qti-ext-vcq-row qti-ext-vcq-row--normal"><div class="qti-ext-vcq-cell qti-align-right"><span class="qti-ext-mathfield" data-latex="28">28</span></div><div class="qti-ext-vcq-cell"><span class="qti-ext-mathfield" data-latex="=">=</span></div><div class="qti-ext-vcq-cell"><span class="qti-ext-mathfield" data-latex="2^2">2^2</span></div><div class="qti-ext-vcq-cell qti-ext-vcq-col--narrow"/><div class="qti-ext-vcq-cell"/><div class="qti-ext-vcq-cell qti-ext-vcq-col--narrow"><span class="qti-ext-mathfield" data-latex="\times">\times</span></div><div class="qti-ext-vcq-cell qti-ext-vcq-cell--blank"><qti-portable-custom-interaction response-identifier="RESPONSE_1" custom-interaction-type-identifier="math-input-blank" data-is-math="true" data-school-level="m"><qti-interaction-markup><div class="qti-ext-input-blank" data-latex="\inputblank{RESPONSE_1}{1}"/></qti-interaction-markup></qti-portable-custom-interaction></div><div class="qti-ext-vcq-cell"/></div><div class="qti-ext-vcq-row qti-ext-vcq-row--normal"><div class="qti-ext-vcq-cell qti-align-right"><span class="qti-ext-mathfield" data-latex="42">42</span></div><div class="qti-ext-vcq-cell"><span class="qti-ext-mathfield" data-latex="=">=</span></div><div class="qti-ext-vcq-cell"><span class="qti-ext-mathfield" data-latex="2">2</span></div><div class="qti-ext-vcq-cell qti-ext-vcq-col--narrow"><span class="qti-ext-mathfield" data-latex="\times">\times</span></div><div class="qti-ext-vcq-cell"><span class="qti-ext-mathfield" data-latex="3">3</span></div><div class="qti-ext-vcq-cell qti-ext-vcq-col--narrow"><span class="qti-ext-mathfield" data-latex="\times">\times</span></div><div class="qti-ext-vcq-cell qti-ext-vcq-cell--blank"><qti-portable-custom-interaction response-identifier="RESPONSE_2" custom-interaction-type-identifier="math-input-blank" data-is-math="true" data-school-level="m"><qti-interaction-markup><div class="qti-ext-input-blank" data-latex="\inputblank{RESPONSE_2}{1}"/></qti-interaction-markup></qti-portable-custom-interaction></div><div class="qti-ext-vcq-cell"/></div><div class="qti-ext-vcq-row qti-ext-vcq-row--normal"><div class="qti-ext-vcq-cell qti-align-right" data-vcq-border-top="1"><span class="qti-ext-mathfield" data-latex="\text{(최대공약수)">\text{(최대공약수)</span></div><div class="qti-ext-vcq-cell" data-vcq-border-top="1"><span class="qti-ext-mathfield" data-latex="=">=</span></div><div class="qti-ext-vcq-cell qti-ext-vcq-cell--blank" data-vcq-border-top="1"><qti-portable-custom-interaction response-identifier="RESPONSE_3" custom-interaction-type-identifier="math-input-blank" data-is-math="true" data-school-level="m"><qti-interaction-markup><div class="qti-ext-input-blank" data-latex="\inputblank{RESPONSE_3}{1}"/></qti-interaction-markup></qti-portable-custom-interaction></div><div class="qti-ext-vcq-cell qti-ext-vcq-col--narrow" data-vcq-border-top="1"/><div class="qti-ext-vcq-cell" data-vcq-border-top="1"/><div class="qti-ext-vcq-cell qti-ext-vcq-col--narrow" data-vcq-border-top="1"><span class="qti-ext-mathfield" data-latex="\times">\times</span></div><div class="qti-ext-vcq-cell qti-ext-vcq-cell--blank" data-vcq-border-top="1"><qti-portable-custom-interaction response-identifier="RESPONSE_4" custom-interaction-type-identifier="math-input-blank" data-is-math="true" data-school-level="m"><qti-interaction-markup><div class="qti-ext-input-blank" data-latex="\inputblank{RESPONSE_4}{1}"/></qti-interaction-markup></qti-portable-custom-interaction></div><div class="qti-ext-vcq-cell qti-ext-vcq-cell--blank" data-vcq-border-top="1"><qti-portable-custom-interaction response-identifier="RESPONSE_5" custom-interaction-type-identifier="math-input-blank" data-is-math="true" data-school-level="m"><qti-interaction-markup><div class="qti-ext-input-blank" data-latex="=\inputblank{RESPONSE_5}{2}"/></qti-interaction-markup></qti-portable-custom-interaction></div></div></div><p/></div></qti-item-body></qti-assessment-item>`;

/** 운영 문항 i_k0bu82rkikjja4lv — 별 위치 서술형 */
const STAR_ESSAY_XML = String.raw`<?xml version="1.0" encoding="UTF-8"?>
<qti-assessment-item xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0" identifier="i_k0bu82rkikjja4lv" title="ocr_서술형" time-dependent="false"><qti-response-declaration identifier="RESPONSE" cardinality="single" base-type="string"/><qti-item-body><div class="qti-ext-question"><div class="qti-ext-prompt"><p>다음은 별의 위치를 두 시간 간격으로 관찰하여 기록한 결과입니다.</p></div><figure class="qti-ext-figure"><img src="https://stgqms.mirae-n.com/api/v3/assessment-resource/object/15022?t=1793116163~vJFB19Y_" alt="/api/v3/assessment-resource/object/15022" width="698"/></figure><p>(<span class="qti-ext-mathfield" data-latex="1">1</span>) 새벽 <span class="qti-ext-mathfield" data-latex="3">3</span> 시경에 별은 어디에서 관찰할 수 있는지 골라 기호를 쓰시오.</p><p>(<span class="qti-ext-mathfield" data-latex="2">2</span>) 위 (<span class="qti-ext-mathfield" data-latex="1">1</span>)번 답과 같이 생각한 까닭을 쓰시오.</p><qti-extended-text-interaction response-identifier="RESPONSE" max-strings="500" placeholder-text="" data-is-math="false" data-school-level="e"/></div></qti-item-body></qti-assessment-item>`;

/** 운영 문항 i_fiy1vi42sygtx0eq — 원문자 2열 짝짓기 */
const GRID_PAIR_XML = String.raw`<?xml version="1.0" encoding="UTF-8"?>
<qti-assessment-item xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0" identifier="i_fiy1vi42sygtx0eq" title="ocr_문항_92_14" time-dependent="false"><qti-response-declaration identifier="RESPONSE" cardinality="single" base-type="identifier"><qti-correct-response><qti-value>choice_1</qti-value></qti-correct-response></qti-response-declaration><qti-item-body><div class="qti-ext-prompt"><p>같은 열량을 가할 때 온도 변화가 가장 큰 물질과 가장 작
은 물질을 옳게 짝 지은 것은?</p></div><div class="qti-ext-grid qti-ext-grid-2 qti-list-style-type-circled"><div class="qti-ext-grid-header"><span class="qti-ext-grid-header-cell"/><span class="qti-ext-grid-header-cell qti-align-center"><span class="qti-underline">가장 큰 물질</span></span><span class="qti-ext-grid-header-cell qti-align-center"><span class="qti-underline">가장 작은 물질</span></span></div><qti-choice-interaction class="qti-ext-grid-body" response-identifier="RESPONSE" shuffle="false" max-choices="1" min-choices="1"><qti-simple-choice class="qti-ext-grid-row" identifier="choice_1"><span class="qti-ext-choice-label"/><div class="qti-ext-grid-cell"><p class="qti-align-center"><span class="qti-ext-mathfield" data-latex="\mathrm{A}">\mathrm{A}</span></p></div><div class="qti-ext-grid-cell"><p class="qti-align-center"><span class="qti-ext-mathfield" data-latex="\mathrm{B}">\mathrm{B}</span></p></div></qti-simple-choice><qti-simple-choice class="qti-ext-grid-row" identifier="choice_2"><span class="qti-ext-choice-label"/><div class="qti-ext-grid-cell"><p class="qti-align-center"><span class="qti-ext-mathfield" data-latex="\mathrm{B}">\mathrm{B}</span></p></div><div class="qti-ext-grid-cell"><p class="qti-align-center"><span class="qti-ext-mathfield" data-latex="\mathrm{C}">\mathrm{C}</span></p></div></qti-simple-choice><qti-simple-choice class="qti-ext-grid-row" identifier="choice_3"><span class="qti-ext-choice-label"/><div class="qti-ext-grid-cell"><p class="qti-align-center"><span class="qti-ext-mathfield" data-latex="\mathrm{C}">\mathrm{C}</span></p></div><div class="qti-ext-grid-cell"><p class="qti-align-center"><span class="qti-ext-mathfield" data-latex="\mathrm{B}">\mathrm{B}</span></p></div></qti-simple-choice><qti-simple-choice class="qti-ext-grid-row" identifier="choice_4"><span class="qti-ext-choice-label"/><div class="qti-ext-grid-cell"><p class="qti-align-center"><span class="qti-ext-mathfield" data-latex="\mathrm{D}">\mathrm{D}</span></p></div><div class="qti-ext-grid-cell"><p class="qti-align-center"><span class="qti-ext-mathfield" data-latex="\mathrm{B}">\mathrm{B}</span></p></div></qti-simple-choice><qti-simple-choice class="qti-ext-grid-row" identifier="choice_5"><span class="qti-ext-choice-label"/><div class="qti-ext-grid-cell"><p class="qti-align-center"><span class="qti-ext-mathfield" data-latex="\mathrm{E}">\mathrm{E}</span></p></div><div class="qti-ext-grid-cell"><p class="qti-align-center"><span class="qti-ext-mathfield" data-latex="\mathrm{D}">\mathrm{D}</span></p></div></qti-simple-choice></qti-choice-interaction></div></qti-item-body></qti-assessment-item>`;

/** 운영 문항 i_2dgfqrgvd6kgy489 — 이미지 빈칸(수식+텍스트)과 닮음 조건 */
const IMAGE_MIXED_BLANK_XML = String.raw`<?xml version="1.0" encoding="UTF-8"?>
<qti-assessment-item xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0" identifier="i_2dgfqrgvd6kgy489" title="이미지 내 빈칸_빈칸혼합" time-dependent="false"><qti-response-declaration identifier="BLANK_1" cardinality="single" base-type="string"><qti-correct-response><qti-value>SAS</qti-value></qti-correct-response></qti-response-declaration><qti-response-declaration identifier="MATH_RESPONSE_1" cardinality="record"><qti-correct-response><qti-value field-identifier="RESPONSE_3" base-type="string">$1$</qti-value></qti-correct-response></qti-response-declaration><qti-response-declaration identifier="IMAGE_RESPONSE_1" cardinality="record"><qti-correct-response><qti-value field-identifier="RESPONSE_1" base-type="string">$7$</qti-value><qti-value field-identifier="RESPONSE_2" base-type="string">5</qti-value></qti-correct-response></qti-response-declaration><qti-item-body><div class="qti-ext-question"><div class="qti-ext-prompt"><p>다음 그림에서 <span class="qti-ext-mathfield" data-latex="\square">\square</span> 안에 알맞은 것을 써넣으시오.</p></div><div class="qti-ext-figure"><qti-portable-custom-interaction response-identifier="IMAGE_RESPONSE_1" custom-interaction-type-identifier="image-input-blank" data-school-level="m"><qti-interaction-markup><div class="qti-ext-image-input-blank" data-src="/api/v3/assessment-resource/object/15021" data-alt="/api/v3/assessment-resource/object/15021" data-width="986" data-height="280" data-display-width="504" data-font-size="24"><span class="qti-ext-image-input-blank__region qti-ext-input-blank" data-width="49.47670250896067" data-height="51.245439305788395" data-region-id="e4851a13-6b9c-439e-a572-2f1734bcf4dd" data-input-type="text" data-response-identifier="RESPONSE_1" data-x="841.1039426523297" data-y="118.11852874469973" data-is-math="true"/><span class="qti-ext-image-input-blank__region qti-ext-input-blank" data-width="45.94265232974908" data-height="47.02100384577457" data-region-id="6f04a22f-2a84-4e30-a134-ea1c9d16ec64" data-input-type="text" data-response-identifier="RESPONSE_2" data-x="860.5412186379929" data-y="232.97899615422543" data-is-math="false"/></div></qti-interaction-markup></qti-portable-custom-interaction></div><div class="qti-ext-stimulus"><div><span class="qti-ext-mathfield" data-latex="\triangle \mathrm{ABC}">\triangle \mathrm{ABC}</span>와 <span class="qti-ext-mathfield" data-latex="\triangle \mathrm{EBD}">\triangle \mathrm{EBD}</span>에서 <qti-portable-custom-interaction response-identifier="MATH_RESPONSE_1" custom-interaction-type-identifier="math-input-blank" data-is-math="true" data-school-level="m"><qti-interaction-markup><div class="qti-ext-math-input-blank" data-latex="\overline{\mathrm{AB}} : \overline{\mathrm{EB}} = \overline{\mathrm{BC}} : \overline{\mathrm{BD}} = 2 : \inputblank{RESPONSE_3}{2}"/></qti-interaction-markup></qti-portable-custom-interaction>, <span class="qti-ext-mathfield" data-latex="\angle \mathrm{B}">\angle \mathrm{B}</span>는 공통
<span class="qti-ext-mathfield" data-latex="\therefore \triangle \mathrm{ABC} \sim \triangle \mathrm{EBD}">\therefore \triangle \mathrm{ABC} \sim \triangle \mathrm{EBD}</span> (<qti-text-entry-interaction response-identifier="BLANK_1" expected-length="50" data-is-math="false" data-school-level="m"/> 닮음)</div></div></div></qti-item-body></qti-assessment-item>`;

/** 운영 문항 i_ddbaiey4fog64cy4 — 이미지 빈칸 + 분수 뒤 문장 */
const IMAGE_TABLE_BLANK_XML = String.raw`<?xml version="1.0" encoding="UTF-8"?>
<qti-assessment-item xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0" identifier="i_ddbaiey4fog64cy4" title="이미지 내 빈칸_표" time-dependent="false"><qti-response-declaration identifier="MATH_RESPONSE_1" cardinality="record"><qti-correct-response><qti-value field-identifier="RESPONSE_4" base-type="string">$3$</qti-value></qti-correct-response></qti-response-declaration><qti-response-declaration identifier="IMAGE_RESPONSE_1" cardinality="record"><qti-correct-response><qti-value field-identifier="RESPONSE_1" base-type="string">3</qti-value><qti-value field-identifier="RESPONSE_2" base-type="string">3</qti-value><qti-value field-identifier="RESPONSE_3" base-type="string">$\frac{4}{5}$</qti-value></qti-correct-response></qti-response-declaration><qti-item-body><div class="qti-ext-question"><div class="qti-ext-prompt"><p><img class="qti-ext-inline-image" src="https://stgqms.mirae-n.com/api/v3/assessment-resource/object/15019?t=1793115848~gnbfYlJu" alt="제목 없음" data-inline-image-height="1.5"/>의 수에 대한 규칙을 찾아 식으로 나타내시오. </p></div><div class="qti-ext-figure qti-align-center"><qti-portable-custom-interaction response-identifier="IMAGE_RESPONSE_1" custom-interaction-type-identifier="image-input-blank" data-school-level="m"><qti-interaction-markup><div class="qti-ext-image-input-blank" data-src="https://stgqms.mirae-n.com/api/v3/assessment-resource/object/15020?t=1793115848~gnbfYlJu" data-alt="sample1" data-width="686" data-height="441" data-display-width="493" data-font-size="24"><span class="qti-ext-image-input-blank__region qti-ext-input-blank" data-width="71.57086614173227" data-height="71.57282296650715" data-region-id="0c9138ff-85e3-4589-8458-9e04de4bb0e5" data-input-type="text" data-response-identifier="RESPONSE_1" data-x="440.2283464566929" data-y="266.0559330143541" data-is-math="false"/><span class="qti-ext-image-input-blank__region qti-ext-input-blank" data-width="71.57086614173227" data-height="71.5728229665072" data-region-id="95109f92-24e2-4220-ae0a-e8f46c00c390" data-input-type="text" data-response-identifier="RESPONSE_2" data-x="386.21259842519686" data-y="355.18435406698563" data-is-math="false"/><span class="qti-ext-image-input-blank__region qti-ext-input-blank" data-width="72.92125984251965" data-height="71.5728229665072" data-region-id="b50aba2c-8df0-4497-99ca-725afc114b26" data-input-type="text" data-response-identifier="RESPONSE_3" data-x="494.244094488189" data-y="355.18435406698563" data-is-math="true"/></div></qti-interaction-markup></qti-portable-custom-interaction></div><div><qti-portable-custom-interaction response-identifier="MATH_RESPONSE_1" custom-interaction-type-identifier="math-input-blank" data-is-math="true" data-school-level="m"><qti-interaction-markup><div class="qti-ext-math-input-blank" data-latex="\frac{3}{\inputblank{RESPONSE_4}{1}}=1"/></qti-interaction-markup></qti-portable-custom-interaction>이므로 어쩌구~</div></div></qti-item-body></qti-assessment-item>`;

/** 운영 문항 i_hi3zlxp01bpqpkpl — 단답 + data-is-math / data-school-level=m */
const HEX_PYRAMID_SRQ_XML = String.raw`<?xml version="1.0" encoding="UTF-8"?>
<qti-assessment-item xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0" identifier="i_hi3zlxp01bpqpkpl" title="리피트개념중등수학1-2(개념책)_1_028p_01" time-dependent="false" xsi:schemaLocation="http://www.imsglobal.org/xsd/imsqtiasi_v3p0 /assessment/xml-catalog/purl.imsglobal.org/spec/qti/v3p0/schema/xsd/imsqti_asiv3p0_v1p0.xsd"><qti-response-declaration identifier="RESPONSE" cardinality="single" base-type="string"><qti-correct-response><qti-value>$84$</qti-value></qti-correct-response><qti-mapping lower-bound="0.0" upper-bound="1.0" default-value="0.0"><qti-map-entry map-key="84" mapped-value="1.0" case-sensitive="true"/></qti-mapping></qti-response-declaration><qti-outcome-declaration identifier="SCORE" cardinality="single" base-type="float"><qti-default-value><qti-value>0.0</qti-value></qti-default-value></qti-outcome-declaration><qti-outcome-declaration identifier="MAXSCORE" cardinality="single" base-type="float"><qti-default-value><qti-value>1.0</qti-value></qti-default-value></qti-outcome-declaration><qti-item-body><div class="qti-ext-question"><div class="qti-ext-prompt"><p>그림과 같은 육각뿔에서 교점의 개수를 <span class="qti-ext-mathfield" data-latex="a">a</span>, 교선의 개수를 <span class="qti-ext-mathfield" data-latex="b">b</span>라 할 때, <span class="qti-ext-mathfield" data-latex="ab">ab</span>의 값을 구하시오.</p></div><p>맞춤온 뷰어 확인</p><p>sum_{n=1}^{infty} a_n <span class="qti-ext-mathfield" data-latex="sum_{n=1}^{infty} a_n">sum_{n=1}^{infty} a_n</span></p><p>sumlimits_{n=1}^{infty} a_n <span class="qti-ext-mathfield" data-latex="sumlimits_{n=1}^{infty} a_n">sumlimits_{n=1}^{infty} a_n</span></p><figure class="qti-ext-figure qti-align-center"><img src="/api/v3/assessment-resource/object/8516" alt="/api/v3/assessment-resource/object/8516" width="150"/></figure><p><qti-text-entry-interaction response-identifier="RESPONSE" expected-length="50" data-is-math="true" data-school-level="m"/></p></div></qti-item-body><qti-response-processing><qti-set-outcome-value identifier="SCORE"><qti-sum><qti-variable identifier="SCORE"/><qti-map-response identifier="RESPONSE"/></qti-sum></qti-set-outcome-value></qti-response-processing></qti-assessment-item>`;

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
  MATH_BLANK_EXPONENT: {
    id: -11,
    qtiIdentifier: "MATH_BLANK_EXPONENT",
    title: "수식 내 빈칸 · QMS 배열",
    type: ITEM_TYPE.CLOZE,
    qtiXml: MATH_BLANK_EXPONENT_XML,
    correctAnswer: MATH_BLANK_EXPONENT_ANSWER,
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
  VCQ_CANCEL_BLANK: {
    id: -10,
    qtiIdentifier: "VCQ_CANCEL_BLANK",
    title: "세로셈 취소선 빈칸",
    type: ITEM_TYPE.VCQ,
    qtiXml: VCQ_CANCEL_BLANK_XML,
    correctAnswer: VCQ_CANCEL_BLANK_ANSWER,
    settings: null,
    feedbacks: [VCQ_CANCEL_BLANK_FEEDBACK, HINT_FEEDBACK],
  },
  i_hi3zlxp01bpqpkpl: {
    id: -12,
    qtiIdentifier: "i_hi3zlxp01bpqpkpl",
    title: "리피트개념중등수학1-2(개념책)_1_028p_01",
    type: ITEM_TYPE.SRQ,
    qtiXml: HEX_PYRAMID_SRQ_XML,
    correctAnswer: { RESPONSE: ["$84$"] },
    settings: null,
    feedbacks: [],
  },
  i_8xhmbugp1csipoiq: {
    id: -27,
    qtiIdentifier: "i_8xhmbugp1csipoiq",
    title: "줄바꿈 테스트",
    type: ITEM_TYPE.SRQ,
    qtiXml: LINE_BREAK_XML,
    correctAnswer: { RESPONSE: ["$\\frac{1}{2}$"] },
    settings: null,
    feedbacks: [],
  },
  i_2buv7jpl7uyv6xtf: {
    id: -26,
    qtiIdentifier: "i_2buv7jpl7uyv6xtf",
    title: "수식+텍스트 에디터 겹침 테스트",
    type: ITEM_TYPE.SRQ,
    qtiXml: MATH_TEXT_OVERLAP_XML,
    correctAnswer: { RESPONSE: ["1"] },
    settings: null,
    feedbacks: [],
  },
  i_ykfpbk1as89t9w1k: {
    id: -25,
    qtiIdentifier: "i_ykfpbk1as89t9w1k",
    title: "[테스트] 드롭다운 옵션 개수 확장",
    type: ITEM_TYPE.DDQ,
    qtiXml: DROPDOWN_LONG_XML,
    correctAnswer: {
      DROPDOWN_1: ["DROPDOWN_1_1"],
      DROPDOWN_2: ["DROPDOWN_2_1"],
      DROPDOWN_3: ["DROPDOWN_3_2"],
    },
    settings: null,
    feedbacks: [],
  },
  i_a9z2w7up1ybu5gi4: {
    id: -24,
    qtiIdentifier: "i_a9z2w7up1ybu5gi4",
    title: "세로셈 테스트_2",
    type: ITEM_TYPE.VCQ,
    qtiXml: REPEATING_DECIMAL_XML,
    correctAnswer: {
      RESPONSE_4: ["$10$"],
      RESPONSE_5: ["$9$"],
      RESPONSE_6: ["$16$"],
      RESPONSE_7: ["$\\frac{16}{9}$"],
    },
    settings: null,
    feedbacks: [],
  },
  i_gtlwi220pq0c0ya6: {
    id: -23,
    qtiIdentifier: "i_gtlwi220pq0c0ya6",
    title: "맞춤온_연결지문 테스트1",
    type: ITEM_TYPE.VCQ,
    qtiXml: GCD_FACTOR_XML,
    correctAnswer: {
      RESPONSE_1: ["$7$"],
      RESPONSE_2: ["$7$"],
      RESPONSE_3: ["$2$"],
      RESPONSE_4: ["$7$"],
      RESPONSE_5: ["$14$"],
    },
    settings: null,
    feedbacks: [],
  },
  i_6rceiajpw7kfhy3c: {
    id: -13,
    qtiIdentifier: "i_6rceiajpw7kfhy3c",
    title: "맞춤온_연결지문 테스트2",
    type: ITEM_TYPE.VCQ,
    qtiXml: GCD_NARROW_XML,
    correctAnswer: {
      RESPONSE_1: ["$7$"],
      RESPONSE_3: ["$14$"],
      RESPONSE_4: ["$2$"],
      RESPONSE_5: ["$3$"],
      RESPONSE_6: ["$7$"],
    },
    settings: null,
    feedbacks: [],
  },
  i_iwyrao0n55gwivd7: {
    id: -22,
    qtiIdentifier: "i_iwyrao0n55gwivd7",
    title: "테스트: ORDER 순서 배열형",
    type: ITEM_TYPE.ORDER,
    qtiXml: `<?xml version="1.0" encoding="UTF-8"?>
<qti-assessment-item xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0" identifier="i_iwyrao0n55gwivd7" title="테스트: ORDER 순서 배열형" time-dependent="false"><qti-response-declaration identifier="RESPONSE" cardinality="ordered" base-type="identifier"><qti-correct-response><qti-value>CHOICE_3</qti-value><qti-value>CHOICE_1</qti-value><qti-value>CHOICE_2</qti-value><qti-value>CHOICE_4</qti-value></qti-correct-response></qti-response-declaration><qti-item-body><div class="qti-ext-question"><p>순서 배열형  
- 드래그 삭제 
- 순서 정답 클릭 순서</p><qti-order-interaction class="qti-ext-ordering-click qti-choices-stacking-1 qti-list-style-type-circled" response-identifier="RESPONSE" shuffle="false"><qti-simple-choice identifier="CHOICE_1"><p>여름 </p></qti-simple-choice><qti-simple-choice identifier="CHOICE_2"><p>가을</p></qti-simple-choice><qti-simple-choice identifier="CHOICE_3"><p>봄</p></qti-simple-choice><qti-simple-choice identifier="CHOICE_4"><p>겨울</p></qti-simple-choice></qti-order-interaction></div></qti-item-body></qti-assessment-item>`,
    correctAnswer: {
      RESPONSE: ["CHOICE_3", "CHOICE_1", "CHOICE_2", "CHOICE_4"],
    },
    settings: null,
    feedbacks: [],
  },
  i_t1g9lmjd5peyjpl1: {
    id: -21,
    qtiIdentifier: "i_t1g9lmjd5peyjpl1",
    title: "순서배열형 예시_영어",
    type: ITEM_TYPE.ORDER,
    qtiXml: `<?xml version="1.0" encoding="UTF-8"?>
<qti-assessment-item xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0" identifier="i_t1g9lmjd5peyjpl1" title="순서배열형 예시_영어" time-dependent="false"><qti-response-declaration identifier="RESPONSE" cardinality="ordered" base-type="identifier"><qti-correct-response><qti-value>CHOICE_3</qti-value><qti-value>CHOICE_4</qti-value><qti-value>CHOICE_1</qti-value><qti-value>CHOICE_2</qti-value></qti-correct-response></qti-response-declaration><qti-item-body><div class="qti-ext-question"><div class="qti-ext-prompt"><p>다음 (A)~(D)를 자연스러운 대화가 되도록 바르게 배열하시오.</p></div><div class="qti-ext-stimulus"><p class="qti-text-indent-first-1">A: What are you going to do tomorrow?</p><p class="qti-text-indent-first-1">(A) Why don’t you join us?</p><p class="qti-text-indent-first-1">(B) Of course! It will be fun.</p><p class="qti-text-indent-first-1">(C) I’m going to meet Semi at the shopping mall. How about you?</p><p class="qti-text-indent-first-1">(D) I don’t have any plan yet.</p></div><qti-order-interaction class="qti-ext-ordering-click qti-choices-stacking-2 qti-list-style-type-none" response-identifier="RESPONSE" shuffle="false"><qti-simple-choice identifier="CHOICE_1"><p>(A)</p></qti-simple-choice><qti-simple-choice identifier="CHOICE_2"><p>(B)</p></qti-simple-choice><qti-simple-choice identifier="CHOICE_3"><p>(C)</p></qti-simple-choice><qti-simple-choice identifier="CHOICE_4"><p>(D)</p></qti-simple-choice></qti-order-interaction></div></qti-item-body></qti-assessment-item>`,
    correctAnswer: {
      RESPONSE: ["CHOICE_3", "CHOICE_4", "CHOICE_1", "CHOICE_2"],
    },
    settings: null,
    feedbacks: [],
  },
  i_zn1mtgpfmo4pd6m8: {
    id: -20,
    qtiIdentifier: "i_zn1mtgpfmo4pd6m8",
    title: "빈칸 매칭형_중복 NO",
    type: ITEM_TYPE.GMQ,
    qtiXml: `<?xml version="1.0" encoding="UTF-8"?>
<qti-assessment-item xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0" identifier="i_zn1mtgpfmo4pd6m8" title="빈칸 매칭형_중복 NO" time-dependent="false"><qti-response-declaration identifier="RESPONSE" cardinality="multiple" base-type="directedPair"><qti-correct-response><qti-value>GAP_1 CHOICE_6</qti-value><qti-value>GAP_2 CHOICE_1</qti-value><qti-value>GAP_3 CHOICE_2</qti-value><qti-value>GAP_4 CHOICE_3</qti-value><qti-value>GAP_5 CHOICE_4</qti-value></qti-correct-response></qti-response-declaration><qti-item-body><div class="qti-ext-question"><qti-gap-match-interaction class="qti-ext-gap-match-click qti-ext-gap-label-none" response-identifier="RESPONSE" shuffle="false" max-associations="5" min-associations="0"><qti-gap-text identifier="CHOICE_2" match-max="1">bottle</qti-gap-text><qti-gap-text identifier="CHOICE_1" match-max="1">discount</qti-gap-text><qti-gap-text identifier="CHOICE_3" match-max="1">information</qti-gap-text><qti-gap-text identifier="CHOICE_4" match-max="1">volunteer</qti-gap-text><qti-gap-text identifier="CHOICE_6" match-max="1">stairs</qti-gap-text><div class="qti-ext-prompt"><p>다음 빈칸에 알맞은 말을 보기에서 고르시오. </p></div><div class="qti-ext-example"><span class="qti-ext-example-label">보기</span><div class="qti-ext-gap-text-panel"/></div><p class="qti-text-indent-first-1">(1) He ran up the <qti-gap identifier="GAP_1"/> quickly.</p><p class="qti-text-indent-first-1">(2) I got a 10% <qti-gap identifier="GAP_2"/> on my new shoes.</p><p class="qti-text-indent-first-1">(3) I drank a(n) <qti-gap identifier="GAP_3"/> of water after running.</p><p class="qti-text-indent-first-1">(4) I need <qti-gap identifier="GAP_4"/> about the school event.</p><p class="qti-text-indent-first-1">(5) She is a(n) <qti-gap identifier="GAP_5"/> at the animal shelter. </p></qti-gap-match-interaction></div></qti-item-body></qti-assessment-item>`,
    correctAnswer: {
      RESPONSE: [
        "GAP_1 CHOICE_6",
        "GAP_2 CHOICE_1",
        "GAP_3 CHOICE_2",
        "GAP_4 CHOICE_3",
        "GAP_5 CHOICE_4",
      ],
    },
    settings: null,
    feedbacks: [],
  },
  i_k0bu82rkikjja4lv: {
    id: -30,
    qtiIdentifier: "i_k0bu82rkikjja4lv",
    title: "ocr_서술형",
    type: ITEM_TYPE.ESSAY,
    qtiXml: STAR_ESSAY_XML,
    correctAnswer: null,
    settings: null,
    feedbacks: [],
  },
  i_fiy1vi42sygtx0eq: {
    id: -29,
    qtiIdentifier: "i_fiy1vi42sygtx0eq",
    title: "ocr_문항_92_14",
    type: ITEM_TYPE.SCQ,
    qtiXml: GRID_PAIR_XML,
    correctAnswer: { RESPONSE: ["choice_1"] },
    settings: null,
    feedbacks: [],
  },
  i_2dgfqrgvd6kgy489: {
    id: -28,
    qtiIdentifier: "i_2dgfqrgvd6kgy489",
    title: "이미지 내 빈칸_빈칸혼합",
    type: ITEM_TYPE.CLOZE,
    qtiXml: IMAGE_MIXED_BLANK_XML,
    correctAnswer: {
      RESPONSE_1: ["$7$"],
      RESPONSE_2: ["5"],
      RESPONSE_3: ["$1$"],
      BLANK_1: ["SAS"],
    },
    settings: null,
    feedbacks: [],
  },
  i_ddbaiey4fog64cy4: {
    id: -14,
    qtiIdentifier: "i_ddbaiey4fog64cy4",
    title: "이미지 내 빈칸_표",
    type: ITEM_TYPE.CLOZE,
    qtiXml: IMAGE_TABLE_BLANK_XML,
    correctAnswer: {
      RESPONSE_1: ["3"],
      RESPONSE_2: ["3"],
      RESPONSE_3: ["$\\frac{4}{5}$"],
      RESPONSE_4: ["$3$"],
    },
    settings: null,
    feedbacks: [],
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
    type: ITEM_TYPE.ORDER,
    label: "순서 배열형 · 영어 2열",
    qtiIdentifier: "i_t1g9lmjd5peyjpl1",
  },
  {
    type: ITEM_TYPE.ORDER,
    label: "순서 배열형 · 계절 원문자",
    qtiIdentifier: "i_iwyrao0n55gwivd7",
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
    type: ITEM_TYPE.GMQ,
    label: "빈칸 매칭 · 중복 NO",
    qtiIdentifier: "i_zn1mtgpfmo4pd6m8",
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
    type: ITEM_TYPE.CLOZE,
    label: "수식 내 빈칸 · QMS 배열 (CLOZE)",
    qtiIdentifier: "MATH_BLANK_EXPONENT",
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
  {
    type: ITEM_TYPE.VCQ,
    label: "세로셈형 · 취소선 빈칸 (VCQ)",
    qtiIdentifier: "VCQ_CANCEL_BLANK",
  },
  {
    type: ITEM_TYPE.SRQ,
    label: "육각뿔 단답 · 수식입력 (SRQ)",
    qtiIdentifier: "i_hi3zlxp01bpqpkpl",
  },
  {
    type: ITEM_TYPE.SRQ,
    label: "줄바꿈 테스트 (SRQ)",
    qtiIdentifier: "i_8xhmbugp1csipoiq",
  },
  {
    type: ITEM_TYPE.SRQ,
    label: "수식 · 단답 겹침 (SRQ)",
    qtiIdentifier: "i_2buv7jpl7uyv6xtf",
  },
  {
    type: ITEM_TYPE.DDQ,
    label: "드롭다운 · 옵션 10개 (DDQ)",
    qtiIdentifier: "i_ykfpbk1as89t9w1k",
  },
  {
    type: ITEM_TYPE.VCQ,
    label: "세로셈형 · 순환소수 (VCQ)",
    qtiIdentifier: "i_a9z2w7up1ybu5gi4",
  },
  {
    type: ITEM_TYPE.VCQ,
    label: "세로셈형 · 소인수분해 (VCQ)",
    qtiIdentifier: "i_gtlwi220pq0c0ya6",
  },
  {
    type: ITEM_TYPE.VCQ,
    label: "세로셈형 · 소인수 나눗셈 (VCQ)",
    qtiIdentifier: "i_6rceiajpw7kfhy3c",
  },
  {
    type: ITEM_TYPE.ESSAY,
    label: "별 위치 서술형 (ESSAY)",
    qtiIdentifier: "i_k0bu82rkikjja4lv",
  },
  {
    type: ITEM_TYPE.SCQ,
    label: "원문자 표 · 짝짓기 (SCQ)",
    qtiIdentifier: "i_fiy1vi42sygtx0eq",
  },
  {
    type: ITEM_TYPE.CLOZE,
    label: "이미지 내 빈칸 · 혼합 (CLOZE)",
    qtiIdentifier: "i_2dgfqrgvd6kgy489",
  },
  {
    type: ITEM_TYPE.CLOZE,
    label: "이미지 내 빈칸 · 표 (CLOZE)",
    qtiIdentifier: "i_ddbaiey4fog64cy4",
  },
];
