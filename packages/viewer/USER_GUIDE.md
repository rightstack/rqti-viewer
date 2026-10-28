# @rightstack/rqti-viewer 사용자 가이드

<del>QTI 문항을 **상세 API**로 조회해 읽기 전용으로 렌더링하는 가이드입니다.  
제출·채점 연동은 포함하지 않습니다. (`Question`의 기본 모드 `preview` 사용)</del>

<del>QTI 문항을 **상세 API**로 조회해 렌더링하고, 응시 결과 값과 연결지문을 넘기는 가이드입니다.</del>

QTI 문항을 호스트 외부 API로 조회해 렌더링하고, 응시 결과 값과 연결지문을 넘기는 가이드입니다.  
피드백·채점 표시는 포함하지 않습니다. 호스트가 별도로 구현합니다.

> `mode`는 `Question`이 기본값 `"preview"`(읽기 전용)로 처리합니다. `toQuestionProps`는 `mode`를 지정하지 않으므로, 인터랙션이 필요하면 호출측에서 `mode="practice"`를 직접 전달하세요.

현재 패키지 버전: <del>**0.4.0**</del> <del>**0.4.23**</del> <del>**0.4.24**</del> <del>**0.4.25**</del> <del>**0.4.26**</del> <del>**0.4.27**</del> <del>**0.4.28**</del> <del>**0.4.29**</del> <del>**0.4.30**</del> **0.4.31**


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

스타일은 반드시 별도 import 합니다. (<del>MathLive 스타일 포함</del> MathJax 표시용 스타일 포함)

---

## 2. 핵심 흐름

<del>상세 API 조회 `GET https://stgqms.mirae-n.com/api/v3/viewer/preview/{qtiIdentifier}` (`Authorization: Bearer {token}`)</del>

```
호스트 외부 API로 문항 조회
    ↓
toQuestionProps(item)
    ↓
<Question {...props} />   // 기본 mode="preview" (practice는 호출측에서 지정)
```

라이브러리는 **데이터(`SAMPLE_ITEMS`) + 매퍼 + Question**만 제공합니다.  
select / tab 등 UI는 호스트 앱에서 구현합니다.

---

## <del>3. 유형별 대표 문항 (`SAMPLE_ITEMS`)</del>

## 3. 지원 문항 유형

`Question`의 `type` 값입니다.

| 유형 | `type` |
| --- | --- |
| 단일 선택 | `scq` |
| 다중 선택 | `mcq` |
| 그룹 선택 | `gcq` |
| 참/거짓 | `tfq` |
| 드롭다운 | `ddq` |
| 연결하기 | `match` |
| 단답형 | `srq` |
| 빈칸 채우기 | `cloze` |
| 서술형 | `essay` |
| 세로셈 | `vcq` |

수식 빈칸·이미지 빈칸은 별도 `type`이 아닙니다. 단답·빈칸·세로셈 XML 안에서 렌더됩니다.

---

## <del>4. 상세 API</del>

문항 조회와 인증은 호스트 외부 API를 사용합니다.

---

## 5. API → Question 매핑

`toQuestionProps(item)` 결과:

| API               | Question prop        | 비고                                                                        |
| ----------------- | -------------------- | --------------------------------------------------------------------------- |
| `qtiXml`          | `data`               |                                                                             |
| `type`            | `type`               |                                                                             |
| `qtiIdentifier`   | `itemKey`            |                                                                             |
| <del>`correctAnswer`</del> | <del>`correctAnswers`</del> | <del>`null`이면 생략</del>                                        |
| <del>`feedbacks`</del>     | <del>`feedbacks`</del>      | <del>`displayOrder` 정렬, `feedbackType` → `type`</del>            |
| `passage.content` | `passage`            | 연결지문 HTML. 값이 있으면 전달하고, 없으면 생략                            |
| —                 | `mode`               | 매퍼는 지정 안 함 → Question 기본값 `"preview"` (필요 시 `mode="practice"`) |
| <del>—</del>               | <del>`showInlineFeedback`</del> | <del>기본 `false` (필요 시 호출측에서 `true`)</del>              |

취소선 행은 뷰어 피드백 표시용입니다. 이 연동에서는 사용하지 않습니다. `toQuestionProps`가 값을 넣어도 `showInlineFeedback` 기본값은 `false`라 화면에 나오지 않습니다.

---

## 6. 구현 예시

<del>예시는 `GET https://stgqms.mirae-n.com/api/v3/viewer/preview/{qtiIdentifier}`와 `Authorization: Bearer`로 문항을 조회했습니다.</del>

호스트 외부 API의 조회 결과 `QuestionItem`을 `toQuestionProps`에 넘깁니다.

```tsx
import {
  Question,
  toQuestionProps,
  type QuestionItem,
} from "@rightstack/rqti-viewer";
import "@rightstack/rqti-viewer/styles.css";

export function ItemViewer({ item }: { item: QuestionItem }) {
  const props = toQuestionProps(item);

  return <Question key={props.itemKey} theme="default" {...props} />;
}
```

---

## 7. 너비 및 스케일 설정

뷰어는 **고정형 스케일**입니다. <del>`sizing="responsive"` / `sizing="fixed"`</del>는 없습니다.
`designWidth`는 호스트가 넘깁니다. <del>기본 `720`</del> 라이브러리 기본값은 없습니다.
값이 있으면 그 폭으로 렌더한 뒤 부모 폭에 맞춰 같은 비율로 축소됩니다. 생략하면 스케일하지 않습니다.

| 설정 | 설명 |
| --- | --- |
| <del>`sizing="responsive"`</del> | <del>**반응형**: 부모 너비에 따라 줄바꿈과 배치가 변경됨</del> |
| <del>`sizing="fixed"`</del> | <del>**고정형 스케일**: 기준 레이아웃을 유지하며 가로·세로가 같은 비율로 축소됨</del> |
| `designWidth={1000}` | 고정형 스케일의 기준 너비(px). 호스트가 지정. 기본값 없음 |
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
};

<Question
  {...props}
  theme={exampleTheme}
  designWidth={1000}
/>
```

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
| `mode`               | 기본 `"preview"`(읽기 전용). `"practice"`로 인터랙션 활성          |
| `onSubmit`           | practice. 제출 시 응시 결과 값만 수신. 피드백은 포함하지 않음      |
| `onResponse`         | practice. 사용자 입력이 답을 바꿀 때만 호출. 자동 저장용           |
| `responses`          | 저장해 둔 응시 결과를 선택·입력으로 표시. preview·practice 모두 사용 |
| `showSubmitButton`   | practice. 기본 `true`. 호스트가 제출 버튼을 두면 `false`           |
| <del>`showInlineFeedback`</del> | <del>하단 정답·피드백 표시 (기본: `false`)</del>        |
| <del>`correctAnswers`</del>     | <del>정답</del>                                         |
| <del>`feedbacks`</del>          | <del>해설/해석/힌트 등</del>                            |
| `theme`              | `"default"` 또는 커스텀 `Theme`(JSON/객체) — `THEME_GUIDE.md` 참고 |
| <del>`sizing`</del>             | <del>`"responsive"`(기본) 또는 `"fixed"`</del>                     |
| `designWidth`        | <del>`fixed` 모드의 원본 기준 폭(px). 기본 `720`</del> 고정형 스케일의 원본 기준 폭(px). 호스트가 지정. 없으면 스케일 없음 |

문항 전환 시 `key={props.itemKey}`를 권장합니다.

취소선 중 `showInlineFeedback` / `correctAnswers` / `feedbacks`는 뷰어 피드백 표시용입니다. 피드백 표시는 호스트가 별도로 구현합니다. `sizing`은 없습니다.

---

## 9. 응시 결과

응시 결과 값은 응답 맵입니다. 정오, 해설, 힌트는 들어 있지 않습니다.

`practice`에서 제출하면 `onSubmit`으로 이 맵을 받습니다. 답이 바뀔 때마다 받으려면 `onResponse`를 씁니다. 같은 값을 `responses`에 넣으면 선택·입력이 복원됩니다.

| | practice | preview |
| --- | --- | --- |
| `mode` | `"practice"` | `"preview"` (기본값) |
| 동작 | 풀이 가능, 제출 버튼 표시 | 읽기 전용. 저장한 응답을 선택·입력으로 표시 |
| 추가 prop | <del>`onSubmit`</del> `onSubmit`, `onResponse`, `responses` | `responses` |

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
  mode="practice"
  showSubmitButton={false}
  responses={savedResponses}
  onResponse={(responses) => {
    saveResponses(responses);
  }}
/>

<Question
  {...props}
  mode="preview"
  responses={savedResponses}
/>
```

`onResponse`는 사용자 입력이 답을 바꿀 때만 호출됩니다. 저장된 답 복원만으로는 호출되지 않습니다.

키는 QTI `response-identifier`입니다. 단일 선택은 문자열, 다중 선택·순서·연결은 문자열 배열입니다. 단일 선택 예:

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

지문을 여러 문항이 공유하거나 문항 밖에 두려면 `parsePassageHtmlToReact`와 `PassageLayout`을 조합합니다. 이미지 `src`가 이미 완전한 주소면 `token`과 `baseUrl`은 생략합니다. 상대 경로를 베이스 URL로 바꾸고 `?t=`를 붙여야 할 때만 넘깁니다.

`Question` 밖으로 빼면 아래를 호스트가 맞춥니다.

- 테마 변수. 공통 조상에 `className="rqti-viewer"`와 `getThemeCSSVariables(theme)`를 둡니다. 스타일은 `.rqti-viewer` 아래에서만 적용됩니다.
- MathJax. 지문 수식은 `MathJaxProviderWrapper`로 지문과 문항을 함께 감쌉니다.
- 스케일. `FixedScaleContainer` 하나가 분할 전체를 감쌉니다. 안의 `Question`에는 `designWidth`를 넘기지 않습니다. 넘기면 문항만 한 번 더 줄어듭니다.
- 지문 중복. `toQuestionProps`는 `item.passage.content`를 `passage`로 넣습니다. 밖에서 레이아웃을 쓸 때는 `Question`의 `passage`를 비웁니다.
- 패널 스크롤. 지문과 문항 패널은 각자 스크롤됩니다. 조상 높이가 정해져 있어야 합니다.

```tsx
const passage = parsePassageHtmlToReact(passageHtml, {
  theme: DEFAULT_THEME,
  mode: "preview",
});

<div style={{ height: "100%" }}>
  <MathJaxProviderWrapper>
    <FixedScaleContainer designWidth={1000}>
      <div className="rqti-viewer" style={getThemeCSSVariables(DEFAULT_THEME)}>
        <PassageLayout passage={passage}>
          <Question {...props} passage={undefined} theme={DEFAULT_THEME} />
        </PassageLayout>
      </div>
    </FixedScaleContainer>
  </MathJaxProviderWrapper>
</div>
```

---

## <del>9. 요구사항 / 제약</del>

## 11. 요구사항 / 제약

- React >= 18, React DOM >= 18
- **클라이언트 전용** (`DOMParser` 사용 — SSR에서 동작하지 않음)
- <del>스타일은 `.rtqi-viewer` 아래로 격리됨 (`rtqi:` Tailwind prefix)</del>
- QTI / QTI-ext 스타일은 `.rqti-viewer` 아래로 격리됨. Tailwind 유틸은 `rqti:` prefix. 테마는 `--qti-*` 변수(`.rqti-viewer`에 주입)

---

## <del>10. 주요 export 목록</del>

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
  PassageLayout,
  parsePassageHtmlToReact,
  type PassageLayoutProps,
  type PassageParseOptions,
  FixedScaleContainer,
  MathJaxProviderWrapper,
  getThemeCSSVariables,
  DEFAULT_THEME,
} from "@rightstack/rqti-viewer";
```
