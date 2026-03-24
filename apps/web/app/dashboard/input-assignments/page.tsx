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
};

type ExtractionResult = {
  title: string | null;
  courseName: string | null;
  dueAt: string | null;
  weight: number | null;
  summaryHint: string;
};

type Course = {
  id: number;
  name: string;
  userId: number;
  createdAt: string;
};

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

      const extractRes = await fetch("/api/extract-assignment-details", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description: description.trim() }),
      });

      const extracted = (await extractRes.json().catch(() => ({}))) as Partial<ExtractionResult>;

      if (!extractRes.ok) {
        throw new Error(
          (extracted as any)?.error || "Failed to detect assignment details."
        );
      }

      const courseId = await findOrCreateCourse(userId, extracted.courseName ?? null);

      const title =
        typeof extracted.title === "string" && extracted.title.trim()
          ? extracted.title.trim()
          : "Untitled Assignment";

      const body: any = {
        title,
        description: description.trim(),
        userId,
        courseId: courseId ?? null,
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
        throw new Error((created as any)?.message || "Failed to create assignment.");
      }

      if (!created?.id) {
        throw new Error("Saved, but no assignment id was returned.");
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
    <main className="w-full px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-4xl">
        <header className="mb-6">
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
            Paste assignment
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            Paste the full assignment description and we’ll detect the important
            details for you.
          </p>
        </header>

        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <label
                htmlFor="assignment-description"
                className="text-sm font-medium text-slate-800"
              >
                Assignment description
              </label>

              <textarea
                id="assignment-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Paste the full assignment instructions here..."
                rows={16}
                className="min-h-[320px] w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
              />
            </div>

            {error ? (
              <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            ) : null}

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={!canSubmit}
                className="inline-flex items-center rounded-2xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                {submitting ? "Detecting and saving..." : "Submit"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </main>
  );
}