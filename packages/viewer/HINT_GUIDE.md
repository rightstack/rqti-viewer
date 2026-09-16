# 호스트 힌트 가이드

힌트 영역은 **호스트 앱**이 그립니다. 라이브러리는 에디터 `content` HTML을 React 노드로 바꾸고, `styles.css`의 `qti-*`로 본문 모양을 유지합니다.

`Question`의 인라인 피드백(`showInlineFeedback`)을 쓰지 않고, 문항 **밖**에서 `hints[]`를 그릴 때 이 문서를 따릅니다.

`Question`과 힌트는 **같은 파일·같은 라우트가 아닐 수 있습니다.** 힌트만 있는 화면에는 문항용 Provider·테마 변수가 따라오지 않습니다. 그 화면에서 `styles.css`와 `MathJaxProviderWrapper`를 넣고, 힌트 영역을 `.rqti-viewer`로 감쌉니다.

문항 연동은 **[USER_GUIDE.md](./USER_GUIDE.md)** 를 봅니다.

---

## 1. 경계

| | 라이브러리 | 호스트 |
| --- | --- | --- |
| 할 일 | `parseFeedbackContentToReact`로 수식·이미지·목록·단·세로셈을 노드로 변환. `MathJaxProviderWrapper`로 수식 표시. `styles.css`의 `qti-*`로 본문 클래스 유지 | `hints[]`를 한 레이아웃 안에 제목·순서로 그림. 힌트 영역 배경·패딩·제목·본문 폰트 |
| 하지 않음 | 힌트 전용 컴포넌트, 타이포 CSS 변수, 힌트 영역용 클래스 계약 | `qti-ext-feedback-*` 등 라이브러리 피드백 클래스로 힌트 영역을 꾸미지 않음 |

| | 누가 | 무엇 |
| --- | --- | --- |
| 힌트 영역 | 호스트 | 배경, 제목, 아이콘. 라이브러리 피드백 클래스 없음. `.rqti-viewer`로 감쌈 |
| 본문 | `styles.css` | 에디터 클래스 유지. `.rqti-viewer` 밖에서는 `qti-*`가 적용되지 않음 |
| 힌트 단독 화면 | 그 엔트리 | `styles.css`, `MathJaxProviderWrapper`, `.rqti-viewer`. 세로셈 빈칸이면 `getThemeCSSVariables` |

`Question`은 문항만 그립니다. 힌트를 호스트가 그리면 `showInlineFeedback={false}`로 둡니다. 힌트만 있는 페이지라면 `Question`을 렌더하지 않아도 됩니다.

---

## 2. 데이터

호스트 API 형태입니다. 라이브러리 `QuestionItem.feedbacks`와 별개입니다.

```ts
type Hint = {
  title: string;
  content: string;
  display_order: number;
};

const hints: Hint[] = [
  {
    title: "힌트 1",
    content:
      '<p><span class="qti-ext-mathfield" data-latex="2\\sin3\\times\\frac{2}{5}">2\\sin3\\times\\frac{2}{5}</span> 테스트 중입니다.</p>',
    display_order: 1,
  },
];
```

| 필드 | 누가 | 사용 |
| --- | --- | --- |
| `title` | 호스트 | 라벨로 그대로 그림 |
| `display_order` | 호스트 | 정렬·표시 순서 |
| `content` | 라이브러리 | `parseFeedbackContentToReact(content)`에만 넘김 |

`content`는 에디터 HTML입니다. `$...$`만 자르는 함수는 태그 안 수식을 못 봅니다.

---

## 3. 사용

힌트는 `Question` 밖이므로 Provider를 호스트가 한 번 감쌉니다. (`Question` 안의 Provider는 문항용입니다.)

같은 트리에 `Question`이 있어도 힌트는 그 안 Provider 밖에 있으므로 감쌉니다. **다른 페이지면 `Question`만으로는 부족합니다.** 힌트 화면에서 `styles.css`와 `MathJaxProviderWrapper`를 직접 import 합니다.

`styles.css`의 `qti-*` 규칙은 `.rqti-viewer` 하위에만 적용됩니다. 힌트 영역에 그 클래스를 넣습니다. `qti-ext-feedback-*`는 쓰지 않습니다.

세로셈 빈칸 테두리는 `--qti-option-border` 등 테마 변수를 씁니다. 힌트 단독 화면이면 `getThemeCSSVariables`로 `.rqti-viewer`에 넣습니다.

```tsx
import "@rightstack/rqti-viewer/styles.css";
import {
  parseFeedbackContentToReact,
  MathJaxProviderWrapper,
  getThemeCSSVariables,
  DEFAULT_THEME,
} from "@rightstack/rqti-viewer";

const ordered = [...hints].sort((a, b) => a.display_order - b.display_order);
const themeVariables = getThemeCSSVariables(DEFAULT_THEME);

<MathJaxProviderWrapper>
  <div className="rqti-viewer hint" style={themeVariables}>
    {ordered.map((hint) => (
      <section key={hint.display_order}>
        <h2>{hint.title}</h2>
        {parseFeedbackContentToReact(hint.content, { token, baseUrl })}
      </section>
    ))}
  </div>
</MathJaxProviderWrapper>
```

```css
.hint {
  background: #fff8e7;
  padding: 16px;
  border-radius: 12px;
  border: 1px solid #f59e0b;
  font-family: "Noto Serif KR", serif;
  font-size: 16px;
  color: #1f2937;
  line-height: 1.6;
}

.hint section + section {
  margin-top: 16px;
}
```

이미지는 상대 경로(`/api/v3/assessment-resource/...`)이면 `baseUrl`로 절대 경로를 만들고, URL에 `?t=`가 없으면 `token`을 붙입니다. URL에 `?t=`가 이미 있으면 둘 다 생략합니다.

```tsx
parseFeedbackContentToReact(hint.content);
parseFeedbackContentToReact(hint.content, { token, baseUrl });
```

클라이언트 전용입니다. `DOMParser`를 쓰므로 SSR에서 호출하지 마세요.

---

## 4. 스타일

힌트 영역 타이포(글꼴·크기·색·줄간격)는 호스트입니다. 글은 브라우저 상속입니다. 글꼴은 호스트가 로드합니다.

본문 레이아웃·수식·미디어는 라이브러리 `styles.css`의 `qti-*` 클래스입니다. `.rqti-viewer` 안에서만 적용됩니다. 파서는 인라인 `style`을 복사하지 않으므로 **클래스 기반 표현만 유지**됩니다.

| 에디터 클래스 | 역할 |
| --- | --- |
| `qti-ext-mathfield` | 수식 (`data-latex` 또는 `$...$`) |
| `qti-list-style-type-*` | 목록 마커 |
| `qti-ext-figure` / `qti-align-*` | 이미지 정렬 |
| `qti-ext-column-group` / `qti-ext-column` | 다단 |
| `qti-ext-vcq-grid` | 세로셈 칸·나눗셈 막대 |

| | 본문 글 | 수식 |
| --- | --- | --- |
| 글꼴 | 힌트 영역 `font-family`를 따름 | 수식 폰트 유지 |
| 크기·색·줄간격 | 힌트 영역을 따름 | 힌트 영역을 따름 |

제목·아이콘·힌트별 다른 톤은 호스트가 `title` 옆과 클래스 변형으로 그립니다.

세로셈 칸의 `qti-ext-input-blank`(표시용 빈칸) 테두리 색은 `--qti-option-border` 등을 씁니다. `getThemeCSSVariables`를 `.rqti-viewer`에 넣지 않으면 상자 선이 안 보일 수 있습니다.
