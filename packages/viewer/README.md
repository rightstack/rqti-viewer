# @rightstack/rqti-viewer

QTI 문항(Viewer) 렌더링 라이브러리. React 앱에서 문항 단위로 QTI XML을 렌더링합니다.

`Question`은 **문항 1개**를 렌더합니다.

> 사용자 연동 가이드(유형별 샘플 ID·practice/preview): **[USER_GUIDE.md](./USER_GUIDE.md)**

## 요구사항

- React >= 18
- React DOM >= 18
- **클라이언트 컴포넌트 전용** — `DOMParser`를 사용하므로 SSR/Node 환경에서는 동작하지 않습니다.

## GitHub Packages 인증

토큰은 `~/.npmrc`에만 둔다. 레포에는 커밋하지 않는다. 값은 사내에서 받는다.

| 용도 | 토큰 | 가능 |
|---|---|---|
| 설치 | read | `pnpm add` |
| 배포 | write | `pnpm add`, `pnpm publish:viewer` |

write는 read를 포함한다. 배포하는 사람은 write만 두면 된다.  
`~/.npmrc`의 `_authToken`은 한 줄만 둔다.

```bash
# 등록 (ghp_... 를 받은 토큰으로 교체)
echo '//npm.pkg.github.com/:_authToken=ghp_...' >> ~/.npmrc

# 확인. 이미 있으면 echo 를 반복하지 않는다.
grep 'npm.pkg.github.com' ~/.npmrc
```

프로젝트 `.npmrc`에는 레지스트리만 둔다.

```ini
@rightstack:registry=https://npm.pkg.github.com
```

### 설치 (read)

```bash
pnpm add @rightstack/rqti-viewer
```

### 배포 (write)

`~/.npmrc`가 write 토큰이어야 한다. 줄이 있으면 값을 교체하고, `>>`로 추가하지 않는다.  
`packages/viewer/package.json`과 `USER_GUIDE.md` 버전을 올린 뒤:

```bash
pnpm build:viewer
pnpm publish:viewer
```

같은 버전은 다시 올릴 수 없다.

### CI

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

뷰어가 직접 호출하는 API는 문항 상세 조회 하나뿐입니다. 채점·세션·Delivery API는 호스트 백엔드 범위입니다.

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

## practice / preview

| | practice | preview |
| --- | --- | --- |
| `mode` | `"practice"` | `"preview"` (기본값) |
| 동작 | 풀이 가능, 제출 버튼 표시 | 읽기 전용 |
| 추가 prop | `onSubmit` — 제출 시 응답 수신 | `responses` — 저장 응답을 선택·입력으로 표시 |

```tsx
<Question
  key={props.itemKey}
  {...props}
  mode="practice"
  onSubmit={(responses) => {
    saveResponses(responses);
  }}
/>

<Question
  key={props.itemKey}
  {...props}
  mode="preview"
  responses={savedResponses}
/>
```

`onSubmit`으로 받은 값을 preview의 `responses`에 그대로 넣으면 됩니다. 실제 형태는 `onSubmit`에서 확인하면 됩니다.

```ts
{ RESPONSE: "C" }
```

연결지문이 있으면 `passage`에 HTML을 넘깁니다. 파싱과 가로 배치는 `Question` 내부에서 처리합니다.

```tsx
<Question {...props} passage={passageHtml} />
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

문항 번호는 표시하지 않습니다.

```tsx
const themeWithoutNumber: Theme = {
  ...DEFAULT_THEME,
  questionNumberConfig: {
    ...DEFAULT_THEME.questionNumberConfig,
    enabled: false,
  },
};

<Question theme={themeWithoutNumber} {...props} />
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
| `ITEM_TYPE.VCQ` | `vcq` | 세로셈 (`qti-portable-custom-interaction` + `math-input-blank`) |

세로셈·수식 내 빈칸은 PCI `custom-interaction-type-identifier="math-input-blank"`로 렌더합니다. CLOZE에도 같은 PCI가 섞일 수 있으며, `canSubmit`은 해당 빈칸 개수를 포함합니다. QMS 대표 `qtiIdentifier`가 정해지기 전까지 `SAMPLE_ITEMS`에는 `vcq`가 없고 playground 로컬 XML로 확인합니다.

## LaTeX

QTI 문항의 LaTeX 수식은 [MathJax](https://www.mathjax.org/)로 렌더링됩니다.
호스트가 Provider를 감싸지 않아도 `Question`이 내부에서 `MathJaxProviderWrapper`를 제공합니다. 수식 키보드 입력(MathLive)은 기존과 같습니다.

## 스타일 격리

모든 스타일은 `.rqti-viewer` root 아래에서만 적용됩니다.
Tailwind preflight는 비활성화되어 host app CSS와 충돌하지 않습니다.
클래스 util은 `rqti:` prefix로 스코프됩니다.

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
  MathJaxProviderWrapper,
  type Theme,
  type FeedbackItem,
} from "@rightstack/rqti-viewer";
```

`MathJaxProviderWrapper`는 `Question`이 이미 감싸므로 보통 직접 쓸 필요는 없습니다.
