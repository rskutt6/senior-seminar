"use client";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type CreatedAssignment = {
  id: number;
  title: string | null;
  description: string;
  weight: number | null;
  dueAt: string | null;
  userId: number;
  courseId: number | null;
  assignmentType: string | null;
  problemCount: number | null;
  pageCount: number | null;
  summary: string | null;
  checklistOverview: string | null;
  checklistItems: unknown;
  priority: string | null;
  status: string | null;
  notes: string | null;
};

type ExtractionResult = {
  title: string | null;
  courseName: string | null;
  dueAt: string | null;
  weight: number | null;
  assignmentType: string | null;
  problemCount: number | null;
  pageCount: number | null;
  priority: string | null;
  status: string | null;
  notes: string | null;
  summary: string | null;
};

type Course = {
  id: number;
  name: string;
  userId: number;
  createdAt: string;
};

const ASSIGNMENT_TYPES = [
  "homework", "essay", "reading", "project", "discussion",
  "exam", "quiz", "lab", "presentation", "other",
] as const;

export default function InputAssignmentsPage() {
  const router = useRouter();
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const canSubmit = useMemo(() => description.trim().length > 0 && !submitting, [description, submitting]);

  async function getCurrentUserId() {
    const storedUser = localStorage.getItem("user");
    if (!storedUser) return null;
    try {
      const parsedUser = JSON.parse(storedUser);
      return parsedUser?.id ?? null;
    } catch { return null; }
  }

  async function findOrCreateCourse(userId: number, courseName: string | null) {
    if (!courseName?.trim()) return null;
    const listRes = await fetch(`http://localhost:4000/courses?userId=${userId}`, { cache: "no-store" });
    if (!listRes.ok) throw new Error("Failed to load classes.");
    const courses = (await listRes.json()) as Course[];
    const normalized = courseName.trim().toLowerCase();
    const existing = courses.find((course) => course.name.trim().toLowerCase() === normalized);
    if (existing) return existing.id;
    const createRes = await fetch(`http://localhost:4000/courses?userId=${userId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: courseName.trim() }),
    });
    const created = await createRes.json().catch(() => ({}));
    if (!createRes.ok) throw new Error(created.message || "Failed to create class.");
    return created.id ?? null;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setSubmitting(true);
    setError("");
    try {
      const userId = await getCurrentUserId();
      if (!userId) { router.push("/login"); return; }
      const coursesRes = await fetch(`http://localhost:4000/courses?userId=${userId}`, { cache: "no-store" });
      const existingCourses = coursesRes.ok ? ((await coursesRes.json()) as Course[]) : [];
      const classNames = Array.isArray(existingCourses) ? existingCourses.map((course) => course.name?.trim()).filter((name): name is string => !!name) : [];
      const extractRes = await fetch("/api/extract-assignment-details", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description: description.trim(), classes: classNames, assignmentTypes: ASSIGNMENT_TYPES }),
      });
      const extracted = (await extractRes.json().catch(() => ({}))) as Partial<ExtractionResult>;
      if (!extractRes.ok) throw new Error((extracted as { error?: string })?.error || "Failed to detect assignment details.");
      const courseId = await findOrCreateCourse(userId, extracted.courseName ?? null);
      const title = typeof extracted.title === "string" && extracted.title.trim() ? extracted.title.trim() : "Untitled Assignment";
      const body: any = {
        title, description: description.trim(), userId, courseId: courseId ?? null,
        assignmentType: typeof extracted.assignmentType === "string" && extracted.assignmentType.trim() ? extracted.assignmentType.trim() : null,
        problemCount: typeof extracted.problemCount === "number" && Number.isFinite(extracted.problemCount) ? extracted.problemCount : null,
        pageCount: typeof extracted.pageCount === "number" && Number.isFinite(extracted.pageCount) ? extracted.pageCount : null,
        summary: typeof extracted.summary === "string" && extracted.summary.trim() ? extracted.summary.trim() : null,
        checklistOverview: null, checklistItems: [],
        priority: typeof extracted.priority === "string" && extracted.priority.trim() ? extracted.priority.trim().toLowerCase() : "medium",
        status: typeof extracted.status === "string" && extracted.status.trim() ? extracted.status.trim().toLowerCase() : "not_started",
        notes: typeof extracted.notes === "string" && extracted.notes.trim() ? extracted.notes.trim() : null,
      };
      if (typeof extracted.weight === "number" && Number.isFinite(extracted.weight)) body.weight = extracted.weight;
      if (typeof extracted.dueAt === "string" && extracted.dueAt.trim()) {
        if (typeof extracted.dueAt === "string" && extracted.dueAt.trim()) {
          const parsedDate = new Date(extracted.dueAt);

          if (!Number.isNaN(parsedDate.getTime())) {
            body.dueAt = parsedDate.toISOString();
          } else {
            console.log("❌ INVALID DATE FROM AI:", extracted.dueAt);
          }
        }
      }
      const res = await fetch("http://localhost:4000/assignments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const created = (await res.json().catch(() => ({}))) as CreatedAssignment;
      if (!res.ok) throw new Error((created as { message?: string })?.message || "Failed to create assignment.");
      if (!created?.id) throw new Error("Saved, but no assignment id was returned.");
      router.push(`/dashboard/input-assignments/success?id=${encodeURIComponent(String(created.id))}&userId=${encodeURIComponent(String(created.userId ?? userId))}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create assignment");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main style={page}>
      <div style={card}>
        <div style={cardHeader}>
          <h1 style={title}>Paste assignment</h1>
          <p style={subtitle}>
            Paste the full assignment text from Canvas, email, or your syllabus.
            We'll detect the important details and let you review them on the next page.
          </p>
        </div>

        <div style={cardBody}>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Paste the full assignment instructions here..."
            style={textarea}
          />
          <p style={hint}>Include the full text so the AI can catch due dates, weight, class, assignment type, and workload details.</p>
          {error && <div style={errorBox}>{error}</div>}
        </div>

        <div style={cardFooter}>
          <button type="button" onClick={handleSubmit} disabled={!canSubmit} style={{ ...submitBtn, opacity: !canSubmit ? 0.5 : 1, cursor: !canSubmit ? 'not-allowed' : 'pointer' }}>
            {submitting ? "Detecting..." : "Continue"}
          </button>
        </div>
      </div>
    </main>
  );
}

const page: React.CSSProperties = { minHeight: '100vh', padding: 24, background: '#F4F1EC', color: '#6E7F5B' };
const card: React.CSSProperties = { maxWidth: 900, margin: '0 auto', background: '#ffffff', border: '1px solid #9CAF88', borderRadius: 20, display: 'flex', flexDirection: 'column', minHeight: 'calc(100vh - 140px)' };
const cardHeader: React.CSSProperties = { padding: '24px 28px', borderBottom: '1px solid #e8e4dc' };
const title: React.CSSProperties = { fontSize: 24, fontWeight: 900, color: '#6E7F5B', marginBottom: 8 };
const subtitle: React.CSSProperties = { fontSize: 14, color: '#8A7967', lineHeight: 1.6 };
const cardBody: React.CSSProperties = { flex: 1, padding: '16px 28px' };
const textarea: React.CSSProperties = { width: '100%', minHeight: 420, borderRadius: 14, border: '1px solid #9CAF88', background: '#F4F1EC', padding: '16px 20px', fontSize: 14, color: '#6E7F5B', fontFamily: 'inherit', outline: 'none', resize: 'none', lineHeight: 1.6 };
const hint: React.CSSProperties = { fontSize: 12, color: '#8A7967', marginTop: 10 };
const errorBox: React.CSSProperties = { marginTop: 12, background: 'rgba(201,131,122,0.15)', border: '1px solid #c9837a', color: '#c9837a', borderRadius: 12, padding: '12px 16px', fontSize: 14 };
const cardFooter: React.CSSProperties = { padding: '16px 28px', borderTop: '1px solid #e8e4dc', display: 'flex', justifyContent: 'flex-end' };
const submitBtn: React.CSSProperties = { background: '#6E7F5B', color: '#ffffff', fontWeight: 700, fontSize: 14, padding: '10px 24px', borderRadius: 12, border: 'none', fontFamily: 'inherit' };
