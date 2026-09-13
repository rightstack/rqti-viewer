# 입력형 수식 계약 (호스트 / 백엔드)

문항 조회·제출 JSON과 XML `qti-value` 저장 규칙이다. 프론트 사용법보다 **조회/제출 JSON**이 본문이다. 호스트 연동은 [USER_GUIDE.md](./USER_GUIDE.md)를 본다.

## 조회

문항 상세 API에 `isMath?: boolean`을 둔다. 없으면 `false`.

- 에디터(mqti-frontend)가 저작 시 백엔드에 보내는 키와 동일하다.
- QTI XML / `settings`에 넣지 않는다.
- 뷰어는 정답·입력 문자열을 보고 `isMath`를 올리지 않는다.
- CLOZE는 문항 전체 동일. 빈칸별 혼합은 후속.

```ts
isMath?: boolean; // 없으면 false
```

| `isMath` | 칸 | 응답 `value` |
| --- | --- | --- |
| `false` | 일반 `TextEntryInput`. 아이콘 없음 | 평문 |
| `true` | `MathKeyboard`. 아이콘 있음 | LaTeX (키패드/디바이스 동일) |

중등/고등 키캡 `level`은 `isMath`와 다른 축이다. 호스트가 따로 넘긴다.

## 제출 JSON

입력형(SRQ/CLOZE, `qti-text-entry`)은 수식·일반 **모두** `{ value: string, isMath: boolean }`이다. 선택형은 identifier 문자열을 유지한다.

뷰어가 내는 `value`는 `$`로 감싸지 않은 평문/LaTeX다. 이미 `$...$`면 한 번 더 감싸지 않는다.

`isMath`는 **칸 타입**이다. 이번 입력이 수식 키패드인지 디바이스 키보드인지는 보지 않는다.

- 수식 칸(아이콘 있음): 항상 `isMath: true`. 빈 칸·숫자 `"2"`도 `true`.
- 일반 칸(아이콘 없음): 항상 `isMath: false`.
- API에 `isMath`가 없는 기존 문항은 `false`로 제출한다.

`onResponse`도 같은 형태다. preview `responses`에 `onSubmit` 결과를 그대로 넣을 수 있어야 한다.

## XML `qti-value` (기계약)

백엔드가 쓴다. 타입은 계속 `base-type="string"`이다.

- `isMath === true` → `$` + value + `$` (예: `$2$`)
- `isMath === false` → value 그대로 (예: `서울`)
- 빈 수식 칸: JSON `value: ""`. XML은 비우거나 `$$`. 뷰어는 둘 다 빈 LaTeX로 읽는다.

`$...$`는 규격 확장이 아니라 **문자열 내용 약속**이다. QTI 3.0에는 `latex` / `isMath` base-type이 없다. `{ value, isMath }`를 `qti-value` 자리에 객체로 넣거나 record에 `isMath`를 추가하면 규격 위반이다.

## QTI 3.0

text-entry 응답 변수는 다음만 허용한다.

- `cardinality="single"` + `base-type` = `string` | `integer` | `float`
- 또는 `cardinality="record"` + 고정 필드만 (숫자 정밀도용)

`isMath`는 JSON(문항 API·제출) 메타다. XML에는 달러 래핑으로 수식임을 남긴다.

## 방향

- **뷰어 → 백엔드**: `{ value: "2", isMath: true }`. 뷰어는 `$`를 붙이지 않는다.
- **백엔드 → XML**: `isMath`이면 `$` + value + `$`.
- **XML/정답 → 뷰어**: `$2$`를 받으면 unwrap해서 수식 칸에 `"2"`를 넣는다.

## 예시

```ts
// 일반 입력형
{ RESPONSE: { value: "서울", isMath: false } }
// → <qti-value>서울</qti-value>

// 수식 입력형. "2"도 수식
{ RESPONSE: { value: "2", isMath: true } }
// → <qti-value>$2$</qti-value>

// 선택형
{ RESPONSE: "C" }
```

## 호환

- 옛 문자열 제출(`{ RESPONSE: "서울" }`)은 평문(`isMath: false`)으로 **읽기만** 한다.
- 뷰어가 새로 내는 입력형은 항상 객체다.

## 범위 밖

- 중등/고등 키캡 `level`
- CLOZE 빈칸별 `isMath` 혼합
