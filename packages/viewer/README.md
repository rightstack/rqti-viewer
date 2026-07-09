# @rightstack/rqti-viewer

QTI 문항(Viewer) 렌더링 라이브러리. React 앱에서 문항 단위로 QTI XML을 렌더링합니다.

## 요구사항

- React >= 18
- React DOM >= 18
- **클라이언트 컴포넌트 전용** — `DOMParser`를 사용하므로 SSR/Node 환경에서는 동작하지 않습니다.

## 설치

### 1. Registry 인증 설정

프로젝트 루트에 `.npmrc`를 추가합니다. 저장소 루트의 [`.npmrc.example`](../../.npmrc.example)를 복사해 사용할 수 있습니다.

```ini
@rightstack:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=SHARED_READ_ONLY_TOKEN
```

`SHARED_READ_ONLY_TOKEN`은 Rightstack에서 발급한 GitHub Packages **read-only** 토큰으로 교체합니다.
(`read:packages` 권한이 있는 Personal Access Token 또는 조직에서 제공하는 공유 토큰)

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

```tsx
import { Question, ITEM_TYPE } from "@rightstack/rqti-viewer";
import "@rightstack/rqti-viewer/styles.css";

export function ItemViewer({ qtiXml }: { qtiXml: string }) {
  return (
    <Question
      data={qtiXml}
      type={ITEM_TYPE.MCQ}
      mode="practice"
      onResponse={(responses) => console.log(responses)}
    />
  );
}
```

## 문항 렌더링

`Question` 컴포넌트 하나로 문항 단위 렌더링을 수행합니다.

### 모드

| mode | 설명 |
|------|------|
| `practice` | 인터랙티브 풀이 모드 (기본값). 제출 버튼·응답 입력 활성 |
| `preview` | 리뷰/정답 확인 모드. 인터랙션 비활성, 하단에 정답·해설 표시 가능 |

### 문항 전환

문항이 바뀔 때 응답·내부 캐시를 초기화하려면 React `key`와 `itemKey`를 함께 사용하는 것을 권장합니다.

```tsx
<Question
  key={itemId}
  itemKey={itemId}
  data={qtiXml}
  type={itemType}
  mode="practice"
/>
```

- `key` — React 리마운트로 컴포넌트 상태 초기화
- `itemKey` — 매칭(MATCH) 등 내부 캐시·높이 동기화 키

### 권장 통합 예시

```tsx
import { useState } from "react";
import {
  Question,
  ITEM_TYPE,
  type ItemsType,
  type ResponseValueMap,
} from "@rightstack/rqti-viewer";
import "@rightstack/rqti-viewer/styles.css";

interface ItemViewerProps {
  itemId: string;
  qtiXml: string;
  itemType: ItemsType;
  mediaToken?: string;
  apiBaseUrl?: string;
}

export function ItemViewer({
  itemId,
  qtiXml,
  itemType,
  mediaToken,
  apiBaseUrl,
}: ItemViewerProps) {
  const [responses, setResponses] = useState<ResponseValueMap>({});

  return (
    <Question
      key={itemId}
      itemKey={itemId}
      data={qtiXml}
      type={itemType}
      token={mediaToken}
      baseUrl={apiBaseUrl}
      theme="daldal"
      mode="practice"
      showFeedback
      correctAnswers={correctAnswers}
      onResponse={setResponses}
      onSubmit={(submitted) => sendToServer(submitted)}
    />
  );
}
```

## Question API

### 필수 props

| prop | 타입 | 설명 |
|------|------|------|
| `data` | `string` | QTI XML 문자열 |
| `type` | `ItemsType` | 문항 유형 (`ITEM_TYPE` 상수 사용 권장). 없으면 제출 버튼이 비활성화됩니다 |

### 미디어 / 인증

| prop | 타입 | 설명 |
|------|------|------|
| `token` | `string` | 미디어 URL에 `?t={token}` 쿼리로 추가되는 인증 토큰 (SVG 제외) |
| `baseUrl` | `string` | 상대 경로 미디어를 절대 URL로 변환할 때 사용하는 베이스 URL |

```tsx
// 상대 경로: /media/image.png → https://api.example.com/media/image.png?t=TOKEN
<Question
  data={qtiXml}
  type={ITEM_TYPE.SCQ}
  baseUrl="https://api.example.com"
  token={sessionMediaToken}
/>
```

### 테마

| prop | 타입 | 설명 |
|------|------|------|
| `theme` | `Theme \| string` | 프리셋 id (`"default"`, `"daldal"`, `"duolingo"`) 또는 커스텀 `Theme` 객체 |

### 응답 / 제출 / 채점

| prop | 타입 | 설명 |
|------|------|------|
| `mode` | `"practice" \| "preview"` | 동작 모드 (기본: `practice`) |
| `onResponse` | `(responses) => void` | 응답 변경 콜백 |
| `onSubmit` | `(responses) => void` | 제출 버튼 클릭 콜백 |
| `responses` | `ResponseValueMap` | 제어형 응답 (preview 모드에서 외부 state 연동) |
| `correctAnswers` | `Record<string, ResponseValue>` | 정답 데이터 |
| `submitResponse` | `FeedbackSubmitResponse` | 외부 채점 결과 주입 |
| `showFeedback` | `boolean` | practice 모드에서 내장 피드백 시트 표시 |
| `showSubmitButton` | `boolean` | 제출 버튼 표시 (기본: `true`) |

### 리뷰(preview) 모드

| prop | 타입 | 설명 |
|------|------|------|
| `correct` | `boolean` | 정오답 표시 |
| `feedbacks` | `FeedbackItem[]` | 하단 해설/해석/힌트 섹션 |
| `passageFeedbacks` | `string` | 지문 해설 HTML |
| `showInlineFeedback` | `boolean` | 하단 FeedbackInline 표시 (기본: `true`) |
| `questionIndex` | `number` | 문항 번호 (1-based) |

### 기타

| prop | 타입 | 설명 |
|------|------|------|
| `itemKey` | `string` | 문항 식별 키 (내부 캐시용) |
| `placeholder` | `string` | 텍스트 입력 placeholder |
| `solution` | `ReactNode` | 정답 피드백 시 "풀이보기" 모달 내용 |
| `className` | `string` | `.rtqi-viewer` 루트에 추가할 클래스 |

## 테마 설정

### 프리셋

| id | 이름 |
|----|------|
| `default` | 기본 테마 |
| `daldal` | 달달독해 |
| `duolingo` | Duolingo 스타일 |

```tsx
import { Question, DALDAL_THEME } from "@rightstack/rqti-viewer";

// 문자열 id
<Question theme="daldal" ... />

// Theme 객체 직접 전달
<Question theme={DALDAL_THEME} ... />
```

### 커스텀 테마

`Theme` 객체를 직접 전달하거나 `DEFAULT_THEME`을 기반으로 오버라이드합니다.

```tsx
import {
  Question,
  DEFAULT_THEME,
  getThemeCSSVariables,
  type Theme,
} from "@rightstack/rqti-viewer";

const myTheme: Theme = {
  ...DEFAULT_THEME,
  id: "custom",
  name: "커스텀",
  containerConfig: {
    ...DEFAULT_THEME.containerConfig,
    maxWidth: "640px",
    backgroundColor: "#FAFAFA",
  },
  typography: {
    ...DEFAULT_THEME.typography,
    baseFontSize: "18px",
  },
};

<Question theme={myTheme} ... />
```

테마는 `.rtqi-viewer` 루트에 CSS 변수로 적용됩니다. 폰트는 `typography.fontFamily` 설정 시 자동 로드됩니다.

문항 번호는 `theme.questionNumberConfig`로 제어합니다.

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

<Question theme={themeWithNumber} questionIndex={3} ... />
// → "Q03." 표시
```

## 지원 문항 유형

`ITEM_TYPE` 상수로 전달합니다.

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
`styles.css` import 시 MathLive 스타일이 `viewer.css`에 포함되므로 **별도 CSS import는 필요 없습니다**.

## 스타일 격리

모든 스타일은 `.rtqi-viewer` root 아래에서만 적용됩니다.
Tailwind preflight는 비활성화되어 host app CSS와 충돌하지 않습니다.

## 추가 export

커스텀 UX가 필요할 때 아래를 직접 사용할 수 있습니다.

```tsx
import {
  FeedbackSheet,
  FeedbackModal,
  FeedbackInline,
  getFeedbackTitle,
  getThemeCSSVariables,
  type Theme,
  type ResponseValueMap,
  type FeedbackItem,
} from "@rightstack/rqti-viewer";
```

## 배포 (maintainer)

GitHub Packages에 publish:

```bash
export NODE_AUTH_TOKEN=YOUR_PUBLISH_TOKEN
pnpm build:viewer
pnpm publish:viewer
```
