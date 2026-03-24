"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { getCurrentUser } from '@/lib/auth';

type Course = {
  id: number;
  name: string;
  userId: number;
  createdAt: string;
};

type CreatedAssignment = {
  id: number;
  title: string | null;
  description: string;
  weight: number | null;
  dueAt: string | null;
  userId: number;
  courseId: number | null;
};

export default function InputAssignmentsPage() {
  const router = useRouter();

  const [userId, setUserId] = useState<number | null>(null);

  const [courses, setCourses] = useState<Course[]>([]);
  const [loadingCourses, setLoadingCourses] = useState(true);

  const [selectedCourseId, setSelectedCourseId] = useState<string>("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [weight, setWeight] = useState<string>("");
  const [dueAtLocal, setDueAtLocal] = useState("");

  const [showAddCourse, setShowAddCourse] = useState(false);
  const [newCourseName, setNewCourseName] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string>("");

  const canSubmit = useMemo(() => {
    return title.trim().length > 0 && description.trim().length > 0 && !submitting;
  }, [title, description, submitting]);

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
    const storedUser = localStorage.getItem("user");

    if (!storedUser) {
      router.push("/login");
      return;
    }

    const parsedUser = JSON.parse(storedUser);
    setUserId(parsedUser.id);
  }, [router]);

  useEffect(() => {
    if (userId) {
      loadCourses();
    }
  }, [userId]);

  async function handleAddCourse() {
    setError("");

    if (!userId) {
      setError('Not logged in. Please log in again.');
      router.push('/login');
      return;
    }

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

    if (!userId) {
      setError('Not logged in. Please log in again.');
      router.push('/login');
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const body: any = {
        title: title.trim(),
        description: description.trim(),
        userId,
      };

      if (weight.trim().length > 0) {
        const weightNum = Number(weight);
        if (!Number.isFinite(weightNum)) {
          throw new Error("Weight must be a valid number.");
        }
        body.weight = weightNum;
      }

      if (selectedCourseId.trim().length > 0) {
        const courseIdNum = Number(selectedCourseId);
        if (!Number.isFinite(courseIdNum)) {
          throw new Error("Please select a valid class.");
        }
        body.courseId = courseIdNum;
      } else {
        body.courseId = null;
      }

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
              <label style={styles.label}>Assignment title</label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Paper 1"
                style={styles.input}
              />
            </div>

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
    width: "100%",
    padding: 0,
    margin: 0,
  },
  shell: {
    width: "100%",
    maxWidth: 860,
    margin: 0,
  },
  card: {
    border: "1px solid rgba(0,0,0,0.10)",
    borderRadius: 18,
    padding: 18,
    boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
    background: "#fff",
  },
  title: { margin: 0, fontSize: 30, letterSpacing: -0.5, color: "#111" },
  grid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginTop: 16 },
  block: {
    padding: 14,
    borderRadius: 14,
    border: "1px solid rgba(0,0,0,0.10)",
    background: "#fafafa",
  },
  label: { fontSize: 12, opacity: 0.75, marginBottom: 6, color: "#111" },
  value: { fontSize: 16, fontWeight: 650, lineHeight: 1.4, color: "#111" },
  valueBox: {
    whiteSpace: "pre-wrap",
    lineHeight: 1.45,
    background: "#fff",
    borderRadius: 12,
    padding: 12,
    border: "1px solid rgba(0,0,0,0.10)",
    color: "#111",
  },
  checklistHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12,
    flexWrap: "wrap",
    marginBottom: 12,
  },
  smallText: {
    fontSize: 13,
    opacity: 0.72,
    lineHeight: 1.4,
    color: "#111",
  },
  checklistWrap: {
    display: "flex",
    flexDirection: "column",
    gap: 12,
  },
  metaRow: {
    display: "flex",
    gap: 8,
    flexWrap: "wrap",
  },
  metaPill: {
    padding: "6px 10px",
    borderRadius: 999,
    border: "1px solid rgba(0,0,0,0.12)",
    background: "#f3f4f6",
    fontSize: 12,
    color: "#111",
  },
  checklistList: {
    display: "flex",
    flexDirection: "column",
    gap: 10,
  },
  checklistItem: {
    display: "grid",
    gridTemplateColumns: "minmax(0, 1fr) auto",
    alignItems: "start",
    gap: 12,
    padding: 12,
    borderRadius: 12,
    border: "1px solid rgba(0,0,0,0.10)",
    background: "#fff",
  },
  checklistLeft: {
    display: "grid",
    gridTemplateColumns: "16px minmax(0, 1fr)",
    alignItems: "start",
    gap: 10,
    minWidth: 0,
  },
  checklistText: {
    lineHeight: 1.45,
    whiteSpace: "normal",
    wordBreak: "break-word",
    overflowWrap: "anywhere",
    color: "#111",
  },
  checklistTextDone: {
    textDecoration: "line-through",
    opacity: 0.6,
  },
  minutes: {
    whiteSpace: "nowrap",
    fontSize: 13,
    opacity: 0.85,
    marginLeft: 8,
    color: "#111",
  },
  actions: { marginTop: 18, display: "flex", justifyContent: "flex-end" },
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
    background: "transparent",
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
    marginTop: 12,
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