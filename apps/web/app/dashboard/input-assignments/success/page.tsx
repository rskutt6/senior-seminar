"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";

type Assignment = {
  id: number;
  title: string | null;
  description: string;
  weight: number | null;
  dueAt: string | null;
  userId: number;
  courseId: number | null;
};

type ChecklistItem = {
  step: string;
  minutes: number;
};

type ChecklistResponse = {
  overview: string;
  totalMinutes: number;
  checklist: ChecklistItem[];
};

export default function InputAssignmentSuccessPage() {
  const params = useSearchParams();
  const router = useRouter();

  const id = params.get("id");
  const userId = params.get("userId");

  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [loadError, setLoadError] = useState("");
  const [checklistError, setChecklistError] = useState("");
  const [courseLabel, setCourseLabel] = useState("");
  const [summary, setSummary] = useState("");
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [checklistLoading, setChecklistLoading] = useState(false);
  const [checklist, setChecklist] = useState<ChecklistResponse | null>(null);
  const [checkedSteps, setCheckedSteps] = useState<number[]>([]);

  const prettyDue = useMemo(() => {
    if (!assignment?.dueAt) return "No due date";
    const d = new Date(assignment.dueAt);
    return isNaN(d.getTime()) ? "No due date" : d.toLocaleString();
  }, [assignment?.dueAt]);

  const checklistProgress = useMemo(() => {
    if (!checklist || checklist.checklist.length === 0) return "";
    return `${checkedSteps.length}/${checklist.checklist.length} completed`;
  }, [checkedSteps, checklist]);

  useEffect(() => {
    async function load() {
      if (!id || !userId) {
        setLoadError("Missing assignment id.");
        return;
      }

      const res = await fetch(`http://localhost:4000/assignments/${id}?userId=${userId}`, {
        cache: "no-store",
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setLoadError(data.message || "Failed to load assignment");
        return;
      }

      const data = (await res.json()) as Assignment | null;
      if (!data) {
        setLoadError("Assignment not found");
        return;
      }

      setAssignment(data);
    }

    load();
  }, [id, userId]);

  useEffect(() => {
    async function summarize() {
      if (!assignment?.description) return;

      setSummaryLoading(true);
      try {
        const res = await fetch("/api/summarize-assignment", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: assignment.title ?? "",
            description: assignment.description,
          }),
        });

        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.message || "Failed to summarize");

        setSummary(data.summary || "");
      } catch {
        setSummary("");
      } finally {
        setSummaryLoading(false);
      }
    }

    summarize();
  }, [assignment?.title, assignment?.description]);

  useEffect(() => {
    async function loadCourseLabel() {
      if (!assignment?.courseId || !assignment?.userId) return;

      try {
        const res = await fetch(
          `http://localhost:4000/courses?userId=${assignment.userId}`,
          { cache: "no-store" }
        );

        if (!res.ok) return;

        const courses = await res.json();
        const course = courses.find((c: any) => c.id === assignment.courseId);

        setCourseLabel(course?.name ?? `Course #${assignment.courseId}`);
      } catch {
        // ignore
      }
    }

    loadCourseLabel();
  }, [assignment?.courseId, assignment?.userId]);

  async function handleGenerateChecklist() {
    if (!assignment?.description?.trim()) return;

    setChecklistLoading(true);
    setChecklistError("");
    setChecklist(null);
    setCheckedSteps([]);

    try {
      const res = await fetch("/api/generate-checklist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: assignment.title ?? "",
          description: assignment.description,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.error || data.message || "Failed to generate checklist");
      }

      setChecklist(data);
    } catch (e: any) {
      setChecklistError(e.message || "Failed to generate checklist");
    } finally {
      setChecklistLoading(false);
    }
  }

  function toggleStep(index: number) {
    setCheckedSteps((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]
    );
  }

  return (
    <main style={styles.page}>
      <div style={styles.shell}>
        <div style={styles.card}>
          <h1 style={styles.title}>Assignment created ✅</h1>

          {loadError && <div style={styles.error}>{loadError}</div>}

          {assignment && (
            <div style={styles.grid}>
              <div style={styles.block}>
                <div style={styles.label}>Assignment title</div>
                <div style={styles.value}>{assignment.title?.trim() || "Not set"}</div>
              </div>

              <div style={styles.block}>
                <div style={styles.label}>Class</div>
                <div style={styles.value}>
                  {assignment.courseId
                    ? courseLabel || `Course #${assignment.courseId}`
                    : "No course selected"}
                </div>
              </div>

              <div style={styles.block}>
                <div style={styles.label}>Due</div>
                <div style={styles.value}>{prettyDue}</div>
              </div>

              <div style={styles.block}>
                <div style={styles.label}>Weight</div>
                <div style={styles.value}>
                  {assignment.weight === null || assignment.weight === undefined
                    ? "Not set"
                    : `${assignment.weight}%`}
                </div>
              </div>

              <div style={{ ...styles.block, gridColumn: "1 / -1" }}>
                <div style={styles.label}>Details</div>
                <div style={styles.valueBox}>{assignment.description}</div>
              </div>

              <div style={{ ...styles.block, gridColumn: "1 / -1" }}>
                <div style={styles.label}>AI summary</div>
                <div style={styles.valueBox}>
                  {summaryLoading ? "Summarizing…" : summary || "No summary"}
                </div>
              </div>

              <div style={{ ...styles.block, gridColumn: "1 / -1" }}>
                <div style={styles.checklistHeader}>
                  <div>
                    <div style={styles.label}>Checklist</div>
                    <div style={styles.smallText}>
                      Break the assignment into steps with estimated times.
                    </div>
                  </div>

                  <button
                    style={checklistLoading ? styles.disabledBtn : styles.primaryBtn}
                    onClick={handleGenerateChecklist}
                    disabled={checklistLoading}
                  >
                    {checklistLoading ? "Generating…" : "Generate checklist"}
                  </button>
                </div>

                {checklistError && <div style={styles.errorInline}>{checklistError}</div>}

                {!checklist && !checklistLoading && (
                  <div style={styles.valueBox}>
                    No checklist yet.
                  </div>
                )}

                {checklist && (
                  <div style={styles.checklistWrap}>
                    <div style={styles.metaRow}>
                      <div style={styles.metaPill}>Total time: {checklist.totalMinutes} min</div>
                      <div style={styles.metaPill}>{checklistProgress}</div>
                    </div>

                    <div style={styles.valueBox}>{checklist.overview}</div>

                    <div style={styles.checklistList}>
                      {checklist.checklist.map((item, index) => {
                        const checked = checkedSteps.includes(index);

                        return (
                          <label key={index} style={styles.checklistItem}>
                            <div style={styles.checklistLeft}>
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={() => toggleStep(index)}
                              />
                              <span
                                style={{
                                  ...styles.checklistText,
                                  ...(checked ? styles.checklistTextDone : {}),
                                }}
                              >
                                {item.step}
                              </span>
                            </div>

                            <span style={styles.minutes}>{item.minutes} min</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          <div style={styles.actions}>
            <button
              style={styles.secondaryBtn}
              onClick={() => router.push(`/dashboard/input-assignments?userId=${userId}`)}
            >
              Add another
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    padding: "24px 20px",
    display: "flex",
    justifyContent: "center",
    color: "#111",
  },
  shell: {
    width: "100%",
    maxWidth: 860,
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginBottom: 14,
    color: "#111",
  },
  title: {
    margin: 0,
    fontSize: 34,
    letterSpacing: -0.5,
    color: "#111",
  },
  subTitle: {
    margin: "6px 0 0",
    color: "rgba(17,17,17,0.72)",
  },
  card: {
    border: "1px solid rgba(0,0,0,0.08)",
    borderRadius: 18,
    padding: 18,
    boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
    background: "#ffffff",
    color: "#111",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: 14,
  },
  row: {
    display: "flex",
    flexDirection: "column",
    gap: 8,
  },
  label: {
    fontSize: 14,
    color: "rgba(17,17,17,0.82)",
  },
  smallLabel: {
    fontSize: 12,
    color: "rgba(17,17,17,0.72)",
  },
  inline: {
    display: "flex",
    gap: 10,
    alignItems: "center",
    flexWrap: "wrap",
  },
  split: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 14,
  },
  input: {
    width: "100%",
    padding: "10px 12px",
    borderRadius: 12,
    border: "1px solid rgba(0,0,0,0.12)",
    background: "#fff",
    outline: "none",
    color: "#111",
  },
  select: {
    flex: 1,
    width: "100%",
    padding: "10px 12px",
    borderRadius: 12,
    border: "1px solid rgba(0,0,0,0.12)",
    background: "#fff",
    outline: "none",
    color: "#111",
    minWidth: 220,
  },
  textarea: {
    width: "100%",
    minHeight: 140,
    padding: "14px 12px",
    borderRadius: 14,
    border: "1px solid rgba(0,0,0,0.12)",
    background: "#fff",
    outline: "none",
    resize: "vertical",
    fontSize: 15,
    lineHeight: 1.45,
    color: "#111",
  },
  actions: {
    display: "flex",
    justifyContent: "flex-end",
    marginTop: 2,
  },
  primaryBtn: {
    padding: "10px 14px",
    borderRadius: 12,
    border: "1px solid rgba(0,0,0,0.12)",
    background: "#f3f4f6",
    cursor: "pointer",
    fontWeight: 600,
    color: "#111",
  },
  secondaryBtn: {
    padding: "10px 12px",
    borderRadius: 12,
    border: "1px solid rgba(0,0,0,0.12)",
    background: "#fff",
    cursor: "pointer",
    whiteSpace: "nowrap",
    color: "#111",
  },
  ghostBtn: {
    padding: "10px 12px",
    borderRadius: 12,
    border: "1px solid rgba(0,0,0,0.12)",
    background: "#fff",
    cursor: "pointer",
    color: "#111",
  },
  disabledBtn: {
    padding: "10px 14px",
    borderRadius: 12,
    border: "1px solid rgba(0,0,0,0.10)",
    background: "#f3f4f6",
    opacity: 0.5,
    cursor: "not-allowed",
    fontWeight: 600,
    color: "#111",
  },
  error: {
    padding: "10px 12px",
    borderRadius: 12,
    border: "1px solid rgba(255,80,80,0.35)",
    background: "rgba(255,80,80,0.10)",
    color: "#111",
  },
  addBox: {
    padding: 14,
    borderRadius: 14,
    border: "1px solid rgba(0,0,0,0.08)",
    background: "#fafafa",
    display: "flex",
    flexDirection: "column",
    gap: 10,
  },
  addHeader: {
    fontWeight: 700,
    color: "#111",
  },
  addActions: {
    display: "flex",
    justifyContent: "flex-end",
    gap: 10,
    marginTop: 6,
  },
};