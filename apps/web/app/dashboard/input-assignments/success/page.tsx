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

type Course = {
  id: number;
  name: string;
  userId: number;
  createdAt: string;
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

function toLocalDateTimeInputValue(value: string | null) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";

  const pad = (n: number) => String(n).padStart(2, "0");

  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}`;
}

function RequiredLabel({
  label,
  missing,
}: {
  label: string;
  missing: boolean;
}) {
  return (
    <span>
      {label}
      {missing ? <span className="ml-1 text-red-500">*</span> : null}
    </span>
  );
}

export default function InputAssignmentSuccessPage() {
  const params = useSearchParams();
  const router = useRouter();

  const id = params.get("id");
  const userId = params.get("userId");

  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loadError, setLoadError] = useState("");

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [weight, setWeight] = useState("");
  const [dueAtLocal, setDueAtLocal] = useState("");
  const [selectedCourseId, setSelectedCourseId] = useState("");

  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");
  const [saveError, setSaveError] = useState("");

  const [summary, setSummary] = useState("");
  const [summaryLoading, setSummaryLoading] = useState(false);

  const [checklistLoading, setChecklistLoading] = useState(false);
  const [checklistError, setChecklistError] = useState("");
  const [checklistOverview, setChecklistOverview] = useState("");
  const [checklistItems, setChecklistItems] = useState<EditableChecklistItem[]>([]);

  const missingTitle = !title.trim();
  const missingCourse = !selectedCourseId.trim();
  const missingDueAt = !dueAtLocal.trim();
  const missingWeight = !weight.trim();

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
        const courseData = await coursesRes.json().catch(() => []);

        if (!assignmentRes.ok) {
          throw new Error(assignmentData.message || "Failed to load assignment");
        }

        const loadedAssignment = assignmentData as Assignment;

        setAssignment(loadedAssignment);
        setCourses(Array.isArray(courseData) ? courseData : []);

        setTitle(loadedAssignment.title ?? "");
        setDescription(loadedAssignment.description ?? "");
        setWeight(
          loadedAssignment.weight === null || loadedAssignment.weight === undefined
            ? ""
            : String(loadedAssignment.weight)
        );
        setDueAtLocal(toLocalDateTimeInputValue(loadedAssignment.dueAt));
        setSelectedCourseId(
          loadedAssignment.courseId === null || loadedAssignment.courseId === undefined
            ? ""
            : String(loadedAssignment.courseId)
        );
      } catch (e: any) {
        setLoadError(e.message || "Failed to load assignment");
      }
    }

    load();
  }, [id, userId]);

  useEffect(() => {
    async function summarize() {
      if (!description.trim()) return;

      setSummaryLoading(true);
      try {
        const res = await fetch("/api/summarize-assignment", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title,
            description,
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
  }, [title, description]);

  useEffect(() => {
    async function generateChecklist() {
      if (!description.trim()) return;

      setChecklistLoading(true);
      setChecklistError("");

      try {
        const res = await fetch("/api/generate-checklist", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title,
            description,
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

    generateChecklist();
  }, [title, description]);

  async function handleSaveChanges() {
    if (!assignment || !userId) return;

    setSaving(true);
    setSaveError("");
    setSaveMessage("");

    try {
      const body: any = {
        title: title.trim(),
        description: description.trim(),
        courseId: selectedCourseId.trim() ? Number(selectedCourseId) : null,
        weight: weight.trim() ? Number(weight) : null,
        dueAt: dueAtLocal.trim() ? new Date(dueAtLocal).toISOString() : null,
      };

      if (!body.title) {
        throw new Error("Title is required.");
      }

      if (!body.description) {
        throw new Error("Description is required.");
      }

      if (weight.trim() && !Number.isFinite(body.weight)) {
        throw new Error("Weight must be a valid number.");
      }

      if (dueAtLocal.trim() && Number.isNaN(new Date(dueAtLocal).getTime())) {
        throw new Error("Due date is invalid.");
      }

      const res = await fetch(
        `http://localhost:4000/assignments/${assignment.id}?userId=${userId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        }
      );

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.message || "Failed to save changes");
      }

      setAssignment(data);
      setSaveMessage("Changes saved.");
    } catch (e: any) {
      setSaveError(e.message || "Failed to save changes");
    } finally {
      setSaving(false);
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
    <main className="w-full px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-5xl">
        <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
              Review assignment
            </h1>
            <p className="mt-2 text-sm text-slate-600">
              Edit anything the AI got wrong before you move on.
            </p>
          </div>

          <button
            type="button"
            onClick={() => router.push("/dashboard/input-assignments")}
            className="inline-flex items-center rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50"
          >
            Add another
          </button>
        </div>

        {loadError ? (
          <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {loadError}
          </div>
        ) : null}

        {assignment ? (
          <div className="space-y-4">
            <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
              <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">
                    Detected assignment details
                  </h2>
                  <p className="mt-1 text-sm text-slate-600">
                    Fields marked with a red asterisk still need to be filled in manually.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleSaveChanges}
                  disabled={saving}
                  className="inline-flex items-center rounded-2xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
                >
                  {saving ? "Saving..." : "Save changes"}
                </button>
              </div>

              {saveError ? (
                <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {saveError}
                </div>
              ) : null}

              {saveMessage ? (
                <div className="mb-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                  {saveMessage}
                </div>
              ) : null}

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="md:col-span-2 space-y-2">
                  <label className="text-sm font-medium text-slate-700">
                    <RequiredLabel label="Title" missing={missingTitle} />
                  </label>
                  <input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Enter assignment title"
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">
                    <RequiredLabel label="Class" missing={missingCourse} />
                  </label>
                  <select
                    value={selectedCourseId}
                    onChange={(e) => setSelectedCourseId(e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
                  >
                    <option value="">Select a class</option>
                    {courses.map((course) => (
                      <option key={course.id} value={course.id}>
                        {course.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">
                    <RequiredLabel label="Due date" missing={missingDueAt} />
                  </label>
                  <input
                    type="datetime-local"
                    value={dueAtLocal}
                    onChange={(e) => setDueAtLocal(e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">
                    <RequiredLabel label="Weight (%)" missing={missingWeight} />
                  </label>
                  <input
                    type="number"
                    value={weight}
                    onChange={(e) => setWeight(e.target.value)}
                    placeholder="20"
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
                  />
                </div>

                <div className="md:col-span-2 space-y-2">
                  <label className="text-sm font-medium text-slate-700">
                    Assignment description
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={10}
                    className="min-h-[220px] w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm leading-6 text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
                  />
                </div>
              </div>
            </section>

            <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
              <div className="mb-3">
                <h2 className="text-lg font-semibold text-slate-900">AI summary</h2>
                <p className="mt-1 text-sm text-slate-600">
                  Short version of the assignment.
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-800">
                {summaryLoading ? "Summarizing..." : summary || "No summary"}
              </div>
            </section>

            <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
              <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">Checklist</h2>
                  <p className="mt-1 text-sm text-slate-600">
                    Edit tasks, rename them, change minutes, add items, or remove them.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={addChecklistItem}
                  className="inline-flex items-center rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50"
                >
                  + Add item
                </button>
              </div>

              {checklistError ? (
                <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {checklistError}
                </div>
              ) : null}

              <div className="mb-4 flex flex-wrap gap-2">
                <div className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-700">
                  Total time: {totalMinutes} min
                </div>
                <div className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-700">
                  {completedCount}/{checklistItems.length} completed
                </div>
              </div>

              <textarea
                value={checklistOverview}
                onChange={(e) => setChecklistOverview(e.target.value)}
                placeholder="Checklist overview..."
                className="mb-4 min-h-[88px] w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm leading-6 text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
              />

              {!checklistItems.length && !checklistLoading ? (
                <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-sm text-slate-500">
                  No checklist yet.
                </div>
              ) : null}

              {checklistItems.length ? (
                <div className="space-y-3">
                  <div className="hidden grid-cols-[72px_minmax(0,1fr)_110px_90px] gap-3 px-1 text-xs font-medium uppercase tracking-wide text-slate-500 md:grid">
                    <div>Done</div>
                    <div>Task</div>
                    <div>Minutes</div>
                    <div>Action</div>
                  </div>

                  {checklistItems.map((item) => (
                    <div
                      key={item.id}
                      className="grid grid-cols-1 gap-3 rounded-2xl border border-slate-200 bg-white p-3 md:grid-cols-[72px_minmax(0,1fr)_110px_90px] md:items-center"
                    >
                      <div className="flex items-center justify-start md:justify-center">
                        <label className="inline-flex items-center gap-2 text-sm text-slate-600 md:text-xs">
                          <input
                            type="checkbox"
                            checked={item.checked}
                            onChange={() => toggleStep(item.id)}
                            className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-400"
                          />
                          <span className="md:hidden">Done</span>
                        </label>
                      </div>

                      <input
                        value={item.step}
                        onChange={(e) => updateStepText(item.id, e.target.value)}
                        placeholder="Task name"
                        className={`w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm shadow-sm outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-200 ${
                          item.checked ? "text-slate-400 line-through" : "text-slate-900"
                        }`}
                      />

                      <input
                        type="number"
                        min={0}
                        value={item.minutes}
                        onChange={(e) => updateStepMinutes(item.id, e.target.value)}
                        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
                      />

                      <button
                        type="button"
                        onClick={() => removeChecklistItem(item.id)}
                        className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              ) : null}
            </section>
          </div>
        ) : null}
      </div>
    </main>
  );
}