"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

type Assignment = {
  id: number;
  title: string | null;
  description: string;
  weight: number | null;
  dueAt: string | null;
  userId: number;
  courseId: number | null;
};

export default function InputAssignmentSuccessPage() {
  const params = useSearchParams();
  const router = useRouter();

  const id = params.get("id");
  const userId = params.get("userId");

  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [courseLabel, setCourseLabel] = useState("");
  const [summary, setSummary] = useState("");
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const prettyDue = useMemo(() => {
    if (!assignment?.dueAt) return "No due date";
    const d = new Date(assignment.dueAt);
    return Number.isNaN(d.getTime()) ? "No due date" : d.toLocaleString();
  }, [assignment?.dueAt]);

  useEffect(() => {
    async function loadAssignment() {
      if (!id || !userId) {
        setError("Missing assignment info.");
        setLoading(false);
        return;
      }

      try {
        const res = await fetch(
          `http://localhost:4000/assignments/${id}?userId=${userId}`,
          { cache: "no-store" }
        );

        const data = await res.json().catch(() => null);

        if (!res.ok) {
          throw new Error(data?.message || "Failed to load assignment.");
        }

        if (!data) {
          throw new Error("Assignment not found.");
        }

        setAssignment(data);
      } catch (e: any) {
        setError(e.message || "Failed to load assignment.");
      } finally {
        setLoading(false);
      }
    }

    loadAssignment();
  }, [id, userId]);

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
        setCourseLabel(`Course #${assignment.courseId}`);
      }
    }

    loadCourseLabel();
  }, [assignment?.courseId, assignment?.userId]);

  useEffect(() => {
    async function summarize() {
      if (!assignment?.description?.trim()) return;

      setSummaryLoading(true);
      setSummary("");

      try {
        const res = await fetch("/api/summarize-assignment", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ description: assignment.description }),
        });

        const text = await res.text();
        let data: any = {};

        try {
          data = JSON.parse(text);
        } catch {
          throw new Error("Summarizer returned invalid JSON.");
        }

        if (!res.ok) {
          throw new Error(data.message || "Failed to summarize assignment.");
        }

        setSummary(data.summary || "No summary available.");
      } catch (e: any) {
        setSummary(`Error: ${e.message}`);
      } finally {
        setSummaryLoading(false);
      }
    }

    summarize();
  }, [assignment?.description]);

  return (
    <main style={styles.page}>
      <div style={styles.shell}>
        <div style={styles.card}>
          <h1 style={styles.title}>Assignment created ✅</h1>

          {loading && <div style={styles.muted}>Loading assignment...</div>}
          {error && <div style={styles.error}>{error}</div>}

          {!loading && !error && assignment && (
            <div style={styles.grid}>
              <div style={styles.block}>
                <div style={styles.label}>Assignment Title</div>
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
                <div style={styles.valueBox}>{assignment.description || "No details provided."}</div>
              </div>

              <div style={{ ...styles.block, gridColumn: "1 / -1" }}>
                <div style={styles.label}>AI Summary</div>
                <div style={styles.valueBox}>
                  {summaryLoading ? "Summarizing..." : summary || "No summary available."}
                </div>
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
    padding: "48px 20px",
    display: "flex",
    justifyContent: "center",
  },
  shell: {
    width: "100%",
    maxWidth: 900,
  },
  card: {
    border: "1px solid rgba(255,255,255,0.10)",
    borderRadius: 18,
    padding: 20,
    boxShadow: "0 10px 30px rgba(0,0,0,0.25)",
  },
  title: {
    margin: 0,
    fontSize: 30,
    letterSpacing: -0.5,
  },
  muted: {
    marginTop: 14,
    opacity: 0.75,
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 14,
    marginTop: 18,
  },
  block: {
    padding: 14,
    borderRadius: 14,
    border: "1px solid rgba(255,255,255,0.12)",
    background: "rgba(255,255,255,0.04)",
  },
  label: {
    fontSize: 12,
    opacity: 0.75,
    marginBottom: 6,
  },
  value: {
    fontSize: 16,
    fontWeight: 650,
  },
  valueBox: {
    whiteSpace: "pre-wrap",
    lineHeight: 1.5,
    borderRadius: 12,
    padding: 12,
    border: "1px solid rgba(255,255,255,0.10)",
    background: "rgba(255,255,255,0.04)",
  },
  actions: {
    marginTop: 18,
    display: "flex",
    justifyContent: "flex-end",
  },
  secondaryBtn: {
    padding: "10px 12px",
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,0.14)",
    background: "transparent",
    cursor: "pointer",
  },
  error: {
    marginTop: 14,
    padding: "10px 12px",
    borderRadius: 12,
    border: "1px solid rgba(255,80,80,0.35)",
    background: "rgba(255,80,80,0.10)",
  },
};