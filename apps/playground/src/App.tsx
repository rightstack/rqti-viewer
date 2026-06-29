import { useMemo, useState } from "react";
import { Question, type QuestionMode, type ResponseValueMap } from "@rtqi/viewer";
import { SAMPLES } from "./samples";

export default function App() {
  const [selectedId, setSelectedId] = useState(SAMPLES[0].id);
  const [mode, setMode] = useState<QuestionMode>("practice");
  const [responses, setResponses] = useState<ResponseValueMap>({});
  const [submitted, setSubmitted] = useState<ResponseValueMap | null>(null);

  const sample = useMemo(
    () => SAMPLES.find((s) => s.id === selectedId) ?? SAMPLES[0],
    [selectedId]
  );

  const handleSelect = (id: string) => {
    setSelectedId(id);
    setResponses({});
    setSubmitted(null);
  };

  return (
    <div style={styles.page}>
      <aside style={styles.sidebar}>
        <h1 style={styles.title}>@rtqi/viewer</h1>
        <p style={styles.subtitle}>playground</p>

        <nav style={styles.nav}>
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
          {(["practice", "preview"] as QuestionMode[]).map((m) => (
            <label key={m} style={styles.modeLabel}>
              <input
                type="radio"
                name="mode"
                checked={mode === m}
                onChange={() => setMode(m)}
              />
              {m}
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
        </section>
      </aside>

      <main style={styles.main}>
        <div style={styles.card}>
          <Question
            key={`${sample.id}-${mode}`}
            data={sample.data}
            type={sample.type}
            mode={mode}
            correctAnswers={sample.correctAnswers}
            onResponse={setResponses}
            onSubmit={setSubmitted}
          />
        </div>
      </main>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: { display: "flex", minHeight: "100vh", fontFamily: "system-ui, sans-serif" },
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
  navItemActive: { background: "#fff", border: "1px solid #ddd", fontWeight: 600 },
  modes: { display: "flex", gap: 16, marginTop: 20 },
  modeLabel: { display: "flex", alignItems: "center", gap: 4, fontSize: 13 },
  state: { marginTop: 24 },
  stateTitle: { fontSize: 12, textTransform: "uppercase", color: "#888", margin: "12px 0 4px" },
  pre: {
    background: "#1e1e1e",
    color: "#d4d4d4",
    padding: 12,
    borderRadius: 8,
    fontSize: 12,
    overflowX: "auto",
    margin: 0,
  },
  main: { flex: 1, padding: 40, display: "flex", justifyContent: "center", alignItems: "flex-start" },
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
