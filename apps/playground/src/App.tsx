import { useEffect, useMemo, useState } from "react";
import {
  Question,
  SAMPLE_ITEMS,
  toQuestionProps,
  type SampleItem,
  type QuestionItem,
} from "@rightstack/rqti-viewer";

const DETAIL_TOKEN = "1786114799~Eg4k3QFE";

function detailUrl(qtiIdentifier: string) {
  return `/qms-api/api/v3/viewer/preview/${qtiIdentifier}?t=${encodeURIComponent(
    DETAIL_TOKEN,
  )}`;
}

export default function App() {
  const [selected, setSelected] = useState<SampleItem>(SAMPLE_ITEMS[0]);
  const [apiItem, setApiItem] = useState<QuestionItem | null>(null);
  const [apiStatus, setApiStatus] = useState<
    "idle" | "loading" | "error" | "ready"
  >("idle");
  const [apiError, setApiError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    setApiStatus("loading");
    setApiError(null);
    setApiItem(null);

    fetch(detailUrl(selected.qtiIdentifier), { signal: controller.signal })
      .then(async (res) => {
        if (!res.ok) {
          throw new Error(`detail API ${res.status}: ${await res.text()}`);
        }
        return res.json() as Promise<QuestionItem>;
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
  }, [selected.qtiIdentifier]);

  const questionProps = useMemo(
    () => (apiItem ? toQuestionProps(apiItem) : null),
    [apiItem],
  );

  return (
    <div style={styles.page}>
      <aside style={styles.sidebar}>
        <h1 style={styles.title}>@rightstack/rqti-viewer</h1>
        <p style={styles.subtitle}>유형별 상세 API · mode=preview</p>

        <label style={styles.selectLabel}>
          문항 유형
          <select
            value={selected.qtiIdentifier}
            onChange={(e) => {
              const next = SAMPLE_ITEMS.find(
                (item) => item.qtiIdentifier === e.target.value,
              );
              if (next) setSelected(next);
            }}
            style={styles.select}
          >
            {SAMPLE_ITEMS.map((item) => (
              <option key={item.qtiIdentifier} value={item.qtiIdentifier}>
                {item.label}
              </option>
            ))}
          </select>
        </label>

        <nav style={styles.nav} aria-label="문항 유형">
          {SAMPLE_ITEMS.map((item) => {
            const active = item.qtiIdentifier === selected.qtiIdentifier;
            return (
              <button
                key={item.qtiIdentifier}
                type="button"
                onClick={() => setSelected(item)}
                style={{
                  ...styles.navItem,
                  ...(active ? styles.navItemActive : null),
                }}
              >
                <span>{item.label}</span>
                <span style={styles.navId}>{item.qtiIdentifier}</span>
              </button>
            );
          })}
        </nav>

        <section style={styles.state}>
          <h2 style={styles.stateTitle}>선택</h2>
          <pre style={styles.pre}>
            {JSON.stringify(
              {
                type: selected.type,
                qtiIdentifier: selected.qtiIdentifier,
                status: apiStatus,
                title: apiItem?.title ?? null,
              },
              null,
              2,
            )}
          </pre>
          {apiStatus === "error" && (
            <>
              <h2 style={styles.stateTitle}>오류</h2>
              <pre style={styles.pre}>{apiError}</pre>
            </>
          )}
        </section>
      </aside>

      <main style={styles.main}>
        <div style={styles.card}>
          {apiStatus === "loading" && (
            <p style={styles.statusText}>API 불러오는 중…</p>
          )}
          {apiStatus === "error" && (
            <p style={styles.statusText}>API 오류: {apiError}</p>
          )}
          {apiStatus === "ready" && questionProps && (
            <Question
              key={questionProps.itemKey}
              theme="daldal"
              showInlineFeedback={false}
              {...questionProps}
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
  selectLabel: {
    display: "flex",
    flexDirection: "column",
    gap: 6,
    marginTop: 20,
    fontSize: 12,
    color: "#666",
  },
  select: {
    padding: "8px 10px",
    borderRadius: 8,
    border: "1px solid #ddd",
    fontSize: 14,
    background: "#fff",
  },
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
