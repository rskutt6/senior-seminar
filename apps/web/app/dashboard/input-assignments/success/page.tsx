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
    <main className="min-h-screen w-full px-4 py-6 text-black md:px-6">
      <div className="mx-auto w-full max-w-5xl">
        <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="m-0 text-3xl font-bold tracking-tight">
              Assignment created ✅
            </h1>
            <p className="mt-2 text-sm text-black/70">
              Review, edit, and plan your work.
            </p>
          </div>

          <button
            className="whitespace-nowrap rounded-xl border border-black/10 bg-white px-4 py-2 text-sm text-black transition hover:bg-black/5"
            onClick={() => router.push(`/dashboard/input-assignments?userId=${userId}`)}
          >
            Add another
          </button>
        </div>

        {loadError && (
          <div className="mb-4 rounded-xl border border-red-400/40 bg-red-100 px-4 py-3 text-sm text-black">
            {loadError}
          </div>
        )}

        {assignment && (
          <div className="flex flex-col gap-4">
            <section className="w-full overflow-hidden rounded-2xl border border-black/10 bg-white p-5 shadow-[0_10px_30px_rgba(0,0,0,0.08)]">
              <div className="mb-4 text-lg font-bold text-black">
                Assignment details
              </div>

              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <div className="min-w-0 rounded-xl border border-black/10 bg-neutral-50 p-3">
                  <div className="mb-1 text-xs text-black/65">Title</div>
                  <div className="break-words text-base font-semibold leading-6">
                    {assignment.title?.trim() || "Not set"}
                  </div>
                </div>

                <div className="min-w-0 rounded-xl border border-black/10 bg-neutral-50 p-3">
                  <div className="mb-1 text-xs text-black/65">Class</div>
                  <div className="break-words text-base font-semibold leading-6">
                    {assignment.courseId
                      ? courseLabel || `Course #${assignment.courseId}`
                      : "No course selected"}
                  </div>
                </div>

                <div className="min-w-0 rounded-xl border border-black/10 bg-neutral-50 p-3">
                  <div className="mb-1 text-xs text-black/65">Due</div>
                  <div className="break-words text-base font-semibold leading-6">
                    {prettyDue}
                  </div>
                </div>

                <div className="min-w-0 rounded-xl border border-black/10 bg-neutral-50 p-3">
                  <div className="mb-1 text-xs text-black/65">Weight</div>
                  <div className="break-words text-base font-semibold leading-6">
                    {assignment.weight === null || assignment.weight === undefined
                      ? "Not set"
                      : `${assignment.weight}%`}
                  </div>
                </div>
              </div>

              <div className="mt-3">
                <div className="mb-1 text-xs text-black/65">Details</div>
                <div className="w-full whitespace-pre-wrap break-words rounded-xl border border-black/10 bg-white p-3 leading-6">
                  {assignment.description}
                </div>
              </div>
            </section>

            <section className="w-full overflow-hidden rounded-2xl border border-black/10 bg-white p-5 shadow-[0_10px_30px_rgba(0,0,0,0.08)]">
              <div className="text-lg font-bold text-black">AI summary</div>
              <div className="mb-3 text-sm text-black/70">
                Short version of the assignment.
              </div>

              <div className="w-full whitespace-pre-wrap break-words rounded-xl border border-black/10 bg-white p-3 leading-6">
                {summaryLoading ? "Summarizing…" : summary || "No summary"}
              </div>
            </section>

            <section className="w-full overflow-hidden rounded-2xl border border-black/10 bg-white p-5 shadow-[0_10px_30px_rgba(0,0,0,0.08)]">
              <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="text-lg font-bold text-black">Checklist</div>
                  <div className="text-sm text-black/70">
                    Edit tasks, rename them, change minutes, add items, or remove them.
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    className="whitespace-nowrap rounded-xl border border-black/10 bg-white px-4 py-2 text-sm text-black transition hover:bg-black/5"
                    type="button"
                    onClick={addChecklistItem}
                  >
                    + Add item
                  </button>

                  <button
                    className={`whitespace-nowrap rounded-xl border px-4 py-2 text-sm font-semibold transition ${
                      checklistLoading
                        ? "cursor-not-allowed border-black/10 bg-neutral-100 text-black/50"
                        : "border-black/10 bg-neutral-100 text-black hover:bg-neutral-200"
                    }`}
                    type="button"
                    onClick={handleGenerateChecklist}
                    disabled={checklistLoading}
                  >
                    {checklistLoading ? "Generating…" : "Generate checklist"}
                  </button>
                </div>
              </div>

              {checklistError && (
                <div className="mb-3 rounded-xl border border-red-400/40 bg-red-100 px-4 py-3 text-sm text-black">
                  {checklistError}
                </div>
              )}

              <div className="mb-3 flex flex-wrap gap-2">
                <div className="rounded-full border border-black/10 bg-neutral-100 px-3 py-1 text-xs text-black">
                  Total time: {totalMinutes} min
                </div>
                <div className="rounded-full border border-black/10 bg-neutral-100 px-3 py-1 text-xs text-black">
                  {completedCount}/{checklistItems.length} completed
                </div>
              </div>

              <textarea
                value={checklistOverview}
                onChange={(e) => setChecklistOverview(e.target.value)}
                placeholder="Checklist overview..."
                className="mb-3 min-h-[72px] w-full resize-y rounded-xl border border-black/15 bg-white px-3 py-3 text-sm text-black outline-none"
              />

              {!checklistItems.length && !checklistLoading && (
                <div className="rounded-xl border border-black/10 bg-white p-3 text-sm text-black/65">
                  No checklist yet.
                </div>
              )}

              {!!checklistItems.length && (
                <div className="w-full overflow-x-auto pb-1">
                  <div className="min-w-[640px] space-y-2">
                    <div className="grid grid-cols-[64px_minmax(260px,1fr)_110px_110px] items-center gap-3 px-1 text-xs text-black/60">
                      <div>Done</div>
                      <div>Task</div>
                      <div>Minutes</div>
                      <div>Action</div>
                    </div>

                    {checklistItems.map((item) => (
                      <div
                        key={item.id}
                        className="grid min-w-[640px] grid-cols-[64px_minmax(260px,1fr)_110px_110px] items-center gap-3 rounded-xl border border-black/10 bg-white p-3"
                      >
                        <div className="flex justify-center">
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
                          className={`w-full min-w-0 rounded-lg border border-black/15 bg-white px-3 py-2 text-sm text-black outline-none ${
                            item.checked ? "line-through opacity-60" : ""
                          }`}
                        />

                        <input
                          type="number"
                          min={0}
                          value={item.minutes}
                          onChange={(e) => updateStepMinutes(item.id, e.target.value)}
                          className="w-full min-w-0 rounded-lg border border-black/15 bg-white px-3 py-2 text-sm text-black outline-none"
                        />

                        <button
                          type="button"
                          onClick={() => removeChecklistItem(item.id)}
                          className="w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-sm text-black transition hover:bg-black/5"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </section>
          </div>
        )}
      </div>
    </main>
  );
}
