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
          class="${interactionClass}"
          shuffle="true">
            <qti-prompt>헨젤과 그레텔에게 일어난 일을 순서대로 놓아 보세요.</qti-prompt>
            <qti-simple-choice identifier="CHOICE_1">헨젤과 그레텔이 과자 집을 발견했어요.</qti-simple-choice>
            <qti-simple-choice identifier="CHOICE_2">헨젤이 조약돌을 떨어뜨렸어요.</qti-simple-choice>
            <qti-simple-choice identifier="CHOICE_3">숲속의 새들이 빵을 먹어 버렸어요.</qti-simple-choice>
        </qti-order-interaction>
    </qti-item-body>
</qti-assessment-item>`;
}

const ORDER_CORRECT_ANSWER = { RESPONSE: ["CHOICE_2", "CHOICE_3", "CHOICE_1"] };

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
];
