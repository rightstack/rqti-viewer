import {
  type FeedbackItem,
  ITEM_TYPE,
  type ItemsType,
  type ResponseValue,
} from "@rightstack/rqti-viewer";

export interface Sample {
  id: string;
  label: string;
  type: ItemsType;
  data: string;
  correctAnswers?: Record<string, ResponseValue>;
  solution?: string;
  /** preview(리뷰) 모드 하단 피드백 섹션 */
  feedbacks?: FeedbackItem[];
  /** preview(리뷰) 모드 지문 해설 */
  passageFeedbacks?: string;
}

const scq = `
<qti-assessment-item>
  <qti-item-body>
    <p>다음 중 대한민국의 수도는 어디일까요?</p>
    <qti-choice-interaction response-identifier="RESPONSE" max-choices="1">
      <qti-simple-choice identifier="A">서울</qti-simple-choice>
      <qti-simple-choice identifier="B">부산</qti-simple-choice>
      <qti-simple-choice identifier="C">대구</qti-simple-choice>
      <qti-simple-choice identifier="D">인천</qti-simple-choice>
    </qti-choice-interaction>
  </qti-item-body>
</qti-assessment-item>`;

const mcq = `
<qti-assessment-item>
  <qti-item-body>
    <p>다음 중 <strong>과일</strong>을 모두 고르세요.</p>
    <qti-choice-interaction response-identifier="RESPONSE" max-choices="0">
      <qti-simple-choice identifier="A">사과</qti-simple-choice>
      <qti-simple-choice identifier="B">당근</qti-simple-choice>
      <qti-simple-choice identifier="C">바나나</qti-simple-choice>
      <qti-simple-choice identifier="D">감자</qti-simple-choice>
    </qti-choice-interaction>
  </qti-item-body>
</qti-assessment-item>`;

const tfq = `
<qti-assessment-item>
  <qti-item-body>
    <p>지구는 태양 주위를 공전한다.</p>
    <qti-choice-interaction response-identifier="RESPONSE" max-choices="1">
      <qti-simple-choice identifier="CHOICE_O">O (참)</qti-simple-choice>
      <qti-simple-choice identifier="CHOICE_X">X (거짓)</qti-simple-choice>
    </qti-choice-interaction>
  </qti-item-body>
</qti-assessment-item>`;

const cloze = `
<qti-assessment-item>
  <qti-item-body>
    <p>
      빛의 속도는 약
      <qti-text-entry-interaction response-identifier="RESPONSE" expected-length="6"></qti-text-entry-interaction>
      km/s 입니다.
    </p>
  </qti-item-body>
</qti-assessment-item>`;

const ddq = `
<qti-assessment-item>
  <qti-item-body>
    <p>
      대한민국의 수도는
      <qti-inline-choice-interaction response-identifier="RESPONSE">
        <qti-inline-choice identifier="A">서울</qti-inline-choice>
        <qti-inline-choice identifier="B">부산</qti-inline-choice>
        <qti-inline-choice identifier="C">대전</qti-inline-choice>
      </qti-inline-choice-interaction>
      입니다.
    </p>
  </qti-item-body>
</qti-assessment-item>`;

const order = `
<qti-assessment-item>
  <qti-item-body>
    <p>다음 행성을 태양에서 가까운 순서대로 배열하세요.</p>
    <qti-order-interaction response-identifier="RESPONSE">
      <qti-simple-choice identifier="EARTH">지구</qti-simple-choice>
      <qti-simple-choice identifier="MARS">화성</qti-simple-choice>
      <qti-simple-choice identifier="MERCURY">수성</qti-simple-choice>
      <qti-simple-choice identifier="VENUS">금성</qti-simple-choice>
    </qti-order-interaction>
  </qti-item-body>
</qti-assessment-item>`;

const match = `
<qti-assessment-item>
  <qti-item-body>
    <p>나라와 수도를 연결하세요.</p>
    <qti-match-interaction response-identifier="RESPONSE">
      <qti-simple-match-set>
        <qti-simple-associable-choice identifier="KR" match-max="1">대한민국</qti-simple-associable-choice>
        <qti-simple-associable-choice identifier="JP" match-max="1">일본</qti-simple-associable-choice>
        <qti-simple-associable-choice identifier="FR" match-max="1">프랑스</qti-simple-associable-choice>
      </qti-simple-match-set>
      <qti-simple-match-set>
        <qti-simple-associable-choice identifier="SEOUL" match-max="1">서울</qti-simple-associable-choice>
        <qti-simple-associable-choice identifier="TOKYO" match-max="1">도쿄</qti-simple-associable-choice>
        <qti-simple-associable-choice identifier="PARIS" match-max="1">파리</qti-simple-associable-choice>
      </qti-simple-match-set>
    </qti-match-interaction>
  </qti-item-body>
</qti-assessment-item>`;

const gmq = `
<qti-assessment-item>
  <qti-item-body>
    <qti-gap-match-interaction response-identifier="RESPONSE">
      <qti-gap-text identifier="C_SUN" match-max="1">태양</qti-gap-text>
      <qti-gap-text identifier="C_MOON" match-max="1">달</qti-gap-text>
      <p>지구는 <qti-gap identifier="G1"></qti-gap> 주위를 공전한다.</p>
    </qti-gap-match-interaction>
  </qti-item-body>
</qti-assessment-item>`;

const essay = `
<qti-assessment-item>
  <qti-item-body>
    <p>환경 보호를 위해 일상에서 실천할 수 있는 방안을 서술하세요.</p>
    <qti-extended-text-interaction response-identifier="RESPONSE" placeholder-text="여기에 답안을 작성하세요."></qti-extended-text-interaction>
  </qti-item-body>
</qti-assessment-item>`;

const upload = `
<qti-assessment-item>
  <qti-item-body>
    <p>과제 보고서 파일을 업로드하세요.</p>
    <qti-upload-interaction response-identifier="RESPONSE"></qti-upload-interaction>
  </qti-item-body>
</qti-assessment-item>`;

const latex = `
<qti-assessment-item>
  <qti-item-body>
    <p>다음 이차방정식의 해를 구하는 근의 공식은 무엇일까요?</p>
    <p>$ax^2 + bx + c = 0$ 일 때,</p>
    <qti-choice-interaction response-identifier="RESPONSE" max-choices="1">
      <qti-simple-choice identifier="A">$x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}$</qti-simple-choice>
      <qti-simple-choice identifier="B">$x = \\frac{-b \\pm \\sqrt{b^2 + 4ac}}{2a}$</qti-simple-choice>
      <qti-simple-choice identifier="C">$x = \\frac{b \\pm \\sqrt{b^2 - 4ac}}{2a}$</qti-simple-choice>
    </qti-choice-interaction>
  </qti-item-body>
</qti-assessment-item>`;

export const SAMPLES: Sample[] = [
  {
    id: "scq",
    label: "단일 선택형 (SCQ)",
    type: ITEM_TYPE.SCQ,
    data: scq,
    correctAnswers: { RESPONSE: "A" },
    solution: "<p>대한민국의 수도는 <strong>서울</strong>입니다.</p>",
    feedbacks: [
      {
        type: "SOLUTION",
        typeLabel: "해설",
        title: "",
        content: "<p>대한민국의 수도는 <strong>서울</strong>특별시입니다.</p>",
      },
      {
        type: "HINT",
        typeLabel: "힌트",
        title: "",
        content: "<p>한강이 흐르는 도시를 떠올려 보세요.</p>",
      },
    ],
  },
  {
    id: "mcq",
    label: "다중 선택형 (MCQ)",
    type: ITEM_TYPE.MCQ,
    data: mcq,
    correctAnswers: { RESPONSE: ["A", "C"] },
    solution:
      "<p><strong>사과</strong>와 <strong>바나나</strong>가 과일입니다. 당근과 감자는 채소입니다.</p>",
    feedbacks: [
      {
        type: "SOLUTION",
        typeLabel: "해설",
        title: "",
        content:
          "<p><strong>사과</strong>와 <strong>바나나</strong>는 과일, 당근과 감자는 채소입니다.</p>",
      },
    ],
  },
  {
    id: "tfq",
    label: "참/거짓형 (TFQ)",
    type: ITEM_TYPE.TFQ,
    data: tfq,
    correctAnswers: { RESPONSE: "CHOICE_O" },
    solution:
      "<p>지구는 태양 주위를 공전(공전 주기 약 365일)하므로 <strong>참</strong>입니다.</p>",
    feedbacks: [
      {
        type: "SOLUTION",
        typeLabel: "해설",
        content:
          "<p>지구는 태양 주위를 약 365일 주기로 공전하므로 <strong>참</strong>입니다.</p>",
      },
    ],
  },
  {
    id: "cloze",
    label: "빈칸 입력형 (CLOZE)",
    type: ITEM_TYPE.CLOZE,
    data: cloze,
    correctAnswers: { RESPONSE: "300000" },
    solution:
      "<p>빛의 속도는 진공에서 약 <strong>300,000 km/s</strong>입니다.</p>",
    feedbacks: [
      {
        type: "SOLUTION",
        typeLabel: "해설",
        content:
          "<p>진공에서 빛의 속도는 약 <strong>300,000 km/s</strong>입니다.</p>",
      },
    ],
  },
  {
    id: "ddq",
    label: "드롭다운형 (DDQ)",
    type: ITEM_TYPE.DDQ,
    data: ddq,
    correctAnswers: { RESPONSE: "A" },
    solution: "<p>대한민국의 수도는 <strong>서울</strong>입니다.</p>",
    feedbacks: [
      {
        type: "SOLUTION",
        typeLabel: "해설",
        content: "<p>대한민국의 수도는 <strong>서울</strong>특별시입니다.</p>",
      },
    ],
  },
  {
    id: "order",
    label: "순서 배열형 (ORDER)",
    type: ITEM_TYPE.ORDER,
    data: order,
    correctAnswers: { RESPONSE: ["MERCURY", "VENUS", "EARTH", "MARS"] },
    solution:
      "<p>태양에서 가까운 순서: <strong>수성 → 금성 → 지구 → 화성</strong></p>",
    feedbacks: [
      {
        type: "SOLUTION",
        typeLabel: "해설",
        content:
          "<p>태양에서 가까운 순서는 <strong>수성 → 금성 → 지구 → 화성</strong>입니다.</p>",
      },
    ],
  },
  {
    id: "match",
    label: "연결형 (MATCH)",
    type: ITEM_TYPE.MATCH,
    data: match,
    correctAnswers: { RESPONSE: ["KR SEOUL", "JP TOKYO", "FR PARIS"] },
    solution: "<p>대한민국-서울, 일본-도쿄, 프랑스-파리</p>",
    feedbacks: [
      {
        type: "SOLUTION",
        typeLabel: "해설",
        content: "<p>대한민국-서울, 일본-도쿄, 프랑스-파리로 연결됩니다.</p>",
      },
    ],
  },
  {
    id: "gmq",
    label: "빈칸 연결형 (GMQ)",
    type: ITEM_TYPE.GMQ,
    data: gmq,
    correctAnswers: { RESPONSE: [["G1", "C_SUN"]] },
    solution: "<p>지구는 <strong>태양</strong> 주위를 공전합니다.</p>",
    feedbacks: [
      {
        type: "SOLUTION",
        typeLabel: "해설",
        content: "<p>지구는 <strong>태양</strong> 주위를 공전합니다.</p>",
      },
    ],
  },
  {
    id: "essay",
    label: "서술형 (ESSAY)",
    type: ITEM_TYPE.ESSAY,
    data: essay,
    solution:
      "<p>예시 답안: 대중교통 이용, 일회용품 줄이기, 분리수거 실천 등.</p>",
    feedbacks: [
      {
        type: "SAMPLE_ANSWER",
        typeLabel: "모범 답안",
        content:
          "<p>대중교통 이용, 일회용품 줄이기, 분리수거 실천 등 일상 속 실천 방안을 제시할 수 있습니다.</p>",
      },
    ],
  },
  {
    id: "upload",
    label: "파일 업로드형 (UPLOAD)",
    type: ITEM_TYPE.UPLOAD,
    data: upload,
  },
  {
    id: "latex",
    label: "수식 포함 (LaTeX)",
    type: ITEM_TYPE.SCQ,
    data: latex,
    correctAnswers: { RESPONSE: "A" },
    solution:
      "<p>근의 공식은 $x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}$ 입니다.</p>",
    feedbacks: [
      {
        type: "SOLUTION",
        typeLabel: "해설",
        content:
          "<p>이차방정식의 근의 공식은 $x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}$ 입니다.</p>",
      },
    ],
  },
];
