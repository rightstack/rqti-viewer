import { useEffect, useMemo, useRef, useState } from "react";
import {
  Question,
  SAMPLE_ITEMS,
  toQuestionProps,
  type SampleItem,
  type QuestionItem,
  type QuestionItemProps,
} from "@rightstack/rqti-viewer";
import { LOCAL_ITEMS, LOCAL_SAMPLE_ITEMS } from "./localItems";

/** API 문항 + 로컬(XML 직접 주입) 문항 통합 목록 */
const NAV_ITEMS: readonly SampleItem[] = [
  ...SAMPLE_ITEMS,
  ...LOCAL_SAMPLE_ITEMS,
];

const QMS_API_TOKEN = "1786114799~Eg4k3QFE";
const DESIGN_WIDTH = 720;

function detailUrl(qtiIdentifier: string) {
  return `/qms-api/api/v3/viewer/preview/${qtiIdentifier}`;
}

type Status = "idle" | "loading" | "error" | "ready";
type Sizing = "responsive" | "fixed";
type Stroke = Array<{ x: number; y: number }>;

/**
 * designWidth 좌표계 위에서 동작하는 데모용 화이트보드.
 * clientX/Y를 현재 scale(rect.width / DESIGN_WIDTH)로 역변환해 designWidth 좌표로
 * 저장하므로, 뷰어 폭이 달라져도 필기 위치가 항상 정합된다.
 */
function Whiteboard({
  strokes,
  onChange,
  enabled,
}: {
  strokes: Stroke[];
  onChange: (strokes: Stroke[]) => void;
  enabled: boolean;
}) {
  const svgRef = useRef<SVGSVGElement>(null);
  const drawingRef = useRef(false);

  const toDesignPoint = (clientX: number, clientY: number) => {
    const svg = svgRef.current;
    if (!svg) return { x: 0, y: 0 };
    const rect = svg.getBoundingClientRect();
    const scale = rect.width / DESIGN_WIDTH;
    return {
      x: (clientX - rect.left) / scale,
      y: (clientY - rect.top) / scale,
    };
  };

  return (
    <svg
      ref={svgRef}
      width="100%"
      height="100%"
      style={{
        position: "absolute",
        inset: 0,
        pointerEvents: enabled ? "auto" : "none",
        cursor: enabled ? "crosshair" : "default",
        touchAction: "none",
      }}
      onPointerDown={(e) => {
        if (!enabled) return;
        (e.target as Element).setPointerCapture(e.pointerId);
        drawingRef.current = true;
        onChange([...strokes, [toDesignPoint(e.clientX, e.clientY)]]);
      }}
      onPointerMove={(e) => {
        if (!enabled || !drawingRef.current) return;
        const next = strokes.slice();
        const last = next[next.length - 1];
        next[next.length - 1] = [...last, toDesignPoint(e.clientX, e.clientY)];
        onChange(next);
      }}
      onPointerUp={() => {
        drawingRef.current = false;
      }}
    >
      {strokes.map((stroke, i) => (
        <polyline
          key={i}
          points={stroke.map((p) => `${p.x},${p.y}`).join(" ")}
          fill="none"
          stroke="#e11d48"
          strokeWidth={3}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ))}
    </svg>
  );
}

const STORAGE_KEY = "rqti-playground-annotations";

export default function App() {
  const [selected, setSelected] = useState<SampleItem>(SAMPLE_ITEMS[0]);
  const [item, setItem] = useState<QuestionItem | null>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);
  const [sizing, setSizing] = useState<Sizing>("fixed");
  const [drawing, setDrawing] = useState(true);
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  // 문항 컨테이너 가용 폭(px). 슬라이더로 좁혀 고정폭 scale 축소 / 반응형 재배치를 시연한다.
  const [previewWidth, setPreviewWidth] = useState(900);

  const saveAnnotations = () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        qtiIdentifier: selected.qtiIdentifier,
        designWidth: DESIGN_WIDTH,
        strokes,
      }),
    );
  };

  const loadAnnotations = () => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw) as { strokes?: Stroke[] };
      if (Array.isArray(parsed.strokes)) setStrokes(parsed.strokes);
    } catch {
      /* ignore */
    }
  };

  useEffect(() => {
    const controller = new AbortController();
    setStatus("loading");
    setError(null);
    setItem(null);

    // 로컬(XML 직접 주입) 문항은 API 호출 없이 바로 렌더
    const local = LOCAL_ITEMS[selected.qtiIdentifier];
    if (local) {
      setItem(local);
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

          {sizing === "fixed" && (
            <>
              <h2 style={styles.stateTitle}>화이트보드 필기</h2>
              <label style={styles.checkboxRow}>
                <input
                  type="checkbox"
                  checked={drawing}
                  onChange={(e) => setDrawing(e.target.checked)}
                />
                필기 모드 (드래그해서 그리기)
              </label>
              <div style={styles.toggleRow}>
                <button
                  type="button"
                  style={styles.toggleBtn}
                  onClick={saveAnnotations}
                >
                  저장
                </button>
                <button
                  type="button"
                  style={styles.toggleBtn}
                  onClick={loadAnnotations}
                >
                  불러오기
                </button>
                <button
                  type="button"
                  style={styles.toggleBtn}
                  onClick={() => setStrokes([])}
                >
                  지우기
                </button>
              </div>
              <p style={styles.hint}>
                브라우저 창 폭을 바꿔도 필기 위치가 문항과 계속 정합됩니다.
              </p>
            </>
          )}
        </section>

        {/* <section style={styles.state}>
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
        </section> */}
      </aside>

      <main style={styles.main}>
        <div style={{ ...styles.card, maxWidth: previewWidth }}>
          {/* {status === "loading" && (
            <p style={styles.statusText}>API 불러오는 중…</p>
          )}
          {status === "error" && (
            <p style={styles.statusText}>API 오류: {error}</p>
          )} */}
          {status === "ready" && props && (
            <Question
              key={props.itemKey}
              theme="daldal"
              mode="practice"
              {...props}
              sizing={sizing}
              designWidth={DESIGN_WIDTH}
              annotationOverlay={
                sizing === "fixed" ? (
                  <Whiteboard
                    strokes={strokes}
                    onChange={setStrokes}
                    enabled={drawing}
                  />
                ) : undefined
              }
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
