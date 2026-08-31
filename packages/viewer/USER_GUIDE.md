# @rightstack/rqti-viewer 사용자 가이드

QTI 문항을 **상세 API**로 조회해 **문항 1개**를 렌더링하는 가이드입니다.

> `mode`는 `Question`이 기본값 `"preview"`(읽기 전용)입니다. `toQuestionProps`는 `mode`를 지정하지 않으므로, 풀이가 필요하면 호출측에서 `mode="practice"`를 전달하세요.

현재 패키지 버전: **0.4.1**

---

## 1. 설치

### 1.1 Registry 인증

프로젝트 루트 `.npmrc`:

```ini
@rightstack:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=READ_ONLY_TOKEN
```

- `read:packages` 권한이 있는 GitHub 토큰을 사용합니다.
- `.npmrc`는 커밋하지 마세요.

### 1.2 패키지 설치

```bash
pnpm add @rightstack/rqti-viewer
```

### 1.3 스타일

```tsx
import "@rightstack/rqti-viewer/styles.css";
```

스타일은 반드시 별도 import 합니다. (MathLive 스타일 포함)

---

## 2. 핵심 흐름

```
유형 선택 (SAMPLE_ITEMS)
    ↓
상세 API 조회  GET https://stgqms.mirae-n.com/api/v3/viewer/preview/{qtiIdentifier}
             (Authorization: Bearer {token})
    ↓
toQuestionProps(item)
    ↓
<Question {...props} />   // 기본 mode="preview" (practice는 호출측에서 지정)
```

라이브러리는 **데이터(`SAMPLE_ITEMS`) + 매퍼 + Question**만 제공합니다.  
select / tab 등 UI는 호스트 앱에서 구현합니다.

---

## 3. 유형별 대표 문항 (`SAMPLE_ITEMS`)

연동·데모용으로 제공하는 유형별 `qtiIdentifier` 목록입니다.

| 유형        | `type`  | label               | `qtiIdentifier`      |
| ----------- | ------- | ------------------- | -------------------- |
| 단일 선택   | `scq`   | 단일 선택형 (SCQ)   | `i_5x75v2r5ecaujlqo` |
| 다중 선택   | `mcq`   | 다중 선택형 (MCQ)   | `i_bo7qcg294mks15yh` |
| 그룹 선택   | `gcq`   | 그룹 선택형 (GCQ)   | `i_iqypqoaiu195zhpl` |
| 참/거짓     | `tfq`   | 참/거짓형 (TFQ)     | `i_d7ugrkh4v8ril59c` |
| 드롭다운    | `ddq`   | 드롭다운형 (DDQ)    | `i_hvji6dr3xffwtunf` |
| 연결하기    | `match` | 연결형 (MATCH)      | `i_fljjjasfugmmldzc` |
| 단답형      | `srq`   | 단답형 (SRQ)        | `i_gq5x41yc2t4biapu` |
| 빈칸 채우기 | `cloze` | 빈칸 채우기 (CLOZE) | `i_lqenbou7mkjktvwo` |
| 서술형      | `essay` | 서술형 (ESSAY)      | `i_1m7u6xcu9wdo59lt` |

### 타입

```ts
interface SampleItem {
  type: ItemsType;
  label: string;
  qtiIdentifier: string;
}
```

### export

| export         | 설명                               |
| -------------- | ---------------------------------- |
| `SAMPLE_ITEMS` | `{ type, label, qtiIdentifier }[]` |
| `SAMPLE_IDS`   | `ItemsType` → `qtiIdentifier` 맵   |

```tsx
import { SAMPLE_ITEMS, SAMPLE_IDS, ITEM_TYPE } from "@rightstack/rqti-viewer";

SAMPLE_ITEMS.map((item) => ({
  value: item.qtiIdentifier,
  label: item.label,
}));

const id = SAMPLE_IDS[ITEM_TYPE.SCQ]; // "i_5x75v2r5ecaujlqo"
```

---

## 4. 상세 API

### 4.1 엔드포인트

```
GET https://stgqms.mirae-n.com/api/v3/viewer/preview/{qtiIdentifier}
```

### 4.2 인증

`Authorization` header에 **Bearer 토큰**으로 전달합니다.

```
Authorization: Bearer 1786114799~Eg4k3QFE
```

### 4.3 응답

응답 타입: `QuestionItem`

| 필드            | 타입                                    | 설명           |
| --------------- | --------------------------------------- | -------------- |
| `id`            | `number`                                | 내부 식별자    |
| `qtiIdentifier` | `string`                                | QTI identifier |
| `title`         | `string`                                | 문항 제목      |
| `type`          | `ItemsType`                             | 문항 유형      |
| `qtiXml`        | `string`                                | QTI XML        |

---

## 5. API → Question 매핑

`toQuestionProps(item)` 결과:

| API             | Question prop        | 비고                                                                        |
| --------------- | -------------------- | --------------------------------------------------------------------------- |
| `qtiXml`        | `data`               |                                                                             |
| `type`          | `type`               |                                                                             |
| `qtiIdentifier` | `itemKey`            |                                                                             |

---

## 6. 구현 예시

```tsx
import { useEffect, useState } from "react";
import {
  Question,
  SAMPLE_ITEMS,
  toQuestionProps,
  type QuestionItem,
  type QuestionItemProps,
} from "@rightstack/rqti-viewer";
import "@rightstack/rqti-viewer/styles.css";

const API_BASE_URL = "https://stgqms.mirae-n.com";
const API_TOKEN = "1786114799~Eg4k3QFE";

async function fetchItem(qtiIdentifier: string) {
  const res = await fetch(
    `${API_BASE_URL}/api/v3/viewer/preview/${qtiIdentifier}`,
    {
      headers: {
        Authorization: `Bearer ${API_TOKEN}`,
      },
    },
  );
  return res.json() as Promise<QuestionItem>;
}

export function ItemViewer() {
  const [selectedId, setSelectedId] = useState(SAMPLE_ITEMS[0].qtiIdentifier);
  const [props, setProps] = useState<QuestionItemProps | null>(null);

  useEffect(() => {
    let cancelled = false;
    setProps(null);

    fetchItem(selectedId).then((item) => {
      if (!cancelled) setProps(toQuestionProps(item));
    });

    return () => {
      cancelled = true;
    };
  }, [selectedId]);

  return (
    <div>
      {/*
        아래 select는 문항 "유형 가이드"(SAMPLE_ITEMS)를 확인하기 위한 데모 UI입니다.
        실제 서비스 연동과는 무관하며, 호스트 앱에서는 자체 문항 목록/네비게이션으로 대체하세요.
      */}
      <select
        value={selectedId}
        onChange={(e) => setSelectedId(e.target.value)}
      >
        {SAMPLE_ITEMS.map((item) => (
          <option key={item.qtiIdentifier} value={item.qtiIdentifier}>
            {item.label}
          </option>
        ))}
      </select>

      {/* theme prop은 THEME_GUIDE.md를 참고해 커스텀 테마 객체/JSON으로 넘길 수 있습니다. */}
      {props && <Question key={props.itemKey} theme="default" {...props} />}
    </div>
  );
}
```

---

## 7. 너비 및 스케일 설정

| 설정 | 설명 |
| --- | --- |
| `sizing="responsive"` | **반응형**: 부모 너비에 따라 줄바꿈과 배치가 변경됨 |
| `sizing="fixed"` | **고정형 스케일**: 기준 레이아웃을 유지하며 가로·세로가 같은 비율로 축소됨 |
| `designWidth={1000}` | 고정형 스케일의 기준 너비를 1000px로 설정 |
| `maxWidth: "100%"` | 문항 콘텐츠가 기준 너비 전체를 사용 |
| `padding: "0px"` | 문항 콘텐츠의 기본 내부 여백 제거 |

```tsx
import { DEFAULT_THEME, Question, type Theme } from "@rightstack/rqti-viewer";

const exampleTheme: Theme = {
  ...DEFAULT_THEME,
  id: "example",
  name: "가이드 예시",
  containerConfig: {
    ...DEFAULT_THEME.containerConfig,
    maxWidth: "100%",
    padding: "0px",
  },
  questionNumberConfig: {
    ...DEFAULT_THEME.questionNumberConfig,
    enabled: false,
  },
};

<Question
  {...props}
  theme={exampleTheme}
  sizing="fixed"
  designWidth={1000}
/>
```

문항 번호는 뷰어에서 표시하지 않습니다. `theme.questionNumberConfig.enabled: false`로 끕니다.

외부 컨테이너 너비와 세로 스크롤은 호스트 애플리케이션에서 제어합니다.
뷰어 높이는 자동 계산되므로 고정 높이와 내부 세로 스크롤은 지정하지 않습니다.

---

## 8. Question props 요약

| prop                 | 설명                                                               |
| -------------------- | ------------------------------------------------------------------ |
| `data`               | QTI XML                                                            |
| `type`               | 문항 유형                                                          |
| `itemKey`            | 문항 식별 키                                                       |
| `passage`            | 연결지문 HTML. 있으면 문항 왼쪽에 가로로 같이 렌더                 |
| `mode`               | `"preview"`(기본, 읽기 전용) 또는 `"practice"`(풀이)               |
| `onSubmit`           | practice 전용. 제출 시 응답 수신                                   |
| `responses`          | preview 전용. 저장해 둔 응답을 선택·입력으로 표시                  |
| `theme`              | `"default"` 또는 커스텀 `Theme`(JSON/객체) — `THEME_GUIDE.md` 참고 |
| `sizing`             | `"responsive"`(기본) 또는 `"fixed"`                                |
| `designWidth`        | `fixed` 모드의 원본 기준 폭(px). 기본 `720`                        |

문항 전환 시 `key={props.itemKey}`를 권장합니다.

---

## 9. practice / preview

`mode`에 따라 넘기는 props만 다릅니다.

| | practice | preview |
| --- | --- | --- |
| `mode` | `"practice"` | `"preview"` (기본값) |
| 동작 | 풀이 가능, 제출 버튼 표시 | 읽기 전용 |
| 추가 prop | `onSubmit` — 제출 시 응답 수신 | `responses` — 저장 응답을 선택·입력으로 표시 |

```tsx
<Question
  {...props}
  mode="practice"
  onSubmit={(responses) => {
    saveResponses(responses);
  }}
/>

<Question
  {...props}
  mode="preview"
  responses={savedResponses}
/>
```

`onSubmit`으로 받은 값을 preview의 `responses`에 그대로 넣으면 됩니다.  
실제 형태는 `onSubmit`에서 확인하면 됩니다. SCQ 예시:

```ts
{ RESPONSE: "C" }
```

---

## 10. 연결지문

연결지문이 있으면 `passage`에 HTML만 넘기면 됩니다. 파싱과 가로 배치는 `Question`이 처리합니다.

```tsx
<Question {...props} passage={passageHtml} />
```

지문은 문항 왼쪽에 고정됩니다.

---

## 11. 수식입력기 (MathKeyboard)

학생용 수식 키패드다. MathLive 가상키보드를 커스텀한다. 입력창은 문항 흐름에 두고, 키패드는 포커스 시 열리는 **플로팅 팝업**이다. 핸들로 드래그할 수 있고, 뷰포트 밖으로 나가지 않게 위치가 보정된다.

- **우측 고정 패드**: 5×5. 왼쪽 열은 커서(`<` `>`)·백스페이스·엔터, 가운데는 숫자, 오른쪽은 사칙. 맨 아래는 분수·루트·`x`/`y`. 서랍을 열지 않아도 웬만한 대수/연산을 입력한다.
- **좌측 서랍**: `>` / `<` 로 열고 닫는다. 폭·높이는 우측 패드와 맞춰 고정한다. 탭은 한 줄 가로 나열(넘치면 가로 스크롤), 심화 기호는 4열 격자에서 세로 스크롤만 한다. 행렬처럼 넓은 키는 한 행에 2개만 둔다. 열린 동안 좌·우를 함께 쓴다.
- **이력**: 마지막 탭, 최근 기호(최대 12개, id만), 서랍 열림, 팝업 위치를 `sessionStorage`에 저장한다. 키는 `rqti:math-keyboard:{level}` 또는 `rqti:math-keyboard:{level}:{historyScope}`. 브라우저 탭을 닫으면 이력이 지워진다. 이력이 없거나 탭이 레벨에 없으면 `basic`, 서랍은 닫힘.
- 우측 숫자·사칙·분수·루트·변수는 최근 목록에 넣지 않는다. 좌측 심화 키만 기록한다.

`level` prop으로 중등/고등 키캡 세트와 배치를 전환한다(`"middle"` 기본, `"high"`). 기본 MathLive 레이아웃은 없다. `alwaysOpen`이면 같은 플로팅 셸을 상시 노출한다.

```tsx
import { MathKeyboard } from "@rightstack/rqti-viewer";

<MathKeyboard
  value={latex}
  onChange={setLatex}
  level="middle" // "middle" | "high"
  historyScope={attemptId} // 선택. 퀴즈/응시 회차별로 이력을 나눈다
/>
```

`correctAnswer`는 호환을 위해 받을 수 있으나 탭을 열지 않는다.

값은 LaTeX 문자열이다.

---

## 12. 요구사항 / 제약

- React >= 18, React DOM >= 18
- **클라이언트 전용** (`DOMParser` 사용 — SSR에서 동작하지 않음)
- 스타일은 `.rqti-viewer` 아래로 격리됨 (`rqti:` Tailwind prefix)

---

## 13. 주요 export 목록

```tsx
import {
  Question,
  SAMPLE_ITEMS,
  SAMPLE_IDS,
  type SampleItem,
  toQuestionProps,
  type QuestionItem,
  type QuestionFeedback,
  type QuestionItemProps,
  ITEM_TYPE,
  type ItemsType,
  type Theme,
  MathKeyboard,
} from "@rightstack/rqti-viewer";
```
