# @rightstack/rqti-viewer 사용자 가이드

QTI 문항을 **상세 API**로 조회해 읽기 전용으로 렌더링하는 가이드입니다.  
제출·채점 연동은 포함하지 않습니다. (`Question`의 기본 모드 `preview` 사용)

> `mode`는 `Question`이 기본값 `"preview"`(읽기 전용)로 처리합니다. `toQuestionProps`는 `mode`를 지정하지 않으므로, 인터랙션이 필요하면 호출측에서 `mode="practice"`를 직접 전달하세요.

현재 패키지 버전: **0.3.1**

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
| 단일 선택   | `scq`   | 단일 선택형 (SCQ)   | `i_k0jw4eqye8u7i2pz` |
| 다중 선택   | `mcq`   | 다중 선택형 (MCQ)   | `i_r5ke0kl1jbzq2dss` |
| 그룹 선택   | `gcq`   | 그룹 선택형 (GCQ)   | `i_noes42x1zwso2aki` |
| 참/거짓     | `tfq`   | 참/거짓형 (TFQ)     | `i_f57k5qvs3llg7mkc` |
| 드롭다운    | `ddq`   | 드롭다운형 (DDQ)    | `i_twi9q5n94j11o450` |
| 연결하기    | `match` | 연결형 (MATCH)      | `i_ad3qnvlwjv97ds6a` |
| 단답형      | `srq`   | 단답형 (SRQ)        | `i_yyit9dl938yuv45h` |
| 빈칸 채우기 | `cloze` | 빈칸 채우기 (CLOZE) | `i_3cmubgeftcod4u72` |
| 서술형      | `essay` | 서술형 (ESSAY)      | `i_kt5gesu56npkfjde` |

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

const id = SAMPLE_IDS[ITEM_TYPE.SCQ]; // "i_k0jw4eqye8u7i2pz"
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
| `correctAnswer` | `Record<string, ResponseValue> \| null` | 정답           |
| `feedbacks`     | `QuestionFeedback[]`                    | 피드백 목록    |

---

## 5. API → Question 매핑

`toQuestionProps(item)` 결과:

| API             | Question prop        | 비고                                                                        |
| --------------- | -------------------- | --------------------------------------------------------------------------- |
| `qtiXml`        | `data`               |                                                                             |
| `type`          | `type`               |                                                                             |
| `qtiIdentifier` | `itemKey`            |                                                                             |
| `correctAnswer` | `correctAnswers`     | `null`이면 생략                                                             |
| `feedbacks`     | `feedbacks`          | `displayOrder` 정렬, `feedbackType` → `type`                                |
| —               | `mode`               | 매퍼는 지정 안 함 → Question 기본값 `"preview"` (필요 시 `mode="practice"`) |
| —               | `showInlineFeedback` | 기본 `false` (필요 시 호출측에서 `true`)                                    |

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

## 7. Question props 요약

| prop                 | 설명                                                               |
| -------------------- | ------------------------------------------------------------------ |
| `data`               | QTI XML                                                            |
| `type`               | 문항 유형                                                          |
| `itemKey`            | 문항 식별 키                                                       |
| `mode`               | 기본 `"preview"`(읽기 전용). `"practice"`로 인터랙션 활성          |
| `showInlineFeedback` | 하단 정답·피드백 표시 (기본: `false`)                              |
| `correctAnswers`     | 정답                                                               |
| `feedbacks`          | 해설/해석/힌트 등                                                  |
| `theme`              | `"default"` 또는 커스텀 `Theme`(JSON/객체) — `THEME_GUIDE.md` 참고 |

문항 전환 시 `key={props.itemKey}`를 권장합니다.

---

## 8. 요구사항 / 제약

- React >= 18, React DOM >= 18
- **클라이언트 전용** (`DOMParser` 사용 — SSR에서 동작하지 않음)
- 스타일은 `.rtqi-viewer` 아래로 격리됨 (`rtqi:` Tailwind prefix)

---

## 9. 주요 export 목록

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
