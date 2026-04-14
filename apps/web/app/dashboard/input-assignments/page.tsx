
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
  "homework",
  "essay",
  "reading",
  "project",
  "discussion",
  "exam",
  "quiz",
  "lab",
  "presentation",
  "other",
] as const;

export default function InputAssignmentsPage() {
  const router = useRouter();

  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const canSubmit = useMemo(() => {
    return description.trim().length > 0 && !submitting;
  }, [description, submitting]);

  async function getCurrentUserId() {
    const storedUser = localStorage.getItem("user");
    if (!storedUser) return null;

    try {
      const parsedUser = JSON.parse(storedUser);
      return parsedUser?.id ?? null;
    } catch {
      return null;
    }
  }

  async function findOrCreateCourse(userId: number, courseName: string | null) {
    if (!courseName?.trim()) return null;

    const listRes = await fetch(`http://localhost:4000/courses?userId=${userId}`, {
      cache: "no-store",
    });

    if (!listRes.ok) {
      throw new Error("Failed to load classes.");
    }

    const courses = (await listRes.json()) as Course[];
    const normalized = courseName.trim().toLowerCase();

    const existing = courses.find(
      (course) => course.name.trim().toLowerCase() === normalized
    );

    if (existing) return existing.id;

    const createRes = await fetch(`http://localhost:4000/courses?userId=${userId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: courseName.trim() }),
    });

    const created = await createRes.json().catch(() => ({}));

    if (!createRes.ok) {
      throw new Error(created.message || "Failed to create class.");
    }

    return created.id ?? null;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;

    setSubmitting(true);
    setError("");

    try {
      const userId = await getCurrentUserId();

      if (!userId) {
        router.push("/login");
        return;
      }

      const coursesRes = await fetch(`http://localhost:4000/courses?userId=${userId}`, {
        cache: "no-store",
      });

      const existingCourses = coursesRes.ok
        ? ((await coursesRes.json()) as Course[])
        : [];

      const classNames = Array.isArray(existingCourses)
        ? existingCourses
            .map((course) => course.name?.trim())
            .filter((name): name is string => !!name)
        : [];

      const extractRes = await fetch("/api/extract-assignment-details", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          description: description.trim(),
          classes: classNames,
          assignmentTypes: ASSIGNMENT_TYPES,
        }),
      });

      const extracted =
        (await extractRes.json().catch(() => ({}))) as Partial<ExtractionResult>;

      if (!extractRes.ok) {
        throw new Error(
          (extracted as { error?: string })?.error ||
            "Failed to detect assignment details."
        );
      }

      const courseId = await findOrCreateCourse(userId, extracted.courseName ?? null);

      const title =
        typeof extracted.title === "string" && extracted.title.trim()
          ? extracted.title.trim()
          : "Untitled Assignment";

      const body: {
        title: string;
        description: string;
        userId: number;
        courseId: number | null;
        weight?: number;
        dueAt?: string;
        assignmentType: string | null;
        problemCount: number | null;
        pageCount: number | null;
        summary: string | null;
        checklistOverview: string | null;
        checklistItems: {
          id: string;
          step: string;
          minutes: number;
          dueDate: string;
          checked: boolean;
        }[];
        priority: string | null;
        status: string | null;
        notes: string | null;
      } = {
        title,
        description: description.trim(),
        userId,
        courseId: courseId ?? null,
        assignmentType:
          typeof extracted.assignmentType === "string" &&
          extracted.assignmentType.trim()
            ? extracted.assignmentType.trim()
            : null,
        problemCount:
          typeof extracted.problemCount === "number" &&
          Number.isFinite(extracted.problemCount)
            ? extracted.problemCount
            : null,
        pageCount:
          typeof extracted.pageCount === "number" &&
          Number.isFinite(extracted.pageCount)
            ? extracted.pageCount
            : null,
        summary:
          typeof extracted.summary === "string" && extracted.summary.trim()
            ? extracted.summary.trim()
            : null,
        checklistOverview: null,
        checklistItems: [],
        priority:
          typeof extracted.priority === "string" && extracted.priority.trim()
            ? extracted.priority.trim().toLowerCase()
            : "medium",
        status:
          typeof extracted.status === "string" && extracted.status.trim()
            ? extracted.status.trim().toLowerCase()
            : "not_started",
        notes:
          typeof extracted.notes === "string" && extracted.notes.trim()
            ? extracted.notes.trim()
            : null,
      };

      if (
        typeof extracted.weight === "number" &&
        Number.isFinite(extracted.weight)
      ) {
        body.weight = extracted.weight;
      }

      if (typeof extracted.dueAt === "string" && extracted.dueAt.trim()) {
        const parsedDate = new Date(extracted.dueAt);
        if (!Number.isNaN(parsedDate.getTime())) {
          body.dueAt = parsedDate.toISOString();
        }
      }

      const res = await fetch("http://localhost:4000/assignments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const created = (await res.json().catch(() => ({}))) as CreatedAssignment;

      if (!res.ok) {
        throw new Error(
          (created as { message?: string })?.message ||
            "Failed to create assignment."
        );
      }

      if (!created?.id) {
        throw new Error("Saved, but no assignment id was returned.");
      }

      router.push(
        `/dashboard/input-assignments/success?id=${encodeURIComponent(
          String(created.id)
        )}&userId=${encodeURIComponent(String(created.userId ?? userId))}`
      );
    } catch (e) {
      const message =
        e instanceof Error ? e.message : "Failed to create assignment";
      setError(message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="w-full">
      <form
        onSubmit={handleSubmit}
        className="flex min-h-[calc(100vh-140px)] flex-col rounded-3xl border border-slate-200 bg-white shadow-sm"
      >
        <div className="border-b border-slate-100 px-6 py-6">
          <div className="max-w-xl space-y-2">
            <h1 className="text-2xl font-semibold text-slate-900">
              Paste assignment
            </h1>

            <p className="break-words whitespace-normal text-sm leading-relaxed text-slate-600">
              Paste the full assignment text from Canvas, email, or your syllabus.
              We’ll detect the important details and let you review them on the
              next page.
            </p>
          </div>
        </div>

        <div className="flex-1 px-8 py-4">
          <textarea
            id="assignment-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Paste the full assignment instructions here..."
            className="h-full min-h-[420px] w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 text-sm leading-6 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:bg-white focus:ring-4 focus:ring-slate-100"
          />

          <p className="mt-3 text-xs text-slate-500">
            Include the full text so the AI can catch due dates, weight, class,
            assignment type, and workload details.
          </p>

          {error ? (
            <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          ) : null}
        </div>

        <div className="flex items-center justify-end border-t border-slate-100 px-8 py-5">
          <button
            type="submit"
            disabled={!canSubmit}
            className="inline-flex items-center justify-center rounded-2xl bg-slate-900 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            {submitting ? "Detecting..." : "Continue"}
          </button>
        </div>
      </form>
    </div>
  );
}