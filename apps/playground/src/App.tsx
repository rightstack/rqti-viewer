import { useEffect, useMemo, useState } from "react";
import {
  DEFAULT_THEME,
  ITEM_TYPE,
  Question,
  SAMPLE_ITEMS,
  toQuestionProps,
  type SampleItem,
  type QuestionItem,
  type QuestionItemProps,
  type ResponseValueMap,
  type Theme,
} from "@rightstack/rqti-viewer";
import { LOCAL_ITEMS, LOCAL_SAMPLE_ITEMS } from "./localItems";

/** API 문항 + 로컬(XML 직접 주입) 문항 통합 목록 */
const NAV_ITEMS: readonly SampleItem[] = [
  ...SAMPLE_ITEMS,
  ...LOCAL_SAMPLE_ITEMS,
];

const QMS_API_TOKEN = "1786114799~Eg4k3QFE";
const DESIGN_WIDTH = 1000;

const DEMO_PASSAGE_HTML = `
<p><strong>다음 글을 읽고 물음에 답하시오.</strong></p>
<p>헨젤과 그레텔은 숲속에서 길을 잃었다. 헨젤은 처음에 조약돌을 떨어뜨려 집을 찾아왔지만, 두 번째에는 빵 조각을 떨어뜨렸다. 숲속의 새들이 빵을 모두 먹어 버려 두 아이는 집을 찾지 못했다.</p>
<p>한참을 헤매던 남매는 과자로 만든 집을 발견했다. 배가 고팠던 아이들은 지붕과 창문을 깨물어 먹기 시작했다.</p>
`;

/** 1000px 저작 기준 폭을 전부 사용하는 뷰어 테마 예시. 문항 번호는 플랫폼이 그리는 전제. */
const FULL_WIDTH_THEME: Theme = {
  ...DEFAULT_THEME,
  id: "full-width",
  name: "전체 너비",
  containerConfig: {
    ...DEFAULT_THEME.containerConfig,
    maxWidth: "100%",
    padding: "0px",
    backgroundColor: "#FFFFFF",
  },
  questionNumberConfig: {
    ...DEFAULT_THEME.questionNumberConfig,
    enabled: false,
  },
};

function detailUrl(qtiIdentifier: string) {
  return `/qms-api/api/v3/viewer/preview/${qtiIdentifier}`;
}

type Status = "idle" | "loading" | "error" | "ready";
type Sizing = "responsive" | "fixed";

export default function App() {
  const [selected, setSelected] = useState<SampleItem>(SAMPLE_ITEMS[0]);
  const [item, setItem] = useState<QuestionItem | null>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);
  const [sizing, setSizing] = useState<Sizing>("fixed");
  const [showInlineFeedback, setShowInlineFeedback] = useState(true);
  const [mode, setMode] = useState<"practice" | "preview">("practice");
  const [lastSubmit, setLastSubmit] = useState<ResponseValueMap | null>(null);
  const [previewWidth, setPreviewWidth] = useState(1000);
  const [demoPassage, setDemoPassage] = useState(false);
  const [forceIsMath, setForceIsMath] = useState(false);
  const isTextEntry =
    selected.type === ITEM_TYPE.SRQ || selected.type === ITEM_TYPE.CLOZE;

  useEffect(() => {
    const controller = new AbortController();
    setStatus("loading");
    setError(null);
    setItem(null);
    setLastSubmit(null);
    setForceIsMath(false);

    // 로컬(XML 직접 주입) 문항은 API 호출 없이 바로 렌더
    const local = LOCAL_ITEMS[selected.qtiIdentifier];
    if (local) {
      setItem(local);
      setForceIsMath(local.isMath === true);
      setStatus("ready");
      return () => controller.abort();
    }

    fetch(detailUrl(selected.qtiIdentifier), {
      signal: controller.signal,
      headers: {
        Authorization: `Bearer ${QMS_API_TOKEN}`,
      },
    })
      .then(async (res) => {
        if (!res.ok) {
          throw new Error(`detail API ${res.status}: ${await res.text()}`);
        }
        return res.json() as Promise<QuestionItem>;
      })
      .then((data) => {
        setItem(data);
        setForceIsMath(data.isMath === true);
        setStatus("ready");
      })
      .catch((err: unknown) => {
        if (controller.signal.aborted) return;
        setStatus("error");
        setError(err instanceof Error ? err.message : String(err));
      });

    return () => controller.abort();
  }, [selected.qtiIdentifier]);

  const props = useMemo<QuestionItemProps | null>(
    () => (item ? toQuestionProps(item) : null),
    [item],
  );

  return (
    <div style={styles.page}>
      <aside style={styles.sidebar}>
        <h1 style={styles.title}>@rightstack/rqti-viewer</h1>
        <p style={styles.subtitle}>문항 단독 · onSubmit / preview 복원</p>

        <nav style={styles.nav} aria-label="문항 유형">
          {NAV_ITEMS.map((s) => {
            const active = s.qtiIdentifier === selected.qtiIdentifier;
            return (
              <button
                key={s.qtiIdentifier}
                type="button"
                onClick={() => setSelected(s)}
                style={{
                  ...styles.navItem,
                  ...(active ? styles.navItemActive : null),
                }}
              >
                <span>{s.label}</span>
                <span style={styles.navId}>{s.qtiIdentifier}</span>
              </button>
            );
          })}
        </nav>

        <section style={styles.state}>
          <h2 style={styles.stateTitle}>모드</h2>
          <div style={styles.toggleRow}>
            {(["practice", "preview"] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMode(m)}
                style={{
                  ...styles.toggleBtn,
                  ...(mode === m ? styles.toggleBtnActive : null),
                }}
              >
                {m === "practice" ? "practice (제출)" : "preview (복원)"}
              </button>
            ))}
          </div>
          <p style={styles.hint}>
            preview는 마지막 onSubmit 응답을 선택·입력으로 표시합니다. 정오 색은
            그리지 않습니다.
          </p>

          <h2 style={styles.stateTitle}>사이징 모드</h2>
          <div style={styles.toggleRow}>
            {(["responsive", "fixed"] as const).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setSizing(s)}
                style={{
                  ...styles.toggleBtn,
                  ...(sizing === s ? styles.toggleBtnActive : null),
                }}
              >
                {s === "fixed" ? `고정폭 (${DESIGN_WIDTH}px)` : "반응형"}
              </button>
            ))}
          </div>

          <label style={styles.sliderRow}>
            <span style={styles.sliderLabel}>
              컨테이너 폭<b style={styles.sliderValue}>{previewWidth}px</b>
            </span>
            <input
              type="range"
              min={320}
              max={1000}
              step={10}
              value={previewWidth}
              onChange={(e) => setPreviewWidth(Number(e.target.value))}
            />
          </label>
          <p style={styles.hint}>
            {sizing === "fixed"
              ? `폭을 ${DESIGN_WIDTH}px 아래로 줄이면 문항이 scale로 축소됩니다.`
              : "폭을 줄이면 UI가 반응형으로 재배치됩니다."}
          </p>

          {isTextEntry && (
            <>
              <h2 style={styles.stateTitle}>입력형 isMath</h2>
              <label style={styles.checkboxRow}>
                <input
                  type="checkbox"
                  checked={forceIsMath}
                  onChange={(e) => {
                    setForceIsMath(e.target.checked);
                    setLastSubmit(null);
                  }}
                />
                수식 칸 (키보드 아이콘)
              </label>
              <p style={styles.hint}>
                API `isMath`가 없어도 토글로 일반/수식 칸을 확인합니다. 제출은
                항상 {"{ value, isMath }"}.
              </p>
            </>
          )}

          <h2 style={styles.stateTitle}>연결지문</h2>
          <label style={styles.checkboxRow}>
            <input
              type="checkbox"
              checked={demoPassage}
              onChange={(e) => setDemoPassage(e.target.checked)}
            />
            데모 지문 표시 (`passage` prop)
          </label>
          <p style={styles.hint}>지문은 문항 왼쪽에 가로로 고정됩니다.</p>

          <h2 style={styles.stateTitle}>정답·피드백</h2>
          <label style={styles.checkboxRow}>
            <input
              type="checkbox"
              checked={showInlineFeedback}
              onChange={(e) => setShowInlineFeedback(e.target.checked)}
            />
            인라인 피드백 표시 (preview 정답·해설)
          </label>

          <h2 style={styles.stateTitle}>마지막 onSubmit</h2>
          <pre style={styles.pre}>
            {lastSubmit
              ? JSON.stringify(lastSubmit, null, 2)
              : "아직 제출 없음"}
          </pre>
          <p style={styles.hint}>
            응답값만 전달됩니다. 정오 채점은 호스트 백엔드 → QMS 범위입니다.
          </p>
        </section>
      </aside>

      <main style={styles.main}>
        <div style={{ ...styles.card, maxWidth: previewWidth }}>
          {status === "error" && (
            <p style={styles.statusText}>API 오류: {error}</p>
          )}
          {status === "ready" && props && (
            <Question
              key={`${props.itemKey}-${
                isTextEntry && forceIsMath ? "math" : "text"
              }`}
              theme={FULL_WIDTH_THEME}
              mode={mode}
              {...props}
              isMath={isTextEntry ? forceIsMath : props.isMath}
              showFeedback={false}
              showInlineFeedback={showInlineFeedback}
              responses={
                mode === "preview" ? lastSubmit ?? undefined : undefined
              }
              passage={demoPassage ? DEMO_PASSAGE_HTML : props.passage}
              onSubmit={setLastSubmit}
              sizing={sizing}
              designWidth={DESIGN_WIDTH}
            />
          )}
        </div>
      </main>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    display: "flex",
    minHeight: "100vh",
    fontFamily: "system-ui, sans-serif",
  },
  sidebar: {
    width: 320,
    flexShrink: 0,
    borderRight: "1px solid #eee",
    padding: 20,
    background: "#fafafa",
    overflowY: "auto",
  },
  title: { fontSize: 18, fontWeight: 700, margin: 0 },
  subtitle: { fontSize: 12, color: "#888", marginTop: 2 },
  nav: { display: "flex", flexDirection: "column", gap: 6, marginTop: 16 },
  navItem: {
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-start",
    gap: 2,
    textAlign: "left",
    padding: "8px 12px",
    borderRadius: 8,
    border: "1px solid transparent",
    background: "transparent",
    cursor: "pointer",
    fontSize: 14,
  },
  navItemActive: {
    background: "#fff",
    border: "1px solid #ddd",
    fontWeight: 600,
  },
  navId: { fontSize: 11, color: "#999", fontWeight: 400 },
  toggleRow: { display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 8 },
  toggleBtn: {
    flex: "1 1 auto",
    padding: "6px 10px",
    borderRadius: 8,
    border: "1px solid #ddd",
    background: "#fff",
    cursor: "pointer",
    fontSize: 13,
  },
  toggleBtnActive: {
    background: "#1f2937",
    borderColor: "#1f2937",
    color: "#fff",
    fontWeight: 600,
  },
  checkboxRow: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    fontSize: 13,
    margin: "4px 0 10px",
  },
  hint: { fontSize: 11, color: "#999", marginTop: 4, lineHeight: 1.5 },
  sliderRow: {
    display: "flex",
    flexDirection: "column",
    gap: 6,
    marginTop: 12,
  },
  sliderLabel: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "baseline",
    fontSize: 13,
    color: "#444",
  },
  sliderValue: { fontSize: 13, fontWeight: 700, color: "#1f2937" },
  state: { marginTop: 24 },
  stateTitle: {
    fontSize: 12,
    textTransform: "uppercase",
    color: "#888",
    margin: "12px 0 4px",
  },
  pre: {
    background: "#1e1e1e",
    color: "#d4d4d4",
    padding: 12,
    borderRadius: 8,
    fontSize: 12,
    overflowX: "auto",
    margin: 0,
  },
  statusText: { margin: 0, color: "#666", fontSize: 14 },
  main: {
    flex: 1,
    minWidth: 0,
    padding: 40,
    display: "flex",
    justifyContent: "center",
    alignItems: "flex-start",
  },
  card: {
    width: "100%",
    minWidth: 0,
    // maxWidth: 720,
    // background: "#fff",
    // border: "1px solid #eee",
    // borderRadius: 16,
    // padding: 32,
    // boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
  },
};
