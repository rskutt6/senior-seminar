"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";

type Assignment = {
  id: number;
  description: string;
  weight: number;
  dueAt: string;
  userId: number;
  courseId: number;
  courseCode?: string | null;
  courseName?: string | null;
};

export default function InputAssignmentSuccessPage() {
  const params = useSearchParams();
  const router = useRouter();

  const id = params.get("id");
  const userId = params.get("userId");

  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [error, setError] = useState("");
  const [courseLabel, setCourseLabel] = useState<string>("");

  const prettyDue = useMemo(() => {
    if (!assignment?.dueAt) return 'No due date';
    const d = new Date(assignment.dueAt);
    return isNaN(d.getTime()) ? 'No due date' : d.toLocaleString();
  }, [assignment?.dueAt]);

  useEffect(() => {
    async function load() {
      if (!id || !userId) {
        setError("Missing assignment id.");
        return;
      }

      const res = await fetch(`http://localhost:4000/assignments/${id}?userId=${userId}`, {
        cache: "no-store",
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.message || "Failed to load assignment");
        return;
      }

      const data = (await res.json()) as Assignment | null;
      if (!data) {
        setError("Assignment not found");
        return;
      }

      setAssignment(data);
    }

    load();
  }, [id, userId]);

  useEffect(() => {
    async function loadCourseLabel() {
      if (!assignment?.courseId || !assignment?.userId) return;

      try {
        const res = await fetch(
          `http://localhost:4000/courses?userId=${assignment.userId}`,
          { cache: 'no-store' },
        );

        if (!res.ok) return;

        const courses = await res.json();
        const course = courses.find((c: any) => c.id === assignment.courseId);

        setCourseLabel(course?.name ?? `Course #${assignment.courseId}`);
      } catch {
        // ignore; fallback below will handle it
      }
    }

    loadCourseLabel();
  }, [assignment?.courseId, assignment?.userId]);

  return (
    <main style={styles.page}>
      <div style={styles.shell}>
        <div style={styles.card}>
          <h1 style={styles.title}>Assignment created ✅</h1>

          {error && <div style={styles.error}>{error}</div>}

          {assignment && (
            <div style={styles.grid}>
              <div style={styles.block}>
                <div style={styles.label}>Class</div>
                <div style={styles.value}>
                  {assignment.courseId
                    ? courseLabel || `Course #${assignment.courseId}`
                    : 'No course selected'}
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
                    ? 'Not set'
                    : `${assignment.weight}%`}
                </div>
              </div>

              <div style={{ ...styles.block, gridColumn: '1 / -1' }}>
                <div style={styles.label}>Details</div>
                <div style={styles.valueBox}>{assignment.description}</div>
              </div>
            </div>
          )}

          <div style={styles.actions}>
            <button
              style={styles.secondaryBtn}
              onClick={() =>
                router.push(`/dashboard/input-assignments?userId=${userId}`)
              }
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
  page: { minHeight: "100vh", padding: "48px 20px", display: "flex", justifyContent: "center" },
  shell: { width: "100%", maxWidth: 860 },
  card: {
    border: "1px solid rgba(255,255,255,0.10)",
    borderRadius: 18,
    padding: 18,
    boxShadow: "0 10px 30px rgba(0,0,0,0.25)",
  },
  title: { margin: 0, fontSize: 30, letterSpacing: -0.5 },
  grid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginTop: 16 },
  block: {
    padding: 14,
    borderRadius: 14,
    border: "1px solid rgba(255,255,255,0.12)",
    background: "rgba(255,255,255,0.04)",
  },
  label: { fontSize: 12, opacity: 0.75, marginBottom: 6 },
  value: { fontSize: 16, fontWeight: 650 },
  valueBox: {
    whiteSpace: "pre-wrap",
    lineHeight: 1.45,
    background: "rgba(255,255,255,0.04)",
    borderRadius: 12,
    padding: 12,
    border: "1px solid rgba(255,255,255,0.10)",
  },
  actions: { marginTop: 18, display: "flex", justifyContent: "flex-end" },
  secondaryBtn: {
    padding: "10px 12px",
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,0.14)",
    background: "transparent",
    cursor: "pointer",
  },
  error: {
    marginTop: 12,
    padding: "10px 12px",
    borderRadius: 12,
    border: "1px solid rgba(255,80,80,0.35)",
    background: "rgba(255,80,80,0.10)",
  },
};