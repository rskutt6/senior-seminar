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

  const [showCreateCourse, setShowCreateCourse] = useState(false);
  const [newCourseName, setNewCourseName] = useState("");
  const [creatingCourse, setCreatingCourse] = useState(false);
  const [courseError, setCourseError] = useState("");

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

  async function loadCourses(currentUserId: string) {
    const res = await fetch(`http://localhost:4000/courses?userId=${currentUserId}`, {
      cache: "no-store",
    });

    const data = await res.json().catch(() => []);

    if (!res.ok) {
      throw new Error("Failed to load classes.");
    }

    setCourses(Array.isArray(data) ? data : []);
  }

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
          throw new Error(
            (assignmentData as { message?: string })?.message ||
              "Failed to load assignment."
          );
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
      } catch (e) {
        const message = e instanceof Error ? e.message : "Failed to load assignment";
        setLoadError(message);
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

        if (!res.ok) {
          throw new Error(
            (data as { message?: string })?.message || "Failed to summarize"
          );
        }

        setSummary(
          typeof (data as { summary?: string })?.summary === "string"
            ? (data as { summary: string }).summary
            : ""
        );
      } catch {
        setSummary("");
      } finally {
        setSummaryLoading(false);
      }
    }

    summarize();
  }, [title, description]);

  async function handleGenerateChecklist() {
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
        throw new Error(
          (data as { error?: string; message?: string })?.error ||
            (data as { error?: string; message?: string })?.message ||
            "Failed to generate checklist"
        );
      }

      const items: EditableChecklistItem[] = Array.isArray(
        (data as { checklist?: ChecklistItem[] }).checklist
      )
        ? ((data as { checklist: ChecklistItem[] }).checklist || []).map((item) => ({
            id: makeId(),
            step: item.step,
            minutes: item.minutes,
            checked: false,
          }))
        : [];

      setChecklistOverview(
        typeof (data as { overview?: string })?.overview === "string"
          ? (data as { overview: string }).overview
          : ""
      );
      setChecklistItems(items);
    } catch (e) {
      const message =
        e instanceof Error ? e.message : "Failed to generate checklist";
      setChecklistError(message);
    } finally {
      setChecklistLoading(false);
    }
  }

  useEffect(() => {
    handleGenerateChecklist();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title, description]);

  async function handleSaveChanges() {
    if (!assignment || !userId) return;

    setSaving(true);
    setSaveError("");
    setSaveMessage("");

    try {
      const body: {
        title: string;
        description: string;
        courseId: number | null;
        weight: number | null;
        dueAt: string | null;
      } = {
        title: title.trim(),
        description: description.trim(),
        courseId: selectedCourseId.trim() ? Number(selectedCourseId) : null,
        weight: weight.trim() ? Number(weight) : null,
        dueAt: dueAtLocal.trim() ? new Date(dueAtLocal).toISOString() : null,
      };

      if (!body.title) throw new Error("Title is required.");
      if (!body.description) throw new Error("Description is required.");
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
        throw new Error(
          (data as { message?: string })?.message || "Failed to save changes"
        );
      }

      setAssignment(data as Assignment);
      setSaveMessage("Changes saved.");
    } catch (e) {
      const message = e instanceof Error ? e.message : "Failed to save changes";
      setSaveError(message);
    } finally {
      setSaving(false);
    }
  }

  async function handleCreateCourse() {
    if (!userId) return;

    const trimmed = newCourseName.trim();
    if (!trimmed) {
      setCourseError("Enter a class name.");
      return;
    }

    setCreatingCourse(true);
    setCourseError("");

    try {
      const existing = courses.find(
        (course) => course.name.trim().toLowerCase() === trimmed.toLowerCase()
      );

      if (existing) {
        setSelectedCourseId(String(existing.id));
        setShowCreateCourse(false);
        setNewCourseName("");
        return;
      }

      const res = await fetch(`http://localhost:4000/courses?userId=${userId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: trimmed }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(
          (data as { message?: string })?.message || "Failed to create class."
        );
      }

      await loadCourses(userId);
      if ((data as { id?: number })?.id) {
        setSelectedCourseId(String((data as { id: number }).id));
      }

      setShowCreateCourse(false);
      setNewCourseName("");
    } catch (e) {
      const message = e instanceof Error ? e.message : "Failed to create class.";
      setCourseError(message);
    } finally {
      setCreatingCourse(false);
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
    <main
      className="
        mx-auto w-full max-w-[920px]
        text-slate-900
        [&_p]:m-0
        [&_p]:text-slate-600
        [&_p]:leading-6
        [&_label]:m-0
        [&_label]:text-slate-700
        [&_input]:text-slate-900
        [&_select]:text-slate-900
        [&_textarea]:text-slate-900
      "
    >
      {loadError ? (
        <div className="mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {loadError}
        </div>
      ) : null}

      {assignment ? (
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-4 py-4">
            <h1 className="text-[28px] font-semibold tracking-tight text-slate-900">
              Review assignment
            </h1>
            <p className="mt-1 text-sm">
              Check the detected details, fix anything that is wrong, and edit the checklist before you move on.
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Fields marked with a red asterisk still need to be filled in.
            </p>

            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => router.push("/dashboard/input-assignments")}
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Add another
              </button>
              <button
                type="button"
                onClick={handleSaveChanges}
                disabled={saving}
                className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                {saving ? "Saving..." : "Save changes"}
              </button>
            </div>
          </div>

          <div className="space-y-5 px-4 py-4">
            {saveError ? (
              <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {saveError}
              </div>
            ) : null}

            {saveMessage ? (
              <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
                {saveMessage}
              </div>
            ) : null}

            <section className="space-y-3">
              <div>
                <label className="mb-1 block text-sm font-medium">
                  <RequiredLabel label="Title" missing={missingTitle} />
                </label>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-100"
                />
              </div>

              <div className="grid grid-cols-1 gap-0 md:grid-cols-1">
                <div>
                  <div className="mb-1 flex items-center justify-between">
                    <label className="text-sm font-medium">
                      <RequiredLabel label="Class" missing={missingCourse} />
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setShowCreateCourse((prev) => !prev);
                        setCourseError("");
                      }}
                      className="text-xs font-medium text-slate-600 hover:text-slate-900"
                    >
                      {showCreateCourse ? "Cancel" : "+ New class"}
                    </button>
                  </div>

                  <select
                    value={selectedCourseId}
                    onChange={(e) => setSelectedCourseId(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-100"
                  >
                    <option value="">Select a class</option>
                    {courses.map((course) => (
                      <option key={course.id} value={course.id}>
                        {course.name}
                      </option>
                    ))}
                  </select>

                  {showCreateCourse ? (
                    <div className="mt-2 rounded-lg border border-slate-200 bg-slate-50 p-3">
                      <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-slate-500">
                        New class name
                      </label>
                      <div className="flex flex-col gap-2 sm:flex-row">
                        <input
                          value={newCourseName}
                          onChange={(e) => setNewCourseName(e.target.value)}
                          placeholder="Ex: COMP 315"
                          className="flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-100"
                        />
                        <button
                          type="button"
                          onClick={handleCreateCourse}
                          disabled={creatingCourse}
                          className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
                        >
                          {creatingCourse ? "Creating..." : "Create"}
                        </button>
                      </div>
                      {courseError ? (
                        <div className="mt-2 text-sm text-red-600">{courseError}</div>
                      ) : null}
                    </div>
                  ) : null}
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium">
                    <RequiredLabel label="Due date" missing={missingDueAt} />
                  </label>
                  <input
                    type="datetime-local"
                    value={dueAtLocal}
                    onChange={(e) => setDueAtLocal(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-100"
                  />
                </div>
              </div>

              <div className="max-w-[220px]">
                <label className="mb-1 block text-sm font-medium">
                  <RequiredLabel label="Weight (%)" missing={missingWeight} />
                </label>
                <input
                  type="number"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-100"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium">
                  Assignment description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={8}
                  className="w-full rounded-lg border border-slate-300 px-3 py-3 text-sm leading-6 outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-100"
                />
              </div>
            </section>

            <section className="space-y-2 border-t border-slate-100 pt-4">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">AI summary</h2>
                <p className="mt-1 text-sm">Short version of the assignment.</p>
              </div>

              <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-800 whitespace-pre-wrap">
                {summaryLoading ? "Summarizing..." : summary || "No summary"}
              </div>
            </section>

            <section className="space-y-3 border-t border-slate-100 pt-4">
  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
    <div>
      <h2 className="text-lg font-semibold text-slate-900">Checklist</h2>
      <p className="mt-1 text-sm">Edit tasks and time estimates.</p>
    </div>

    <div className="flex flex-wrap gap-2">
      <button
        type="button"
        onClick={addChecklistItem}
        className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
      >
        Add item
      </button>
      <button
        type="button"
        onClick={handleGenerateChecklist}
        disabled={checklistLoading}
        className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
      >
        {checklistLoading ? "Generating..." : "Regenerate"}
      </button>
    </div>
  </div>

  {checklistError ? (
    <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
      {checklistError}
    </div>
  ) : null}

  <div className="flex flex-wrap gap-2">
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
    rows={2}
    className="w-full rounded-lg border border-slate-300 px-3 py-3 text-sm leading-6 text-slate-900 outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-100"
  />

  {!checklistItems.length && !checklistLoading ? (
    <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 px-4 py-5 text-sm text-slate-500">
      No checklist yet.
    </div>
  ) : null}

<p className="mt-1 text-sm text-slate-600">
  Check off completed steps, edit task names, change minutes, or remove items.
</p>

 {checklistItems.length ? (
  <div className="overflow-x-auto rounded-lg border border-slate-200">
    <table className="w-full border-collapse text-sm text-slate-900">
      <thead className="bg-slate-50 text-slate-600">
        <tr>
          <th className="w-16 border-b border-slate-200 px-3 py-2 text-left font-semibold">
            Done
          </th>
          <th className="w-16 border-b border-slate-200 px-3 py-2 text-left font-semibold">
            Step
          </th>
          <th className="border-b border-slate-200 px-3 py-2 text-left font-semibold">
            Task
          </th>
          <th className="w-28 border-b border-slate-200 px-3 py-2 text-left font-semibold">
            Minutes
          </th>
          <th className="w-28 border-b border-slate-200 px-3 py-2 text-left font-semibold">
            Action
          </th>
        </tr>
      </thead>

      <tbody>
        {checklistItems.map((item, index) => (
          <tr key={item.id} className="border-b border-slate-200 last:border-b-0">
  <td className="px-3 py-2 align-middle">
    <input
      type="checkbox"
      checked={item.checked}
      onChange={() => toggleStep(item.id)}
      className="h-4 w-4"
      aria-label={`Mark step ${index + 1} complete`}
    />
  </td>

  <td className="px-3 py-2 align-middle text-slate-600">
    {index + 1}
  </td>

  <td className="px-3 py-2 align-middle">
    <input
  value={item.step}
  onChange={(e) => updateStepText(item.id, e.target.value)}
  placeholder={`Step ${index + 1} task`}
  style={{ width: "100%" }}   // ← THIS is the key
  className={`rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-100 ${
    item.checked ? "text-slate-400 line-through" : "text-slate-900"
  }`}
/>
  </td>

  <td className="px-3 py-2 align-middle">
    <input
      type="number"
      min={0}
      value={item.minutes}
      onChange={(e) => updateStepMinutes(item.id, e.target.value)}
      className="w-24 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-100"
      aria-label={`Minutes for step ${index + 1}`}
    />
  </td>

  <td className="px-3 py-2 align-middle">
    <button
      type="button"
      onClick={() => removeChecklistItem(item.id)}
      className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-red-600 hover:bg-slate-50"
    >
      Remove
    </button>
  </td>
</tr>
        ))}
      </tbody>
    </table>
  </div>
) : null}
</section>
          </div>
        </div>
      ) : null}
    </main>
  );
}