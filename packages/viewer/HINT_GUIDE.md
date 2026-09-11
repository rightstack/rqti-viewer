# 호스트 힌트 가이드

힌트 레이아웃과 본문은 **호스트 앱**이 그립니다. 라이브러리는 에디터 HTML의 **수식만** React 노드로 바꿉니다.

`Question`의 인라인 피드백(`showInlineFeedback`)을 쓰지 않고, 문항 **밖**에서 `hints[]`를 그릴 때 이 문서를 따릅니다.

문항 연동은 **[USER_GUIDE.md](./USER_GUIDE.md)** 를 봅니다.

---

## 1. 경계

| | 라이브러리 | 호스트 |
| --- | --- | --- |
| 할 일 | `parseFeedbackContentToReact`로 `content`의 수식·이미지를 노드로 변환. `MathJaxProviderWrapper`로 수식 표시 | `hints[]`를 한 레이아웃 안에 제목·순서로 그림. 레이아웃과 본문 폰트 |
| 하지 않음 | 힌트 전용 컴포넌트, 타이포 CSS 변수, 클래스 계약 | `styles.css`를 힌트용으로 쓰지 않음 |

`Question`은 문항만 그립니다. 힌트를 호스트가 그리면 `showInlineFeedback={false}`로 둡니다.

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
    content: "<p>첫 번째 힌트입니다.</p>",
    display_order: 1,
  },
  {
    title: "힌트 2",
    content: "<p>두 번째 힌트입니다.</p>",
    display_order: 2,
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

박스에는 호스트 `className` 또는 `style`을 씁니다. 라이브러리 클래스는 없습니다.

```tsx
import {
  parseFeedbackContentToReact,
  MathJaxProviderWrapper,
} from "@rightstack/rqti-viewer";

const ordered = [...hints].sort((a, b) => a.display_order - b.display_order);

<MathJaxProviderWrapper>
  <div className="hint">
    {ordered.map((hint) => (
      <section key={hint.display_order}>
        <h2>{hint.title}</h2>
        {parseFeedbackContentToReact(hint.content)}
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

`token` / `baseUrl`은 이미지 URL에 아직 토큰이 없을 때만 넘깁니다. URL에 `?t=`가 이미 있으면 생략합니다.

```tsx
parseFeedbackContentToReact(hint.content);
parseFeedbackContentToReact(hint.content, { token, baseUrl });
```

클라이언트 전용입니다. `DOMParser`를 쓰므로 SSR에서 호출하지 마세요.

---

## 4. 스타일

호스트 클래스(또는 `style`)에 값을 넣습니다. 글은 브라우저 상속입니다. 글꼴은 호스트가 로드합니다.

| | 본문 글 | 수식 |
| --- | --- | --- |
| 글꼴 | 박스 `font-family`를 따름 | 수식 폰트 유지 |
| 크기·색·줄간격 | 박스를 따름 | 박스를 따름 |

제목·아이콘·힌트별 다른 톤은 호스트가 `title` 옆과 클래스 변형으로 그립니다. 에디터에서 지정한 인라인 색이 있으면 그 색이 이깁니다.
