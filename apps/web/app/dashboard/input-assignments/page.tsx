"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type Course = {
  id: number;
  name: string;
  userId: number;
  createdAt: string;
};

type CreatedAssignment = {
  id: number;
  description: string;
  weight: number;
  dueAt: string;
  userId: number;
  courseId: number;
};

export default function InputAssignmentsPage() {
  const router = useRouter();

  // TODO: replace with real logged-in user id later
  const userId = 1;

  const [courses, setCourses] = useState<Course[]>([]);
  const [loadingCourses, setLoadingCourses] = useState(true);

  const [selectedCourseId, setSelectedCourseId] = useState<string>("");
  const [description, setDescription] = useState("");
  const [weight, setWeight] = useState<string>("");
  const [dueAtLocal, setDueAtLocal] = useState(""); // datetime-local

  // add course UI
  const [showAddCourse, setShowAddCourse] = useState(false);
  const [newCourseName, setNewCourseName] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string>("");

  const canSubmit = useMemo(() => {
  return description.trim().length > 0 && !submitting;
}, [description, submitting]);

  async function loadCourses() {
    setLoadingCourses(true);
    setError("");
    try {
      const res = await fetch(`http://localhost:4000/courses?userId=${userId}`, {
        cache: "no-store",
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || "Failed to load courses");
      }
      const data = (await res.json()) as Course[];
      setCourses(data);
    } catch (e: any) {
      setError(e.message || "Failed to load courses");
    } finally {
      setLoadingCourses(false);
    }
  }

  useEffect(() => {
    loadCourses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleAddCourse() {
    setError("");

    const name = newCourseName.trim();
    if (!name) {
      setError('Class name is required (try "COMP101").');
      return;
    }

    try {
      const res = await fetch(`http://localhost:4000/courses?userId=${userId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.message || "Failed to create course");
      }

      const created = data as { id: number };

      setNewCourseName("");
      setShowAddCourse(false);

      await loadCourses();
      setSelectedCourseId(String(created.id));
    } catch (e: any) {
      setError(e.message || "Failed to create course");
    }
  }

  async function handleSubmit(e: React.FormEvent) {
  e.preventDefault();
  if (!canSubmit) return;

  setSubmitting(true);
  setError("");

  try {
    const body: any = {
      description: description.trim(),
      userId,
    };

    // weight optional
    if (weight.trim().length > 0) {
      const weightNum = Number(weight);
      if (!Number.isFinite(weightNum)) {
        throw new Error("Weight must be a valid number.");
      }
      body.weight = weightNum;
    }

    // courseId: number OR null
    if (selectedCourseId.trim().length > 0) {
      const courseIdNum = Number(selectedCourseId);
      if (!Number.isFinite(courseIdNum)) {
        throw new Error("Please select a valid class.");
      }
      body.courseId = courseIdNum;
    } else {
      body.courseId = null;
    }

    // due date optional
    if (dueAtLocal.trim().length > 0) {
      const dueDate = new Date(dueAtLocal);
      if (Number.isNaN(dueDate.getTime())) {
        throw new Error("Due date is invalid.");
      }
      body.dueAt = dueDate.toISOString();
    }

    const res = await fetch("http://localhost:4000/assignments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      throw new Error(data.message || "Failed to create assignment");
    }

    const created = data as CreatedAssignment;

    if (!created?.id) {
      throw new Error("Saved, but server did not return an assignment id.");
    }

    router.push(
      `/dashboard/input-assignments/success?id=${encodeURIComponent(
        String(created.id)
      )}&userId=${encodeURIComponent(String(created.userId ?? userId))}`
    );
  } catch (e: any) {
    setError(e.message || "Failed to create assignment");
  } finally {
    setSubmitting(false);
  }
}

  return (
    <main style={styles.page}>
      <div style={styles.shell}>
        <header style={styles.header}>
          <div>
            <h1 style={styles.title}>Input Assignments</h1>
            <p style={styles.subTitle}>Add an assignment and attach it to a class.</p>
          </div>
        </header>

        <div style={styles.card}>
          <form onSubmit={handleSubmit} style={styles.form}>
            <div style={styles.row}>
              <label style={styles.label}>Class</label>
              <div style={styles.inline}>
                <select
                  value={selectedCourseId}
                  onChange={(e) => setSelectedCourseId(e.target.value)}
                  style={styles.select}
                  disabled={loadingCourses}
                >
                  <option value="">None</option>
                  {loadingCourses ? (
                    <option>Loading classes…</option>
                  ) : courses.length === 0 ? (
                    <option value="">No classes yet</option>
                  ) : (
                    courses.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))
                  )}
                </select>

                <button
                  type="button"
                  onClick={() => setShowAddCourse((v) => !v)}
                  style={styles.secondaryBtn}
                >
                  + Add class
                </button>
              </div>
            </div>

            {showAddCourse && (
              <div style={styles.addBox}>
                <div style={styles.addHeader}>Add a new class</div>

                <label style={styles.smallLabel}>Class name</label>
                <input
                  value={newCourseName}
                  onChange={(e) => setNewCourseName(e.target.value)}
                  placeholder='COMP101 (or "COMP101 — Intro to CS")'
                  style={styles.input}
                />

                <div style={styles.addActions}>
                  <button
                    type="button"
                    onClick={() => setShowAddCourse(false)}
                    style={styles.ghostBtn}
                  >
                    Cancel
                  </button>
                  <button type="button" onClick={handleAddCourse} style={styles.primaryBtn}>
                    Save class
                  </button>
                </div>
              </div>
            )}

            <div style={styles.row}>
              <label style={styles.label}>Assignment details</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Put the assignment name + any notes…"
                style={styles.textarea}
                rows={8}
              />
            </div>

            <div style={styles.split}>
              <div style={styles.row}>
                <label style={styles.label}>Weight (%)</label>
                <input
                  type="number"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  placeholder="20"
                  style={styles.input}
                />
              </div>

              <div style={styles.row}>
                <label style={styles.label}>Due date</label>
                <input
                  type="datetime-local"
                  value={dueAtLocal}
                  onChange={(e) => setDueAtLocal(e.target.value)}
                  style={styles.input}
                />
              </div>
            </div>

            {error && <div style={styles.error}>{error}</div>}

            <div style={styles.actions}>
              <button
                type="submit"
                style={canSubmit ? styles.primaryBtn : styles.disabledBtn}
                disabled={!canSubmit}
              >
                {submitting ? "Saving…" : "Create assignment"}
              </button>
            </div>
          </form>
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
  shell: { width: "100%", maxWidth: 860 },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginBottom: 16,
  },
  title: { margin: 0, fontSize: 34, letterSpacing: -0.5 },
  subTitle: { margin: "6px 0 0", opacity: 0.75 },
  card: {
    border: "1px solid rgba(255,255,255,0.10)",
    borderRadius: 18,
    padding: 18,
    boxShadow: "0 10px 30px rgba(0,0,0,0.25)",
  },
  form: { display: "flex", flexDirection: "column", gap: 16 },
  row: { display: "flex", flexDirection: "column", gap: 8 },
  label: { fontSize: 14, opacity: 0.85 },
  smallLabel: { fontSize: 12, opacity: 0.8 },
  inline: { display: "flex", gap: 10, alignItems: "center" },
  split: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 },
  input: {
    padding: "10px 12px",
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,0.14)",
    background: "rgba(255,255,255,0.06)",
    outline: "none",
  },
  select: {
    flex: 1,
    padding: "10px 12px",
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,0.14)",
    background: "rgba(255,255,255,0.06)",
    outline: "none",
  },
  textarea: {
    padding: "14px 12px",
    borderRadius: 14,
    border: "1px solid rgba(255,255,255,0.14)",
    background: "rgba(255,255,255,0.06)",
    outline: "none",
    resize: "vertical",
    fontSize: 15,
    lineHeight: 1.45,
  },
  actions: { display: "flex", justifyContent: "flex-end", marginTop: 4 },
  primaryBtn: {
    padding: "10px 14px",
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,0.18)",
    background: "rgba(255,255,255,0.12)",
    cursor: "pointer",
    fontWeight: 600,
  },
  secondaryBtn: {
    padding: "10px 12px",
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,0.14)",
    background: "transparent",
    cursor: "pointer",
    opacity: 0.9,
    whiteSpace: "nowrap",
  },
  ghostBtn: {
    padding: "10px 12px",
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,0.14)",
    background: "transparent",
    cursor: "pointer",
  },
  disabledBtn: {
    padding: "10px 14px",
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,0.10)",
    background: "rgba(255,255,255,0.05)",
    opacity: 0.5,
    cursor: "not-allowed",
    fontWeight: 600,
  },
  error: {
    padding: "10px 12px",
    borderRadius: 12,
    border: "1px solid rgba(255,80,80,0.35)",
    background: "rgba(255,80,80,0.10)",
  },
  addBox: {
    padding: 14,
    borderRadius: 14,
    border: "1px solid rgba(255,255,255,0.12)",
    background: "rgba(255,255,255,0.04)",
    display: "flex",
    flexDirection: "column",
    gap: 10,
  },
  addHeader: { fontWeight: 700, opacity: 0.9 },
  addActions: { display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 6 },
};