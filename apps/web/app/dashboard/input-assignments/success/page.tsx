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

type EditableChecklistItem = {
  id: string;
  step: string;
  minutes: number;
  checked: boolean;
};

function makeId() {
  return Math.random().toString(36).slice(2, 10);
}

export default function InputAssignmentSuccessPage() {
  const params = useSearchParams();
  const router = useRouter();

  const id = params.get("id");
  const userId = params.get("userId");

  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [loadError, setLoadError] = useState("");
  const [courseLabel, setCourseLabel] = useState("");

  const [summary, setSummary] = useState("");
  const [summaryLoading, setSummaryLoading] = useState(false);

  const [checklistLoading, setChecklistLoading] = useState(false);
  const [checklistError, setChecklistError] = useState("");
  const [checklistOverview, setChecklistOverview] = useState("");
  const [checklistItems, setChecklistItems] = useState<EditableChecklistItem[]>([]);

  const prettyDue = useMemo(() => {
    if (!assignment?.dueAt) return "No due date";
    const d = new Date(assignment.dueAt);
    return Number.isNaN(d.getTime()) ? "No due date" : d.toLocaleString();
  }, [assignment?.dueAt]);

  const totalMinutes = useMemo(() => {
    return checklistItems.reduce((sum, item) => sum + (Number(item.minutes) || 0), 0);
  }, [checklistItems]);

  const completedCount = useMemo(() => {
    return checklistItems.filter((item) => item.checked).length;
  }, [checklistItems]);

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

      const items: EditableChecklistItem[] = Array.isArray(data.checklist)
        ? data.checklist.map((item: ChecklistItem) => ({
            id: makeId(),
            step: item.step,
            minutes: item.minutes,
            checked: false,
          }))
        : [];

      setChecklistOverview(data.overview || "");
      setChecklistItems(items);
    } catch (e: any) {
      setChecklistError(e.message || "Failed to generate checklist");
    } finally {
      setChecklistLoading(false);
    }
  }

  function toggleStep(itemId: string) {
    setChecklistItems((prev) =>
      prev.map((item) =>
        item.id === itemId ? { ...item, checked: !item.checked } : item
      )
    );
  }

  function updateStepText(itemId: string, value: string) {
    setChecklistItems((prev) =>
      prev.map((item) => (item.id === itemId ? { ...item, step: value } : item))
    );
  }

  function updateStepMinutes(itemId: string, value: string) {
    const num = value === "" ? 0 : Number(value);
    setChecklistItems((prev) =>
      prev.map((item) =>
        item.id === itemId ? { ...item, minutes: Number.isFinite(num) ? num : 0 } : item
      )
    );
  }

  function addChecklistItem() {
    setChecklistItems((prev) => [
      ...prev,
      {
        id: makeId(),
        step: "",
        minutes: 15,
        checked: false,
      },
    ]);
  }

  function removeChecklistItem(itemId: string) {
    setChecklistItems((prev) => prev.filter((item) => item.id !== itemId));
  }

  return (
    <main style={styles.page}>
      <div style={styles.shell}>
        <div style={styles.headerRow}>
          <div>
            <h1 style={styles.title}>Assignment created ✅</h1>
            <p style={styles.subTitle}>Review, edit, and plan your work.</p>
          </div>

          <button
            style={styles.secondaryBtn}
            onClick={() => router.push(`/dashboard/input-assignments?userId=${userId}`)}
          >
            Add another
          </button>
        </div>

        {loadError && <div style={styles.error}>{loadError}</div>}

        {assignment && (
          <div style={styles.stack}>
            <section style={styles.card}>
              <div style={styles.sectionTitle}>Assignment details</div>

              <div style={styles.infoGrid}>
                <div style={styles.infoItem}>
                  <div style={styles.label}>Title</div>
                  <div style={styles.value}>{assignment.title?.trim() || "Not set"}</div>
                </div>

                <div style={styles.infoItem}>
                  <div style={styles.label}>Class</div>
                  <div style={styles.value}>
                    {assignment.courseId
                      ? courseLabel || `Course #${assignment.courseId}`
                      : "No course selected"}
                  </div>
                </div>

                <div style={styles.infoItem}>
                  <div style={styles.label}>Due</div>
                  <div style={styles.value}>{prettyDue}</div>
                </div>

                <div style={styles.infoItem}>
                  <div style={styles.label}>Weight</div>
                  <div style={styles.value}>
                    {assignment.weight === null || assignment.weight === undefined
                      ? "Not set"
                      : `${assignment.weight}%`}
                  </div>
                </div>
              </div>

              <div style={styles.fullBlock}>
                <div style={styles.label}>Details</div>
                <div style={styles.valueBox}>{assignment.description}</div>
              </div>
            </section>

            <section style={styles.card}>
              <div style={styles.sectionTitle}>AI summary</div>
              <div style={styles.smallMuted}>Short version of the assignment.</div>

              <div style={styles.summaryBox}>
                {summaryLoading ? "Summarizing…" : summary || "No summary"}
              </div>
            </section>

            <section style={styles.card}>
              <div style={styles.cardTopRow}>
                <div>
                  <div style={styles.sectionTitle}>Checklist</div>
                  <div style={styles.smallMuted}>
                    Edit tasks, rename them, change minutes, add items, or remove them.
                  </div>
                </div>

                <div style={styles.buttonRow}>
                  <button style={styles.secondaryBtn} type="button" onClick={addChecklistItem}>
                    + Add item
                  </button>

                  <button
                    style={checklistLoading ? styles.disabledBtn : styles.primaryBtn}
                    type="button"
                    onClick={handleGenerateChecklist}
                    disabled={checklistLoading}
                  >
                    {checklistLoading ? "Generating…" : "Generate checklist"}
                  </button>
                </div>
              </div>

              {checklistError && <div style={styles.errorInline}>{checklistError}</div>}

              <div style={styles.metaRow}>
                <div style={styles.metaPill}>Total time: {totalMinutes} min</div>
                <div style={styles.metaPill}>
                  {completedCount}/{checklistItems.length} completed
                </div>
              </div>

              <textarea
                value={checklistOverview}
                onChange={(e) => setChecklistOverview(e.target.value)}
                placeholder="Checklist overview..."
                style={styles.overviewTextarea}
              />

              {!checklistItems.length && !checklistLoading && (
                <div style={styles.emptyBox}>No checklist yet.</div>
              )}

              {!!checklistItems.length && (
                <div style={styles.tableWrap}>
                  <div style={styles.tableHeader}>
                    <div>Done</div>
                    <div>Task</div>
                    <div>Minutes</div>
                    <div>Action</div>
                  </div>

                  {checklistItems.map((item) => (
                    <div key={item.id} style={styles.tableRow}>
                      <div style={styles.doneCell}>
                        <input
                          type="checkbox"
                          checked={item.checked}
                          onChange={() => toggleStep(item.id)}
                        />
                      </div>

                      <input
                        value={item.step}
                        onChange={(e) => updateStepText(item.id, e.target.value)}
                        placeholder="Task name"
                        style={{
                          ...styles.taskInput,
                          ...(item.checked ? styles.taskInputDone : {}),
                        }}
                      />

                      <input
                        type="number"
                        min={0}
                        value={item.minutes}
                        onChange={(e) => updateStepMinutes(item.id, e.target.value)}
                        style={styles.minutesInput}
                      />

                      <button
                        type="button"
                        onClick={() => removeChecklistItem(item.id)}
                        style={styles.removeBtn}
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        )}
      </div>
    </main>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    width: "100%",
    padding: "20px 24px",
    color: "#111",
  },

  shell: {
    width: "100%",
    maxWidth: 980,
    margin: "0 auto",
  },

  headerRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12,
    marginBottom: 16,
    flexWrap: "wrap",
  },

  title: {
    margin: 0,
    fontSize: 30,
    letterSpacing: -0.5,
    color: "#111",
  },

  subTitle: {
    margin: "6px 0 0",
    color: "rgba(17,17,17,0.68)",
  },

  stack: {
    display: "flex",
    flexDirection: "column",
    gap: 14,
  },

  card: {
    width: "100%",
    border: "1px solid rgba(0,0,0,0.08)",
    borderRadius: 18,
    padding: 18,
    background: "#fff",
    boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: 700,
    color: "#111",
    marginBottom: 4,
  },

  smallMuted: {
    fontSize: 13,
    color: "rgba(17,17,17,0.68)",
    marginBottom: 12,
  },

  infoGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 12,
  },

  infoItem: {
    padding: 12,
    borderRadius: 12,
    border: "1px solid rgba(0,0,0,0.10)",
    background: "#fafafa",
  },

  fullBlock: {
    marginTop: 12,
  },

  label: {
    fontSize: 12,
    color: "rgba(17,17,17,0.65)",
    marginBottom: 6,
  },

  value: {
    fontSize: 16,
    fontWeight: 600,
    color: "#111",
    lineHeight: 1.4,
  },

  valueBox: {
    whiteSpace: "pre-wrap",
    lineHeight: 1.5,
    background: "#fff",
    borderRadius: 12,
    padding: 12,
    border: "1px solid rgba(0,0,0,0.10)",
    color: "#111",
  },

  summaryBox: {
    whiteSpace: "pre-wrap",
    lineHeight: 1.5,
    background: "#fff",
    borderRadius: 12,
    padding: 12,
    border: "1px solid rgba(0,0,0,0.10)",
    color: "#111",
    maxWidth: "100%",
  },

  cardTopRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12,
    flexWrap: "wrap",
    marginBottom: 12,
  },

  buttonRow: {
    display: "flex",
    gap: 8,
    flexWrap: "wrap",
  },

  metaRow: {
    display: "flex",
    gap: 8,
    flexWrap: "wrap",
    marginBottom: 12,
  },

  metaPill: {
    padding: "6px 10px",
    borderRadius: 999,
    border: "1px solid rgba(0,0,0,0.12)",
    background: "#f3f4f6",
    fontSize: 12,
    color: "#111",
  },

  overviewTextarea: {
    width: "100%",
    minHeight: 72,
    padding: "12px",
    borderRadius: 12,
    border: "1px solid rgba(0,0,0,0.14)",
    background: "#fff",
    color: "#111",
    outline: "none",
    resize: "vertical",
    fontSize: 14,
    lineHeight: 1.45,
    marginBottom: 12,
  },

  emptyBox: {
    padding: 12,
    borderRadius: 12,
    border: "1px solid rgba(0,0,0,0.10)",
    background: "#fff",
    color: "rgba(17,17,17,0.65)",
  },

  tableWrap: {
    display: "flex",
    flexDirection: "column",
    gap: 8,
  },

  tableHeader: {
    display: "grid",
    gridTemplateColumns: "70px minmax(0, 1fr) 100px 96px",
    gap: 10,
    fontSize: 12,
    color: "rgba(17,17,17,0.62)",
    padding: "0 4px",
    alignItems: "center",
  },

  tableRow: {
    display: "grid",
    gridTemplateColumns: "70px minmax(0, 1fr) 100px 96px",
    gap: 10,
    alignItems: "center",
    padding: 10,
    borderRadius: 12,
    border: "1px solid rgba(0,0,0,0.10)",
    background: "#fff",
  },

  doneCell: {
    display: "flex",
    justifyContent: "center",
  },

  taskInput: {
    width: "100%",
    minWidth: 0,
    padding: "10px 12px",
    borderRadius: 10,
    border: "1px solid rgba(0,0,0,0.14)",
    background: "#fff",
    color: "#111",
    outline: "none",
    fontSize: 14,
  },

  taskInputDone: {
    textDecoration: "line-through",
    opacity: 0.6,
  },

  minutesInput: {
    width: "100%",
    padding: "10px 12px",
    borderRadius: 10,
    border: "1px solid rgba(0,0,0,0.14)",
    background: "#fff",
    color: "#111",
    outline: "none",
    fontSize: 14,
  },

  removeBtn: {
    padding: "10px 12px",
    borderRadius: 10,
    border: "1px solid rgba(0,0,0,0.12)",
    background: "#fff",
    color: "#111",
    cursor: "pointer",
    fontSize: 13,
  },

  secondaryBtn: {
    padding: "10px 12px",
    borderRadius: 12,
    border: "1px solid rgba(0,0,0,0.12)",
    background: "#fff",
    cursor: "pointer",
    color: "#111",
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
    marginBottom: 12,
    padding: "10px 12px",
    borderRadius: 12,
    border: "1px solid rgba(255,80,80,0.35)",
    background: "rgba(255,80,80,0.10)",
    color: "#111",
  },

  errorInline: {
    marginBottom: 12,
    padding: "10px 12px",
    borderRadius: 12,
    border: "1px solid rgba(255,80,80,0.35)",
    background: "rgba(255,80,80,0.10)",
    color: "#111",
  },
};