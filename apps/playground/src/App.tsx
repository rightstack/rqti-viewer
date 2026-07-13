import { useEffect, useMemo, useState } from "react";
import {
  Question,
  type FeedbackItem,
  type ItemsType,
  type QuestionMode,
  type ResponseValue,
  type ResponseValueMap,
} from "@rightstack/rqti-viewer";
import { SAMPLES } from "./samples";

/** preview 모드는 "제출 후 리뷰(정답·해설 표시)" 역할이므로 review로 표기 */
const MODE_OPTIONS: { value: QuestionMode; label: string }[] = [
  { value: "practice", label: "practice" },
  { value: "preview", label: "review" },
];

const API_SAMPLE_ID = "api-preview";
const PREVIEW_QTI_ID = "i_nsc3b1pz3ruordoa";
const PREVIEW_TOKEN = "1786114799~Eg4k3QFE";
const PREVIEW_URL = `/qms-api/api/v3/viewer/preview/${PREVIEW_QTI_ID}?t=${encodeURIComponent(
  PREVIEW_TOKEN,
)}`;

interface PreviewFeedback {
  feedbackType: string;
  feedbackTypeLabel?: string;
  title?: string;
  content: string;
}

interface PreviewResponse {
  qtiIdentifier: string;
  title: string;
  type: ItemsType;
  qtiXml: string;
  correctAnswer?: Record<string, ResponseValue>;
  feedbacks?: PreviewFeedback[];
}

function mapFeedbacks(
  feedbacks?: PreviewFeedback[],
): FeedbackItem[] | undefined {
  if (!feedbacks?.length) return undefined;
  return feedbacks.map((f) => ({
    type: f.feedbackType,
    typeLabel: f.feedbackTypeLabel,
    title: f.title,
    content: f.content,
  }));
}

export default function App() {
  const [selectedId, setSelectedId] = useState(API_SAMPLE_ID);
  const [mode, setMode] = useState<QuestionMode>("practice");
  const [responses, setResponses] = useState<ResponseValueMap>({});
  const [submitted, setSubmitted] = useState<ResponseValueMap | null>(null);

  const [apiItem, setApiItem] = useState<PreviewResponse | null>(null);
  const [apiStatus, setApiStatus] = useState<
    "idle" | "loading" | "error" | "ready"
  >("idle");
  const [apiError, setApiError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    setApiStatus("loading");
    setApiError(null);

    fetch(PREVIEW_URL, { signal: controller.signal })
      .then(async (res) => {
        if (!res.ok) {
          throw new Error(`preview API ${res.status}: ${await res.text()}`);
        }
        return res.json() as Promise<PreviewResponse>;
      })
      .then((data) => {
        setApiItem(data);
        setApiStatus("ready");
      })
      .catch((err: unknown) => {
        if (controller.signal.aborted) return;
        setApiItem(null);
        setApiStatus("error");
        setApiError(err instanceof Error ? err.message : String(err));
      });

    return () => controller.abort();
  }, []);

  const sample = useMemo(
    () => SAMPLES.find((s) => s.id === selectedId) ?? SAMPLES[0],
    [selectedId],
  );

  const isApiSelected = selectedId === API_SAMPLE_ID;

  const questionProps = useMemo(() => {
    if (isApiSelected && apiItem) {
      return {
        id: apiItem.qtiIdentifier,
        data: apiItem.qtiXml,
        type: apiItem.type,
        correctAnswers: apiItem.correctAnswer,
        feedbacks: mapFeedbacks(apiItem.feedbacks),
        solution: undefined as string | undefined,
        passageFeedbacks: undefined as string | undefined,
      };
    }
    return {
      id: sample.id,
      data: sample.data,
      type: sample.type,
      correctAnswers: sample.correctAnswers,
      feedbacks: sample.feedbacks,
      solution: sample.solution,
      passageFeedbacks: sample.passageFeedbacks,
    };
  }, [isApiSelected, apiItem, sample]);

  const handleSelect = (id: string) => {
    setSelectedId(id);
    setResponses({});
    setSubmitted(null);
  };

  return (
    <div style={styles.page}>
      <aside style={styles.sidebar}>
        <h1 style={styles.title}>@rightstack/rqti-viewer</h1>
        <p style={styles.subtitle}>playground</p>

        <nav style={styles.nav}>
          <button
            onClick={() => handleSelect(API_SAMPLE_ID)}
            style={{
              ...styles.navItem,
              ...(isApiSelected ? styles.navItemActive : null),
            }}
          >
            API Preview ({PREVIEW_QTI_ID})
          </button>
          {SAMPLES.map((s) => (
            <button
              key={s.id}
              onClick={() => handleSelect(s.id)}
              style={{
                ...styles.navItem,
                ...(s.id === selectedId ? styles.navItemActive : null),
              }}
            >
              {s.label}
            </button>
          ))}
        </nav>

        <div style={styles.modes}>
          {MODE_OPTIONS.map((m) => (
            <label key={m.value} style={styles.modeLabel}>
              <input
                type="radio"
                name="mode"
                checked={mode === m.value}
                onChange={() => setMode(m.value)}
              />
              {m.label}
            </label>
          ))}
        </div>

        <section style={styles.state}>
          <h2 style={styles.stateTitle}>현재 응답</h2>
          <pre style={styles.pre}>{JSON.stringify(responses, null, 2)}</pre>
          {submitted && (
            <>
              <h2 style={styles.stateTitle}>제출됨</h2>
              <pre style={styles.pre}>{JSON.stringify(submitted, null, 2)}</pre>
            </>
          )}
          {isApiSelected && (
            <>
              <h2 style={styles.stateTitle}>API</h2>
              <pre style={styles.pre}>
                {apiStatus === "loading" && "loading…"}
                {apiStatus === "error" && apiError}
                {apiStatus === "ready" && apiItem?.title}
              </pre>
            </>
          )}
        </section>
      </aside>

      <main style={styles.main}>
        <div style={styles.card}>
          {isApiSelected && apiStatus === "loading" && (
            <p style={styles.statusText}>API 불러오는 중…</p>
          )}
          {isApiSelected && apiStatus === "error" && (
            <p style={styles.statusText}>API 오류: {apiError}</p>
          )}
          {(!isApiSelected || apiStatus === "ready") && (
            <Question
              key={`${questionProps.id}-${mode}`}
              // theme="daldal"
              data={questionProps.data}
              type={questionProps.type}
              // mode={mode}
              correctAnswers={questionProps.correctAnswers}
              // showFeedback
              solution={questionProps.solution}
              feedbacks={questionProps.feedbacks}
              passageFeedbacks={questionProps.passageFeedbacks}
              onResponse={setResponses}
              onSubmit={setSubmitted}
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
    width: 300,
    flexShrink: 0,
    borderRight: "1px solid #eee",
    padding: 20,
    background: "#fafafa",
    overflowY: "auto",
  },
  title: { fontSize: 18, fontWeight: 700, margin: 0 },
  subtitle: { fontSize: 12, color: "#888", marginTop: 2 },
  nav: { display: "flex", flexDirection: "column", gap: 6, marginTop: 20 },
  navItem: {
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
  modes: { display: "flex", gap: 16, marginTop: 20 },
  modeLabel: { display: "flex", alignItems: "center", gap: 4, fontSize: 13 },
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
    padding: 40,
    display: "flex",
    justifyContent: "center",
    alignItems: "flex-start",
  },
  card: {
    width: "100%",
    maxWidth: 720,
    background: "#fff",
    border: "1px solid #eee",
    borderRadius: 16,
    padding: 32,
    boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
  },
};
