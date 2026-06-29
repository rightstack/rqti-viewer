import { ITEM_TYPE, type ItemsType } from "@rtqi/viewer";

export interface Sample {
  id: string;
  label: string;
  type: ItemsType;
  data: string;
  correctAnswers?: Record<string, string | string[]>;
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
  { id: "scq", label: "단일 선택형 (SCQ)", type: ITEM_TYPE.SCQ, data: scq, correctAnswers: { RESPONSE: "A" } },
  { id: "mcq", label: "다중 선택형 (MCQ)", type: ITEM_TYPE.MCQ, data: mcq, correctAnswers: { RESPONSE: ["A", "C"] } },
  { id: "cloze", label: "빈칸 입력형 (CLOZE)", type: ITEM_TYPE.CLOZE, data: cloze, correctAnswers: { RESPONSE: "300000" } },
  { id: "latex", label: "수식 포함 (LaTeX)", type: ITEM_TYPE.SCQ, data: latex, correctAnswers: { RESPONSE: "A" } },
];
