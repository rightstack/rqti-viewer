# @rightstack/rqti-viewer 사용자 가이드

QTI 문항을 **상세 API**로 조회해 읽기 전용으로 렌더링하는 가이드입니다.  
제출·채점 연동은 포함하지 않습니다. (`Question`의 `mode="preview"` 사용)

현재 패키지 버전: **0.1.2** (리네임 반영 시 버전 bump 예정)

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
상세 API 조회  GET /api/v3/viewer/preview/{qtiIdentifier}
    ↓
toQuestionProps(item)
    ↓
<Question {...props} />   // mode="preview"
```

라이브러리는 **데이터(`SAMPLE_ITEMS`) + 매퍼 + Question**만 제공합니다.  
select / tab 등 UI는 호스트 앱에서 구현합니다.

> `preview`는 Question의 **모드 값**일 뿐입니다. 공개 타입/상수 이름에는 쓰지 않습니다.  
> (서버 경로 `/viewer/preview/...`는 QMS API 스펙입니다.)

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

```
GET /api/v3/viewer/preview/{qtiIdentifier}
```

응답 타입: `QuestionItem`

| 필드            | 타입                                    | 설명           |
| --------------- | --------------------------------------- | -------------- |
| `id`            | `number`                                | assessment id  |
| `qtiIdentifier` | `string`                                | QTI identifier |
| `title`         | `string`                                | 문항 제목      |
| `type`          | `ItemsType`                             | 문항 유형      |
| `qtiXml`        | `string`                                | QTI XML        |
| `correctAnswer` | `Record<string, ResponseValue> \| null` | 정답           |
| `settings`      | `unknown \| null`                       | (현재 미사용)  |
| `feedbacks`     | `QuestionFeedback[]`                    | 피드백 목록    |

> `feedbacks[].effectiveCondition`은 뷰어가 평가하지 않습니다. 필요하면 호스트에서 필터링하세요.

---

## 5. API → Question 매핑

`toQuestionProps(item)` 결과:

| API             | Question prop        | 비고                                         |
| --------------- | -------------------- | -------------------------------------------- |
| `qtiXml`        | `data`               |                                              |
| `type`          | `type`               |                                              |
| `qtiIdentifier` | `itemKey`            |                                              |
| `correctAnswer` | `correctAnswers`     | `null`이면 생략                              |
| `feedbacks`     | `feedbacks`          | `displayOrder` 정렬, `feedbackType` → `type` |
| —               | `mode`               | 항상 `"preview"`                             |
| —               | `showInlineFeedback` | 기본 `false` (필요 시 호출측에서 `true`) |

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

async function fetchItem(qtiIdentifier: string) {
  const res = await fetch(`/api/v3/viewer/preview/${qtiIdentifier}`);
  if (!res.ok) throw new Error(`detail ${res.status}`);
  return res.json() as Promise<QuestionItem>;
}

export function ItemViewer() {
  const [selectedId, setSelectedId] = useState(SAMPLE_ITEMS[0].qtiIdentifier);
  const [props, setProps] = useState<QuestionItemProps | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setProps(null);
    setError(null);

    fetchItem(selectedId)
      .then((item) => {
        if (!cancelled) setProps(toQuestionProps(item));
      })
      .catch((e: unknown) => {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : String(e));
        }
      });

    return () => {
      cancelled = true;
    };
  }, [selectedId]);

  return (
    <div>
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

      {error && <p>{error}</p>}
      {props && <Question key={props.itemKey} theme="default" {...props} />}
    </div>
  );
}
```

## 7. Question (`mode="preview"`) 요약

| prop                 | 설명                                                   |
| -------------------- | ------------------------------------------------------ |
| `data`               | QTI XML                                                |
| `type`               | 문항 유형                                              |
| `itemKey`            | 문항 식별 키                                           |
| `mode`               | `"preview"` (읽기 전용)                                |
| `showInlineFeedback` | 하단 정답·피드백 표시 (기본: `false`) |
| `correctAnswers`     | 정답                                                   |
| `feedbacks`          | 해설/해석/힌트 등                                      |
| `theme`              | `"default"` \| `"daldal"` \| `"duolingo"` 또는 `Theme` |

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
