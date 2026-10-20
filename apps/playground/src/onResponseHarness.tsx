/**
 * 답 복원 때 onResponse가 반복 호출되지 않는지 보는 하네스.
 *
 * 호스트는 저장된 답을 첫 페인트 뒤에 responses로 넘기고, 콜백이 오면 그 값을 다시 넘긴다.
 * 콜백 함수도 렌더마다 새로 만든다. 복원·미리보기·부모 리렌더만으로 횟수가 늘면 회귀다.
 */
import { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { ITEM_TYPE, Question, type ResponseValueMap } from "@rightstack/rqti-viewer";
import "@rightstack/rqti-viewer/styles.css";

const ITEM_XML = `<?xml version="1.0" encoding="UTF-8"?>
<qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0" identifier="on_response" title="답 복원" time-dependent="false">
  <qti-item-body>
    <qti-text-entry-interaction response-identifier="ANSWER"/>
  </qti-item-body>
</qti-assessment-item>`;

const RESTORED: ResponseValueMap = { ANSWER: ["3"] };

declare global {
  interface Window {
    __onResponse?: { count: number; last: ResponseValueMap | null };
  }
}

function Harness() {
  const [mode, setMode] = useState<"practice" | "preview">("practice");
  const [responses, setResponses] = useState<ResponseValueMap | undefined>(undefined);
  const [epoch, setEpoch] = useState(0);

  useEffect(() => {
    window.__onResponse = { count: 0, last: null };
    setResponses(RESTORED);
  }, []);

  return (
    <div data-epoch={epoch}>
      <button type="button" id="to-preview" onClick={() => setMode("preview")}>
        미리보기
      </button>
      <button type="button" id="to-practice" onClick={() => setMode("practice")}>
        연습
      </button>
      <button type="button" id="rerender" onClick={() => setEpoch((value) => value + 1)}>
        다시 그리기
      </button>
      <output id="call-count">{window.__onResponse?.count ?? 0}</output>
      <Question
        data={ITEM_XML}
        type={ITEM_TYPE.SRQ}
        mode={mode}
        responses={responses}
        showSubmitButton={false}
        onResponse={(next) => {
          const state = window.__onResponse ?? { count: 0, last: null };
          state.count += 1;
          state.last = next;
          window.__onResponse = state;
          setResponses(next);
        }}
      />
    </div>
  );
}

createRoot(document.getElementById("root")!).render(<Harness />);
