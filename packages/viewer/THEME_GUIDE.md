# 테마(Theme) 가이드

`@rightstack/rqti-viewer`의 문항 렌더링 스타일은 **Theme 객체**로 제어합니다.
이 문서는 기본 테마(`src/themes/defaultTheme.ts`)를 기준으로 각 필드의 의미와 값을 설명하고,
JSON으로 테마를 작성/전달하는 방법을 안내합니다.

---

## 1. 테마 사용법

`Question` 컴포넌트의 `theme` prop에 **테마 객체**를 전달합니다.
모든 값이 문자열/숫자/불리언이므로 **JSON으로 직렬화 가능한 순수 객체**를 그대로 넘길 수 있습니다. (JSON과 1:1 대응)

```tsx
import { Question } from "@rightstack/rqti-viewer";
import themeJson from "./my-theme.json";

<Question {...props} theme={themeJson} />;
```

```tsx
// 인라인 객체
<Question
  {...props}
  theme={{
    id: "custom",
    name: "커스텀",
    containerConfig: { maxWidth: "600px" },
  }}
/>
```

> 지정하지 않은 필드는 뷰어 내부 기본값(CSS 변수)으로 대체됩니다. 즉, **바꾸고 싶은 값만** 넣으면 됩니다.

---

## 2. 전체 구조 개요

| 최상위 키              | 필수 | 설명                                     |
| ---------------------- | ---- | ---------------------------------------- |
| `id`                   | ✅   | 테마 식별자                              |
| `name`                 | ✅   | 테마 표시 이름                           |
| `containerConfig`      |      | 문항 전체 컨테이너 레이아웃              |
| `typography`           |      | 폰트·글자 크기·색상 등 전역 타이포그래피 |
| `questionOptionConfig` |      | 선택지(보기) 스타일 (공통 + 상태별)      |
| `submitButtonConfig`   |      | 제출 버튼 스타일 (공통 + 상태별)         |
| `feedbackConfig`       |      | 정답/오답/해설 피드백 스타일             |
| `blankConfig`          |      | 빈칸(밑줄/박스) 스타일                   |
| `questionNumberConfig` |      | 문제 번호 표시 설정                      |

값 형식은 대부분 **CSS 문자열**입니다. (예: `"16px"`, `"#1A1A1A"`, `"2px"`, `"100%"`)

---

## 3. 필드 레퍼런스

### 3.1 `containerConfig` — 컨테이너

| 필드              | 예시        | 설명                    |
| ----------------- | ----------- | ----------------------- |
| `maxWidth`        | `"520px"`   | 문항 컨테이너 최대 너비 |
| `padding`         | `"20px"`    | 컨테이너 안쪽 여백      |
| `backgroundColor` | `"#FFFFFF"` | 컨테이너 배경색         |

### 3.2 `typography` — 타이포그래피

| 필드              | 예시                                                 | 설명                                                                   |
| ----------------- | ---------------------------------------------------- | ---------------------------------------------------------------------- |
| `fontFamily`      | `"https://fonts.googleapis.com/..."`                 | 폰트 CSS URL(Google Fonts 등). 아래 [폰트 프리셋](#5-폰트-프리셋) 참고 |
| `baseFontSize`    | `"16px"`                                             | 기본 글자 크기                                                         |
| `baseFontWeight`  | `"400"`                                              | 기본 글자 굵기                                                         |
| `baseLineHeight`  | `"1.5"`                                              | 기본 줄 간격                                                           |
| `baseTextColor`   | `"#1A1A1A"`                                          | 기본 텍스트 색상                                                       |
| `prompt`          | `{ fontSize, fontWeight }`                           | 발문 텍스트 스타일 (미지정 시 공통값)                                  |
| `exampleStimulus` | `{ fontSize, fontWeight, borderColor, borderWidth }` | 지문·보기 영역 텍스트/테두리 스타일                                    |
| `optionBase`      | `{ fontSize, fontWeight }`                           | 선택지 텍스트 스타일                                                   |

### 3.3 `questionOptionConfig` — 선택지

`common`(기본 스타일)과 `state`(상태별 오버라이드)로 구성됩니다.

**`common`** (`CommonStyleType`)

| 필드                                                         | 예시        | 설명                      |
| ------------------------------------------------------------ | ----------- | ------------------------- |
| `padding`                                                    | `"16px"`    | 선택지 안쪽 여백          |
| `borderWidth`                                                | `"2px"`     | 테두리 두께               |
| `borderRadius`                                               | `"8px"`     | 테두리 둥글기             |
| `backgroundColor`                                            | `"#FFFFFF"` | 배경색                    |
| `borderColor`                                                | `"#E5E7EB"` | 테두리 색상               |
| `height` / `width` / `fontSize` / `fontWeight` / `textColor` |             | 선택적으로 추가 지정 가능 |

**`state`** — 각 상태는 `{ backgroundColor?, borderColor?, textColor? }`

| 상태        | 설명           |
| ----------- | -------------- |
| `hover`     | 마우스 오버 시 |
| `selected`  | 선택된 상태    |
| `correct`   | 정답 표시 상태 |
| `incorrect` | 오답 표시 상태 |

### 3.4 `submitButtonConfig` — 제출 버튼

**`common`** (`CommonStyleType`): `height`, `width`, `borderWidth`, `borderRadius`, `backgroundColor`, `borderColor`, `textColor` 등

**`state`** — `{ backgroundColor?, borderColor?, textColor? }`

| 상태       | 설명                   |
| ---------- | ---------------------- |
| `hover`    | 마우스 오버 시         |
| `disabled` | 비활성(제출 불가) 상태 |

### 3.5 `feedbackConfig` — 피드백

정답/오답/해설 피드백 영역의 스타일입니다. `common`과 `state`로 구성됩니다.

**`common`**

| 필드               | 예시                   | 설명                                      |
| ------------------ | ---------------------- | ----------------------------------------- |
| `title`            | `{ fontSize: "20px" }` | 제목 텍스트 스타일                        |
| `description`      | `{ fontSize: "14px" }` | 설명 텍스트 스타일                        |
| `buttonWidth`      | `"100%"`               | 버튼 너비                                 |
| `buttonHeight`     | `"44px"`               | 버튼 높이                                 |
| `correctIconUrl`   | `"data:image/..."`     | 정답 뱃지 아이콘(미지정 시 기본 O 아이콘) |
| `incorrectIconUrl` | `"data:image/..."`     | 오답 뱃지 아이콘(미지정 시 기본 X 아이콘) |

**`state`** — `default` / `correct` / `incorrect` / `explanation`

각 상태(`FeedbackStateType`)에서 사용할 수 있는 필드:

| 필드              | 예시                               | 설명               |
| ----------------- | ---------------------------------- | ------------------ |
| `backgroundColor` | `"#ECFDF5"`                        | 피드백 영역 배경색 |
| `textColor`       | `"#065F46"`                        | 본문 텍스트 색상   |
| `button`          | `{ backgroundColor?, textColor? }` | 피드백 버튼 색상   |
| `title`           | `{ text?, textColor? }`            | 제목 문구/색상     |
| `description`     | `{ text?, textColor? }`            | 설명 문구/색상     |

> `title.text` / `description.text`로 각 상태의 기본 문구(예: "정답입니다!")를 바꿀 수 있습니다.

### 3.6 `blankConfig` — 빈칸

| 필드          | 값                       | 설명                                   |
| ------------- | ------------------------ | -------------------------------------- |
| `style`       | `"underline"` \| `"box"` | 빈칸 형태(밑줄/박스). 기본 `underline` |
| `borderColor` | `"#1A1A1A"`              | 선/테두리 색상                         |
| `borderWidth` | `"1px"`                  | 선 굵기(미지정 시 `1px`)               |

### 3.7 `questionNumberConfig` — 문제 번호

| 필드                                    | 예시                  | 설명               |
| --------------------------------------- | --------------------- | ------------------ |
| `enabled`                               | `true`                | 번호 표시 여부     |
| `digits`                                | `2`                   | 자릿수(0 패딩)     |
| `prefix` / `suffix`                     | `""` / `"."`          | 접두/접미사        |
| `fontSize` / `fontWeight` / `textColor` |                       | 번호 텍스트 스타일 |
| `position`                              | `"top"` \| `"inline"` | 번호 위치          |

---

## 4. JSON 템플릿 (기본 테마)

아래는 `defaultTheme.ts`와 동일한 값을 JSON으로 옮긴 예시입니다.
이 파일을 복사해 값만 바꾸면 커스텀 테마가 됩니다.

```json
{
  "id": "default",
  "name": "기본 테마",
  "containerConfig": {
    "maxWidth": "520px",
    "padding": "20px",
    "backgroundColor": "#FFFFFF"
  },
  "blankConfig": {
    "style": "box",
    "borderColor": "#1A1A1A"
  },
  "typography": {
    "fontFamily": "https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;500;600;700&display=swap",
    "baseFontSize": "16px",
    "baseFontWeight": "400",
    "baseLineHeight": "1.5",
    "baseTextColor": "#1A1A1A"
  },
  "questionOptionConfig": {
    "common": {
      "padding": "16px",
      "borderWidth": "2px",
      "borderRadius": "8px",
      "backgroundColor": "#FFFFFF",
      "borderColor": "#E5E7EB"
    },
    "state": {
      "hover": {
        "borderColor": "#D1D5DB",
        "backgroundColor": "#F3F4F6"
      },
      "selected": {
        "backgroundColor": "#EEF2FF",
        "borderColor": "#6366F1",
        "textColor": "#1A1A1A"
      },
      "correct": {
        "backgroundColor": "#ECFDF5",
        "borderColor": "#10B981",
        "textColor": "#065F46"
      },
      "incorrect": {
        "backgroundColor": "#FEF2F2",
        "borderColor": "#EF4444",
        "textColor": "#991B1B"
      }
    }
  },
  "submitButtonConfig": {
    "common": {
      "height": "56px",
      "width": "100%",
      "borderWidth": "2px",
      "borderRadius": "6px",
      "backgroundColor": "#1F2937",
      "borderColor": "#1F2937",
      "textColor": "#F9FAFB"
    },
    "state": {
      "hover": {
        "backgroundColor": "#374151",
        "borderColor": "#374151",
        "textColor": "#F9FAFB"
      },
      "disabled": {
        "backgroundColor": "#F3F4F6",
        "borderColor": "#E5E7EB",
        "textColor": "#9CA3AF"
      }
    }
  },
  "feedbackConfig": {
    "common": {
      "title": { "fontSize": "20px" },
      "description": { "fontSize": "14px" },
      "buttonWidth": "100%",
      "buttonHeight": "44px"
    },
    "state": {
      "default": {
        "button": { "backgroundColor": "#606071" }
      },
      "correct": {
        "backgroundColor": "#ECFDF5",
        "textColor": "#065F46",
        "title": { "text": "정답입니다!", "textColor": "#1A1A1A" },
        "description": { "text": "정답입니다!", "textColor": "#1A1A1A" },
        "button": { "textColor": "#FFFFFF", "backgroundColor": "#10B981" }
      },
      "incorrect": {
        "backgroundColor": "#FEF2F2",
        "textColor": "#991B1B",
        "title": { "text": "다시 생각해보세요.", "textColor": "#1A1A1A" },
        "description": { "textColor": "#1A1A1A" },
        "button": { "textColor": "#FFFFFF", "backgroundColor": "#EF4444" }
      },
      "explanation": {
        "backgroundColor": "#F3F4F6",
        "textColor": "#1A1A1A",
        "title": { "text": "풀이", "textColor": "#1A1A1A" },
        "description": { "textColor": "#1A1A1A" },
        "button": { "textColor": "#ffffff", "backgroundColor": "#919397" }
      }
    }
  }
}
```

### 최소 예시 (필수 필드 + 원하는 항목만)

```json
{
  "id": "my-theme",
  "name": "우리 브랜드 테마",
  "typography": {
    "baseTextColor": "#111827"
  },
  "submitButtonConfig": {
    "common": { "backgroundColor": "#2563EB", "borderColor": "#2563EB" }
  }
}
```

---

## 5. 폰트 프리셋

`typography.fontFamily`에는 폰트 CSS URL을 넣습니다. 자주 쓰는 값(내장 프리셋):

| 프리셋 키          | 폰트             | URL                                                                                        |
| ------------------ | ---------------- | ------------------------------------------------------------------------------------------ |
| `noto-sans-kr`     | Noto Sans KR     | `https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;500;600;700&display=swap`  |
| `noto-serif-kr`    | Noto Serif KR    | `https://fonts.googleapis.com/css2?family=Noto+Serif+KR:wght@400;500;600;700&display=swap` |
| `ibm-plex-sans-kr` | IBM Plex Sans KR | `https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+KR:wght@400;500;600&display=swap`  |
| `nanum-gothic`     | Nanum Gothic     | `https://fonts.googleapis.com/css2?family=Nanum+Gothic:wght@400;700&display=swap`          |
| `nanum-myeongjo`   | Nanum Myeongjo   | `https://fonts.googleapis.com/css2?family=Nanum+Myeongjo:wght@400;700&display=swap`        |
| `jua`              | Jua              | `https://fonts.googleapis.com/css2?family=Jua&display=swap`                                |
| `do-hyeon`         | Do Hyeon         | `https://fonts.googleapis.com/css2?family=Do+Hyeon&display=swap`                           |

> 폰트는 뷰어가 `<link>` 태그로 자동 로드합니다. 사내/커스텀 폰트도 CSS URL만 있으면 동일하게 사용할 수 있습니다.

---

## 6. 참고

- 타입 원본: `src/types/theme.ts` (`Theme` 인터페이스)
- 기본 테마: `src/themes/defaultTheme.ts`
- CSS 변수 매핑: `getThemeCSSVariables()` (`src/utils/themeToCSS.ts`)
- 값을 생략하면 기본 CSS 변수로 대체되므로, **커스텀 테마는 바꿀 값만 지정**하는 것을 권장합니다.
