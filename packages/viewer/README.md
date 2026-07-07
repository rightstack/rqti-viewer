# @rightstack/rqti-viewer

QTI 문제(Viewer) 렌더링 라이브러리.

## 설치

프로젝트 루트에 `.npmrc`를 추가한다.

```ini
@rightstack:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=SHARED_READ_ONLY_TOKEN
```

```bash
pnpm add @rightstack/rqti-viewer
# 또는
npm install @rightstack/rqti-viewer
```

## 사용

```tsx
import { Question } from "@rightstack/rqti-viewer";
import "@rightstack/rqti-viewer/styles.css";

export function ItemViewer() {
  return (
    <Question
      data={qtiXml}
      type="MCQ"
      mode="practice"
      onResponse={(responses) => console.log(responses)}
    />
  );
}
```

## 요구사항

- React >= 18
- React DOM >= 18

## 스타일 격리

모든 스타일은 `.rtqi-viewer` root 아래에서만 적용된다. Tailwind preflight는 비활성화되어 host app CSS와 충돌하지 않는다.

## 배포 (maintainer)

GitHub Packages에 publish:

```bash
# publish token 필요 (read:packages 권한 이상)
export NODE_AUTH_TOKEN=YOUR_PUBLISH_TOKEN
pnpm build:viewer
pnpm publish:viewer
```
