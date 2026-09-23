# @rightstack/rqti-viewer 사용자 가이드

QTI 문항을 **상세 API**로 조회해 **문항 1개**를 렌더링하는 가이드입니다.

> `mode`는 `Question`이 기본값 `"preview"`(읽기 전용)입니다. `toQuestionProps`는 `mode`를 지정하지 않으므로, 풀이가 필요하면 호출측에서 `mode="practice"`를 전달하세요. 인쇄형 썸네일은 `mode="thumbnail"`입니다.

> 호스트가 힌트를 직접 그릴 때: **[HINT_GUIDE.md](./HINT_GUIDE.md)**  
> 힌트만 그리는 화면은 `HINT_GUIDE`를 보고 `styles.css`와 `MathJaxProviderWrapper`를 그 화면에 넣고, 힌트 영역을 `.rqti-viewer`로 감쌉니다.

현재 패키지 버전: **0.4.16**

---

## 1. 설치

### 1.1 Registry 인증

토큰은 `~/.npmrc`에만 둔다. 레포에는 커밋하지 않는다.

| 용도 | 토큰 | 가능 |
|---|---|---|
| 설치 | read | `pnpm add` |
| 배포 | write | `pnpm add`, `publish:viewer` |

write는 read를 포함한다. `_authToken`은 한 줄만 둔다.

```bash
echo '//npm.pkg.github.com/:_authToken=ghp_...' >> ~/.npmrc
grep 'npm.pkg.github.com' ~/.npmrc
```

프로젝트 `.npmrc`:

```ini
@rightstack:registry=https://npm.pkg.github.com
```

배포는 README **배포 (write)** 를 따른다.

### 1.2 패키지 설치

```bash
pnpm add @rightstack/rqti-viewer
```

### 1.3 스타일

```tsx
import "@rightstack/rqti-viewer/styles.css";
```

스타일은 반드시 별도 import 합니다. (MathJax 표시용 스타일 포함)

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

세로셈형(`vcq`)은 `ITEM_TYPE.VCQ`로 지원합니다. QMS 대표 identifier가 정해지기 전까지 playground 로컬 XML로 확인합니다.

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
Authorization: Bearer 1790780399~f2ly4i70
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
const API_TOKEN = "1790780399~f2ly4i70";

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

뷰어는 **고정형 스케일**입니다. 반응형(폭 구간별 재배치)은 지원하지 않습니다.
`designWidth`는 호스트가 넘깁니다. 라이브러리 기본값은 없습니다.
값이 있으면 그 폭으로 렌더한 뒤 부모 폭에 맞춰 `transform: scale()`로만
비례 축소됩니다(원본보다 크게 확대하지는 않습니다). 덕분에 폭이 달라져도 내부 좌표계가
유지되어 화이트보드 필기 같은 오버레이 정합이 깨지지 않습니다.
`designWidth`를 생략하면 스케일하지 않습니다.

| 설정 | 설명 |
| --- | --- |
| `designWidth={1000}` | 고정형 스케일의 기준 너비(px). 호스트가 지정. 기본값 없음 |
| `maxWidth: "100%"` | 문항 콘텐츠가 기준 너비 전체를 사용 |
| `padding: "0px"` | 문항 콘텐츠의 기본 내부 여백 제거 |

모바일·태블릿 UI가 필요하면 폭이 아니라 조상 요소의 `data-device="mobile"` /
`data-device="tablet"` 속성으로 전환합니다.

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
| `mode`               | `"preview"`(기본, 읽기 전용) · `"practice"`(풀이) · `"thumbnail"`(인쇄형) |
| `onSubmit`           | practice 전용. 제출 시 응답 수신                                   |
| `responses`          | preview·thumbnail. 저장해 둔 응답을 선택·입력으로 표시             |
| `theme`              | `"default"` 또는 커스텀 `Theme`(JSON/객체) — `THEME_GUIDE.md` 참고 |
| `designWidth`        | 고정형 스케일의 원본 기준 폭(px). 호스트가 지정. 없으면 스케일 없음 |

문항 전환 시 `key={props.itemKey}`를 권장합니다.

---

## 9. practice / preview / thumbnail

`mode`에 따라 넘기는 props만 다릅니다.

| | practice | preview | thumbnail |
| --- | --- | --- | --- |
| `mode` | `"practice"` | `"preview"` (기본값) | `"thumbnail"` |
| 동작 | 풀이 가능, 제출 버튼 표시 | 읽기 전용. 인라인 피드백·정오 배지 가능 | 읽기 전용. 인쇄형 크롬 제거. 제출/피드백/정오 배지 없음 |
| 추가 prop | `onSubmit` — 제출 시 응답 수신 | `responses` — 저장 응답을 선택·입력으로 표시 | `responses` — 있으면 답안만 표시 (정오 색 없음) |

thumbnail은 지정된 7유형만 크롬을 숨깁니다.

- **SCQ / MCQ / GCQ**: 라디오·체크박스 미렌더. 선택 카드 스타일은 유지. GCQ 그리드 header 여백 조정
- **SRQ / CLOZE**: placeholder 빈값 (XML `placeholder-text` 포함)
- **ESSAY**: textarea 미렌더. text-entry input 높이(2.25rem)만큼 여백만 남김
- **DDQ**: placeholder 빈값, 드롭다운 화살표 미렌더. 박스 형태는 유지

TFQ, GMQ, MATCH, ORDER, UPLOAD, VCQ 등은 크롬 변경 없이 읽기 전용만 적용됩니다.

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

<Question
  {...props}
  mode="thumbnail"
  responses={savedResponses}
/>
```

`onSubmit`으로 받은 값을 preview·thumbnail의 `responses`에 그대로 넣으면 됩니다.  
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

## 11. 요구사항 / 제약

- React >= 18, React DOM >= 18
- **클라이언트 전용** (`DOMParser` 사용 — SSR에서 동작하지 않음)
- QTI / QTI-ext 스타일은 `.rqti-viewer` 아래로 격리됨. Tailwind 유틸은 `rqti:` prefix. 테마는 `--qti-*` 변수(`.rqti-viewer`에 주입)

---

## 12. 주요 export 목록

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
} from "@rightstack/rqti-viewer";
```
