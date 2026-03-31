"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";

type ChecklistItem = {
  id: string;
  step: string;
  minutes: number;
  checked: boolean;
};

type Assignment = {
  id: number;
  title: string | null;
  description: string;
  weight: number | null;
  dueAt: string | null;
  userId: number;
  courseId: number | null;
};

type Course = {
  id: number;
  name: string;
  userId: number;
  createdAt?: string;
};

export default function AssignmentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const user = getCurrentUser();

  const id = Array.isArray(params?.id) ? params.id[0] : params?.id;
  const userId = user?.id;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueAt, setDueAt] = useState("");
  const [weight, setWeight] = useState("");
  const [courseId, setCourseId] = useState("");
  const [summary, setSummary] = useState("");

  const [courses, setCourses] = useState<Course[]>([]);
  const [checklistItems, setChecklistItems] = useState<ChecklistItem[]>([]);

  useEffect(() => {
    async function load() {
      if (!id || !userId) {
        setError("Failed to load assignment");
        setLoading(false);
        return;
      }

      try {
        const [assignmentRes, coursesRes] = await Promise.all([
          fetch(`http://localhost:4000/assignments/${id}?userId=${userId}`, {
            cache: "no-store",
          }),
          fetch(`http://localhost:4000/courses?userId=${userId}`, {
            cache: "no-store",
          }),
        ]);

        const assignmentData = await assignmentRes.json().catch(() => ({}));
        const coursesData = await coursesRes.json().catch(() => []);

        if (!assignmentRes.ok) {
          throw new Error(
            assignmentData?.message || "Failed to load assignment"
          );
        }

        const data = assignmentData as Assignment;

        setCourses(Array.isArray(coursesData) ? coursesData : []);
        setTitle(data.title || "");
        setDescription(data.description || "");
        setDueAt(data.dueAt ? data.dueAt.slice(0, 10) : "");
        setWeight(
          data.weight === null || data.weight === undefined
            ? ""
            : String(data.weight)
        );
        setCourseId(
          data.courseId === null || data.courseId === undefined
            ? ""
            : String(data.courseId)
        );

        try {
          const summaryRes = await fetch("/api/summarize-assignment", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              title: data.title ?? "",
              description: data.description ?? "",
            }),
          });

          const summaryData = await summaryRes.json().catch(() => ({}));
          setSummary(summaryRes.ok ? summaryData.summary || "" : "");
        } catch {
          setSummary("");
        }

        setChecklistItems([
          {
            id: "1",
            step: "Understand assignment",
            minutes: 30,
            checked: false,
          },
          {
            id: "2",
            step: "Start work",
            minutes: 60,
            checked: false,
          },
        ]);
      } catch (e) {
        setError(
          e instanceof Error ? e.message : "Failed to load assignment"
        );
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [id, userId]);

  function toggleStep(id: string) {
    setChecklistItems((items) =>
      items.map((item) =>
        item.id === id ? { ...item, checked: !item.checked } : item
      )
    );
  }

  function updateStepText(id: string, value: string) {
    setChecklistItems((items) =>
      items.map((item) =>
        item.id === id ? { ...item, step: value } : item
      )
    );
  }

  function updateStepMinutes(id: string, value: string) {
    setChecklistItems((items) =>
      items.map((item) =>
        item.id === id ? { ...item, minutes: Number(value) || 0 } : item
      )
    );
  }

  function removeChecklistItem(id: string) {
    setChecklistItems((items) => items.filter((i) => i.id !== id));
  }

  function addChecklistItem() {
    setChecklistItems((items) => [
      ...items,
      {
        id: crypto.randomUUID(),
        step: "",
        minutes: 0,
        checked: false,
      },
    ]);
  }

  if (loading) {
    return (
      <main className="mx-auto w-full max-w-[900px] px-4 py-6 text-slate-900">
        <p>Loading...</p>
      </main>
    );
  }

  if (error) {
    return (
      <main className="mx-auto w-full max-w-[900px] px-4 py-6 text-slate-900">
        <p>{error}</p>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-[900px] px-4 py-6 text-slate-900">
      <div className="space-y-4">
        <Link
          href="/dashboard/assignments"
          className="text-sm font-medium text-slate-600 underline"
        >
          ← Back to assignments
        </Link>

        <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full border-b border-slate-200 pb-2 text-2xl font-bold outline-none"
            placeholder="Assignment title"
          />

          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <div>
              <label className="text-xs text-slate-500">Due date</label>
              <input
                type="date"
                value={dueAt}
                onChange={(e) => setDueAt(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </div>

            <div>
              <label className="text-xs text-slate-500">Class</label>
              <select
                value={courseId}
                onChange={(e) => setCourseId(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              >
                <option value="">No class</option>
                {courses.map((course) => (
                  <option key={course.id} value={String(course.id)}>
                    {course.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs text-slate-500">Weight</label>
              <input
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
          </div>

          <div>
            <label className="text-xs text-slate-500">Details</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="min-h-[120px] w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label className="text-xs text-slate-500">Summary</label>
            <textarea
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              className="min-h-[80px] w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </div>

          <div className="space-y-2">
  <div className="flex items-center justify-between">
    <h2 className="text-lg font-semibold">Checklist</h2>
    <button
      onClick={addChecklistItem}
      className="text-sm text-blue-600"
    >
      + Add step
    </button>
  </div>

  {checklistItems.length ? (
    <div className="overflow-hidden rounded-lg border border-slate-200">
      {/* HEADER */}
      <div className="grid grid-cols-[60px_60px_1fr_100px_90px] bg-slate-50 px-2 py-2 text-xs font-semibold text-slate-500">
        <div>Done</div>
        <div>#</div>
        <div>Task</div>
        <div>Min</div>
        <div></div>
      </div>

      {/* ROWS */}
      <div className="divide-y divide-slate-200">
        {checklistItems.map((item, index) => (
          <div
            key={item.id}
            className="grid grid-cols-[60px_60px_1fr_100px_90px] items-center gap-2 px-2 py-2"
          >
            <div className="flex justify-center">
              <input
                type="checkbox"
                checked={item.checked}
                onChange={() => toggleStep(item.id)}
              />
            </div>

            <div className="text-sm">{index + 1}</div>

            <input
              value={item.step}
              onChange={(e) => updateStepText(item.id, e.target.value)}
              className="rounded border px-2 py-2 text-sm"
            />

            <input
              type="number"
              value={item.minutes}
              onChange={(e) => updateStepMinutes(item.id, e.target.value)}
              className="rounded border px-2 py-2 text-sm"
            />

            <button
              onClick={() => removeChecklistItem(item.id)}
              className="text-red-600 text-sm"
            >
              Remove
            </button>
          </div>
        ))}
      </div>
    </div>
  ) : null}
</div>

          <div className="flex justify-end">
            <button
              onClick={() => router.push("/dashboard/assignments")}
              className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}