import { useEffect, useMemo, useState } from "react";
import {
  Question,
  SAMPLE_ITEMS,
  toQuestionProps,
  type SampleItem,
  type QuestionItem,
  type QuestionItemProps,
} from "@rightstack/rqti-viewer";

const QMS_API_TOKEN = "1786114799~Eg4k3QFE";

function detailUrl(qtiIdentifier: string) {
  return `/qms-api/api/v3/viewer/preview/${qtiIdentifier}`;
}

type Status = "idle" | "loading" | "error" | "ready";

export default function App() {
  const [selected, setSelected] = useState<SampleItem>(SAMPLE_ITEMS[0]);
  const [item, setItem] = useState<QuestionItem | null>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    setStatus("loading");
    setError(null);
    setItem(null);

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
        <p style={styles.subtitle}>상세 API 연동 테스트 · mode=preview</p>

        <nav style={styles.nav} aria-label="문항 유형">
          {SAMPLE_ITEMS.map((s) => {
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
          <h2 style={styles.stateTitle}>상태</h2>
          <pre style={styles.pre}>
            {JSON.stringify(
              {
                type: selected.type,
                qtiIdentifier: selected.qtiIdentifier,
                status,
                title: item?.title ?? null,
              },
              null,
              2,
            )}
          </pre>
          {status === "error" && (
            <>
              <h2 style={styles.stateTitle}>오류</h2>
              <pre style={styles.pre}>{error}</pre>
            </>
          )}
        </section>
      </aside>

      <main style={styles.main}>
        <div style={styles.card}>
          {status === "loading" && (
            <p style={styles.statusText}>API 불러오는 중…</p>
          )}
          {status === "error" && (
            <p style={styles.statusText}>API 오류: {error}</p>
          )}
          {status === "ready" && props && (
            <Question key={props.itemKey} theme="default" {...props} />
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
