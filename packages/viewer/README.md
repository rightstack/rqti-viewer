# @rightstack/rqti-viewer

QTI 문항(Viewer) 렌더링 라이브러리. React 앱에서 문항 단위로 QTI XML을 렌더링합니다.

현재 가이드는 **상세 API + `mode="preview"`** 기준입니다.
문항을 조회·표시만 하며, 제출·채점 연동은 포함하지 않습니다.

> 사용자 연동 가이드(유형별 샘플 ID 포함): **[USER_GUIDE.md](./USER_GUIDE.md)**

## 요구사항

- React >= 18
- React DOM >= 18
- **클라이언트 컴포넌트 전용** — `DOMParser`를 사용하므로 SSR/Node 환경에서는 동작하지 않습니다.

## 설치

### 1. Registry 인증 설정

프로젝트 루트에 `.npmrc`를 추가합니다. 저장소 루트의 [`.npmrc.example`](../../.npmrc.example)를 복사해 사용할 수 있습니다.

```init
@rightstack:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=SHARED_READ_ONLY_TOKEN
```

- **읽기(설치)**: `read:packages` 권한이 있는 토큰을 `.npmrc`에 넣습니다. `.npmrc`는 gitignore 대상이며 커밋하지 않습니다.
- **쓰기(publish)**: `write:packages` 토큰은 `.npmrc`에 넣지 말고 `NODE_AUTH_TOKEN` 환경변수로만 전달합니다.

`SHARED_READ_ONLY_TOKEN`은 Rightstack에서 발급한 GitHub Packages **read-only** 토큰으로 교체합니다.

### 2. 패키지 설치

```bash
pnpm add @rightstack/rqti-viewer
# 또는
npm install @rightstack/rqti-viewer
```

### 3. CI/CD (GitHub Actions 예시)

```yaml
- name: Install dependencies
  env:
    NODE_AUTH_TOKEN: ${{ secrets.RIGHTSTACK_NPM_TOKEN }}
  run: |
    echo "@rightstack:registry=https://npm.pkg.github.com" >> .npmrc
    echo "//npm.pkg.github.com/:_authToken=${NODE_AUTH_TOKEN}" >> .npmrc
    pnpm install
```

## Quick Start

스타일은 반드시 별도로 import 합니다.

상세 API 응답(`QuestionItem`)을 `toQuestionProps`로 변환해 `Question`에 전달합니다.

```tsx
import {
  Question,
  toQuestionProps,
  type QuestionItem,
} from "@rightstack/rqti-viewer";
import "@rightstack/rqti-viewer/styles.css";

export function ItemView({ item }: { item: QuestionItem }) {
  return <Question theme="default" {...toQuestionProps(item)} />;
}
```

## 상세 API

현재 연동하는 API는 문항 상세 조회 하나뿐입니다.

```
GET /api/v3/viewer/preview/{qtiIdentifier}?t={token}
```

응답 본문 타입: `QuestionItem`

### 응답 필드

| 필드 | 타입 | 설명 |
|------|------|------|
| `id` | `number` | assessment id |
| `qtiIdentifier` | `string` | QTI identifier |
| `title` | `string` | 문항 제목 |
| `type` | `ItemsType` | 문항 유형 (`scq`, `mcq`, …) |
| `qtiXml` | `string` | QTI XML |
| `correctAnswer` | `Record<string, ResponseValue> \| null` | 정답 맵 |
| `settings` | `unknown \| null` | 설정 (현재 미사용) |
| `feedbacks` | `QuestionFeedback[]` | 피드백 목록 |

### feedbacks[] 필드

| 필드 | 타입 | 설명 |
|------|------|------|
| `feedbackType` | `string` | `HINT`, `TRANSLATION`, `SOLUTION`, … |
| `feedbackTypeLabel` | `string` | 표시 라벨 |
| `title` | `string` | 제목 |
| `content` | `string` | 본문 HTML (뷰어가 렌더) |
| `editorJson` | `QuestionEditorNode[]` | 에디터 JSON (타입만 보존, 렌더 미사용) |
| `effectiveCondition` | `string` | 표시 조건식 (현재 뷰어는 평가하지 않음) |
| `displayOrder` | `number` | 정렬 순서 |
| `conditionPresetId` | `string \| null` | 조건 프리셋 |
| … | | `id`, `assessmentId`, `createdAt`, `updatedAt` 등 |

> `effectiveCondition` 필터링은 호스트 앱 책임입니다. 매퍼는 전달된 `feedbacks`를 모두 Question에 넘깁니다.

### API → Question 매핑

`toQuestionProps(item)`:

| API | Question prop | 비고 |
|-----|---------------|------|
| `qtiXml` | `data` | |
| `type` | `type` | |
| `qtiIdentifier` | `itemKey` | |
| `correctAnswer` | `correctAnswers` | `null`이면 생략 |
| `feedbacks[].feedbackType` | `feedbacks[].type` | `displayOrder`로 정렬 |
| `feedbacks[].feedbackTypeLabel` | `feedbacks[].typeLabel` | |
| `feedbacks[].title` | `feedbacks[].title` | |
| `feedbacks[].content` | `feedbacks[].content` | |
| — | `mode` | 항상 `"preview"` |
| — | `showInlineFeedback` | 기본 `false` (필요 시 호출측에서 `true`) |

```tsx
import {
  Question,
  toQuestionProps,
  type QuestionItem,
} from "@rightstack/rqti-viewer";
import "@rightstack/rqti-viewer/styles.css";

async function loadItem(qtiId: string, token: string) {
  const res = await fetch(
    `/api/v3/viewer/preview/${qtiId}?t=${encodeURIComponent(token)}`,
  );
  const item = (await res.json()) as QuestionItem;
  return toQuestionProps(item);
}

export function ItemPage({ qtiId, token }: { qtiId: string; token: string }) {
  const [props, setProps] = useState<ReturnType<
    typeof toQuestionProps
  > | null>(null);

  useEffect(() => {
    loadItem(qtiId, token).then(setProps);
  }, [qtiId, token]);

  if (!props) return null;
  return <Question key={props.itemKey} theme="default" {...props} />;
}
```

### export

| export | 설명 |
|--------|------|
| `QuestionItem` | 상세 API 응답 본문 |
| `QuestionFeedback` | `feedbacks[]` 항목 |
| `QuestionEditorNode` | `editorJson` 노드 |
| `QuestionItemProps` | 매퍼 반환 타입 (`mode: "preview"`) |
| `toQuestionProps` | API → Question props |
| `SAMPLE_ITEMS` | 유형별 대표 문항 `{ type, label, qtiIdentifier }[]` |
| `SAMPLE_IDS` | `ItemsType` → `qtiIdentifier` 맵 |

```tsx
import {
  Question,
  SAMPLE_ITEMS,
  toQuestionProps,
  type QuestionItem,
} from "@rightstack/rqti-viewer";

// 탭/셀렉트에서 유형 선택 → identifier로 상세 API 조회
const sample = SAMPLE_ITEMS[0];
const res = await fetch(`/api/v3/viewer/preview/${sample.qtiIdentifier}?t=${token}`);
const item = (await res.json()) as QuestionItem;
<Question theme="default" {...toQuestionProps(item)} />;
```

## Question (preview)

매퍼를 쓰면 아래 props가 채워집니다. 문항은 읽기 전용으로 렌더되고, 하단에 정답·피드백이 표시됩니다.

| prop | 설명 |
|------|------|
| `data` | QTI XML |
| `type` | 문항 유형 |
| `itemKey` | 문항 식별 키 (캐시·전환용) |
| `mode` | `"preview"` 고정 |
| `showInlineFeedback` | 하단 FeedbackInline 표시 (기본: `false`) |
| `correctAnswers` | 정답 |
| `feedbacks` | 해설/해석/힌트 등 |

문항이 바뀔 때는 `key`와 `itemKey`를 함께 두는 것을 권장합니다.

```tsx
<Question key={props.itemKey} theme="default" {...props} />
```

### 미디어 / 인증

상세 API의 `t` 토큰과 별도로, 문항 내 미디어 URL용 토큰이 필요하면 `token` / `baseUrl`을 추가합니다.

| prop | 타입 | 설명 |
|------|------|------|
| `token` | `string` | 미디어 URL에 `?t={token}` 추가 (SVG 제외) |
| `baseUrl` | `string` | 상대 경로 미디어를 절대 URL로 변환할 베이스 |

```tsx
<Question
  theme="default"
  token={mediaToken}
  baseUrl={apiBaseUrl}
  {...toQuestionProps(item)}
/>
```

### 테마

| prop | 타입 | 설명 |
|------|------|------|
| `theme` | `Theme \| "default"` | 기본 테마 `"default"` 또는 커스텀 `Theme`(JSON/객체) |

```tsx
import { Question } from "@rightstack/rqti-viewer";

// 기본 테마
<Question theme="default" {...props} />

// 커스텀 테마 (JSON/객체) — THEME_GUIDE.md 참고
<Question theme={myTheme} {...props} />
```

커스텀 테마는 `DEFAULT_THEME`을 기반으로 오버라이드합니다.

```tsx
import { DEFAULT_THEME, type Theme } from "@rightstack/rqti-viewer";

const myTheme: Theme = {
  ...DEFAULT_THEME,
  id: "custom",
  name: "커스텀",
  containerConfig: {
    ...DEFAULT_THEME.containerConfig,
    maxWidth: "640px",
  },
};
```

문항 번호는 `theme.questionNumberConfig` + `questionIndex`로 제어합니다.

```tsx
const themeWithNumber: Theme = {
  ...DEFAULT_THEME,
  questionNumberConfig: {
    enabled: true,
    position: "inline", // "top" | "inline"
    prefix: "Q",
    suffix: ".",
    digits: 2,
  },
};

<Question theme={themeWithNumber} questionIndex={3} {...props} />
// → "Q03."
```

## 지원 문항 유형

`ITEM_TYPE` / 상세 API의 `type` 값입니다.

| 상수 | 값 | 설명 |
|------|-----|------|
| `ITEM_TYPE.SCQ` | `scq` | 단일 선택 |
| `ITEM_TYPE.MCQ` | `mcq` | 다중 선택 |
| `ITEM_TYPE.TFQ` | `tfq` | O/X |
| `ITEM_TYPE.GCQ` | `gcq` | 그룹 선택 |
| `ITEM_TYPE.ESSAY` | `essay` | 서술형 |
| `ITEM_TYPE.SRQ` | `srq` | 단답형 |
| `ITEM_TYPE.CLOZE` | `cloze` | 빈칸 채우기 |
| `ITEM_TYPE.DDQ` | `ddq` | 드롭다운 |
| `ITEM_TYPE.HTQ` | `htq` | 핫스팟 |
| `ITEM_TYPE.GMQ` | `gmq` | 빈칸 매칭 |
| `ITEM_TYPE.MATCH` | `match` | 연결하기 |
| `ITEM_TYPE.MATRIX` | `matrix` | 매트릭스 |
| `ITEM_TYPE.ORDER` | `order` | 순서 배열 |
| `ITEM_TYPE.DRAWING` | `drawing` | 그리기 |
| `ITEM_TYPE.SLIDER` | `slider` | 슬라이더 |
| `ITEM_TYPE.UPLOAD` | `upload` | 파일 업로드 |

## LaTeX

LaTeX 수식은 [MathLive](https://cortexjs.io/mathlive/)로 렌더링됩니다.
`styles.css` import 시 MathLive 스타일이 포함되므로 **별도 CSS import는 필요 없습니다**.

## 스타일 격리

모든 스타일은 `.rtqi-viewer` root 아래에서만 적용됩니다.
Tailwind preflight는 비활성화되어 host app CSS와 충돌하지 않습니다.
클래스 util은 `rtqi:` prefix로 스코프됩니다.

## 추가 export

```tsx
import {
  toQuestionProps,
  type QuestionItem,
  type QuestionFeedback,
  type QuestionItemProps,
  FeedbackInline,
  getThemeCSSVariables,
  ITEM_TYPE,
  type Theme,
  type FeedbackItem,
} from "@rightstack/rqti-viewer";
```

## 배포 (maintainer)

GitHub Packages에 publish (쓰기 토큰은 환경변수로만 사용):

```bash
export NODE_AUTH_TOKEN=WRITE_TOKEN   # write:packages
pnpm build:viewer
pnpm publish:viewer
```
