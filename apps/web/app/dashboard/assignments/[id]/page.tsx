"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";

type Course = {
  id: number;
  name: string;
  userId: number;
  createdAt?: string;
};

type EditableChecklistItem = {
  id: string;
  step: string;
  minutes: number;
  dueDate: string;
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

  assignmentType?: string | null;
  priority?: string | null;
  status?: string | null;

  problemCount?: number | null;
  pageCount?: number | null;

  summary?: string | Record<string, unknown> | null;
  checklistOverview?: string | null;
  checklistItems?: string | EditableChecklistItem[] | null;

  notes?: string | null;
};

type SummarySections = {
  focus: string;
  content: string;
  sources: string;
  structure: string;
  formatting: string;
};

const ASSIGNMENT_TYPE_OPTIONS = [
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

const PRIORITY_OPTIONS = ["high", "medium", "low"] as const;

const STATUS_OPTIONS = [
  { value: "not_started", label: "Not started" },
  { value: "in_progress", label: "In progress" },
  { value: "done", label: "Done" },
] as const;

function makeId() {
  return Math.random().toString(36).slice(2, 10);
}

function toLocalDateInputValue(value: string | null) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;
}

function parseChecklistItems(raw: Assignment["checklistItems"]): EditableChecklistItem[] {
  if (!raw) return [];

  try {
    const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;

    if (!Array.isArray(parsed)) return [];

    return parsed.map((item) => ({
      id: String(item?.id ?? makeId()),
      step: String(item?.step ?? ""),
      minutes: Number(item?.minutes ?? 0),
      dueDate: String(item?.dueDate ?? ""),
      checked: Boolean(item?.checked),
    }));
  } catch {
    return [];
  }
}

function shouldRegenerateDates(items: EditableChecklistItem[]) {
  // if ANY item already has a custom date (user edited), don’t override
  return items.every((item) => !item.dueDate || item.dueDate.length === 10);
}

function normalizeSummary(raw: unknown): SummarySections | null {
  if (!raw) return null;

  if (typeof raw === "object" && raw !== null) {
    const obj = raw as Record<string, unknown>;
    return {
      focus: String(obj.focus ?? ""),
      content: String(obj.content ?? ""),
      sources: String(obj.sources ?? ""),
      structure: String(obj.structure ?? ""),
      formatting: String(obj.formatting ?? ""),
    };
  }

  if (typeof raw !== "string") return null;

  const text = raw.trim();
  if (!text) return null;

  try {
    const parsed = JSON.parse(text);
    if (parsed && typeof parsed === "object") {
      const obj = parsed as Record<string, unknown>;
      return {
        focus: String(obj.focus ?? ""),
        content: String(obj.content ?? ""),
        sources: String(obj.sources ?? ""),
        structure: String(obj.structure ?? ""),
        formatting: String(obj.formatting ?? ""),
      };
    }
  } catch {
    return null;
  }

  return null;
}

export default function AssignmentDetailPage() {
  const params = useParams();
  const user = getCurrentUser();

  const id = Array.isArray(params?.id) ? params.id[0] : params?.id;
  const userId = user?.id;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueAt, setDueAt] = useState("");
  const [weight, setWeight] = useState("");
  const [courseId, setCourseId] = useState("");

  const [assignmentType, setAssignmentType] = useState("");
  const [priority, setPriority] = useState("");
  const [status, setStatus] = useState("not_started");
  const [notes, setNotes] = useState("");
  const [pageCount, setPageCount] = useState("");
  const [problemCount, setProblemCount] = useState("");

  const [summary, setSummary] = useState<SummarySections | null>(null);
  const [checklistOverview, setChecklistOverview] = useState("");
  const [checklistItems, setChecklistItems] = useState<EditableChecklistItem[]>([]);

  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">(
    "idle"
  );
  const [saveError, setSaveError] = useState("");

  const hasLoadedRef = useRef(false);

  useEffect(() => {
    async function load() {
      if (!id || !userId) {
        setError("Failed to load assignment.");
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
            (assignmentData as { message?: string })?.message ||
              "Failed to load assignment."
          );
        }

        const data = assignmentData as Assignment;

        setAssignment(data);
        setCourses(Array.isArray(coursesData) ? coursesData : []);

        setTitle(data.title ?? "");
        setDescription(data.description ?? "");
        setDueAt(toLocalDateInputValue(data.dueAt));
        setWeight(
          data.weight === null || data.weight === undefined ? "" : String(data.weight)
        );
        setCourseId(
          data.courseId === null || data.courseId === undefined
            ? ""
            : String(data.courseId)
        );

        setAssignmentType(data.assignmentType ?? "");
        setPriority(data.priority ?? "");
        setStatus(data.status ?? "not_started");
        setNotes(data.notes ?? "");
        setPageCount(
          data.pageCount === null || data.pageCount === undefined
            ? ""
            : String(data.pageCount)
        );
        setProblemCount(
          data.problemCount === null || data.problemCount === undefined
            ? ""
            : String(data.problemCount)
        );

        setSummary(normalizeSummary(data.summary ?? null));
        setChecklistOverview(data.checklistOverview ?? "");
        setChecklistItems(parseChecklistItems(data.checklistItems));

        hasLoadedRef.current = true;
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load assignment.");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [id, userId]);

useEffect(() => {
  if (!hasLoadedRef.current) return;
  if (!dueAt) return;

  setChecklistItems((prev) => {
    if (!prev.length) return prev;

    const newDates = generateFallbackDates(prev.length, dueAt);

    let changed = false;

    const updated = prev.map((item, i) => {
      const nextDate = newDates[i] || item.dueDate;

      // only update if different (prevents infinite loop)
      if (item.dueDate !== nextDate) {
        changed = true;
        return { ...item, dueDate: nextDate };
      }

      return item;
    });

    return changed ? updated : prev;
  });
}, [dueAt]);

function generateFallbackDates(count: number, dueAtLocal: string) {
  if (!count) return [];

  const now = new Date();
  const due = new Date(dueAtLocal);

  const totalDays = Math.max(
    1,
    Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  );

  return Array.from({ length: count }, (_, i) => {
    const ratio = count === 1 ? 1 : i / (count - 1);
    const offset = Math.floor(ratio * totalDays);

    const d = new Date(now);
    d.setDate(now.getDate() + offset);

    return d.toISOString().slice(0, 10);
  });
}

function regenerateChecklistDates(
  items: EditableChecklistItem[],
  dueAtLocal: string
) {
  if (!items.length || !dueAtLocal) return items;

  const newDates = generateFallbackDates(items.length, dueAtLocal);

  return items.map((item, i) => ({
    ...item,
    dueDate: newDates[i] || item.dueDate,
  }));
}

  const totalMinutes = useMemo(() => {
    return checklistItems.reduce((sum, item) => sum + (Number(item.minutes) || 0), 0);
  }, [checklistItems]);

  const remainingMinutes = useMemo(() => {
    return checklistItems.reduce(
      (sum, item) => (item.checked ? sum : sum + (Number(item.minutes) || 0)),
      0
    );
  }, [checklistItems]);

  const completedCount = useMemo(() => {
    return checklistItems.filter((item) => item.checked).length;
  }, [checklistItems]);

  async function autoSave() {
    if (!assignment || !id || !userId || !hasLoadedRef.current) return;

    setSaveState("saving");
    setSaveError("");

    try {
      const body = {
        title: title.trim(),
        description: description.trim(),
        dueAt: dueAt ? new Date(`${dueAt}T23:59:00`).toISOString() : null,
        weight: weight.trim() ? Number(weight) : null,
        courseId: courseId ? Number(courseId) : null,

        assignmentType: assignmentType.trim() || null,
        priority: priority.trim() || null,
        status: status.trim() || null,
        notes: notes.trim() || null,
        pageCount: pageCount.trim() ? Number(pageCount) : null,
        problemCount: problemCount.trim() ? Number(problemCount) : null,

        summary: summary ? JSON.stringify(summary) : null,
        checklistOverview: checklistOverview.trim() || null,
        checklistItems: JSON.stringify(checklistItems),
      };

      const res = await fetch(
        `http://localhost:4000/assignments/${id}?userId=${userId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        }
      );

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(
          (data as { message?: string })?.message || "Failed to save assignment."
        );
      }

      setAssignment(data as Assignment);
      setSaveState("saved");
    } catch (e) {
      setSaveState("error");
      setSaveError(e instanceof Error ? e.message : "Failed to save assignment.");
    }
  }

  useEffect(() => {
    if (!hasLoadedRef.current) return;

    const timer = setTimeout(() => {
      autoSave();
    }, 700);

    return () => clearTimeout(timer);
  }, [
    title,
    description,
    dueAt,
    weight,
    courseId,
    assignmentType,
    priority,
    status,
    notes,
    pageCount,
    problemCount,
    summary,
    checklistOverview,
    checklistItems,
  ]);

  function updateChecklistItem(
    itemId: string,
    patch: Partial<EditableChecklistItem>
  ) {
    setChecklistItems((prev) =>
      prev.map((item) => (item.id === itemId ? { ...item, ...patch } : item))
    );
  }

  function addChecklistItem() {
    setChecklistItems((prev) => [
      ...prev,
      {
        id: makeId(),
        step: "",
        minutes: 15,
        dueDate: "",
        checked: false,
      },
    ]);
  }

  function removeChecklistItem(itemId: string) {
    setChecklistItems((prev) => prev.filter((item) => item.id !== itemId));
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

        <div className="space-y-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full border-b border-slate-200 pb-2 text-2xl font-bold outline-none"
              placeholder="Assignment title"
            />

            <div className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600">
              {saveState === "saving" && "Saving..."}
              {saveState === "saved" && "Saved"}
              {saveState === "error" && "Save failed"}
              {saveState === "idle" && "Ready"}
            </div>
          </div>

          {saveState === "error" && saveError ? (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {saveError}
            </div>
          ) : null}

          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <div>
              <label className="mb-1 block text-xs text-slate-500">Due date</label>
              <input
                type="date"
                value={dueAt}
                onChange={(e) => setDueAt(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs text-slate-500">Class</label>
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
              <label className="mb-1 block text-xs text-slate-500">Weight</label>
              <input
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs text-slate-500">Type</label>
              <select
                value={assignmentType}
                onChange={(e) => setAssignmentType(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              >
                <option value="">Select type</option>
                {ASSIGNMENT_TYPE_OPTIONS.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-xs text-slate-500">Priority</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              >
                <option value="">Select priority</option>
                {PRIORITY_OPTIONS.map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-xs text-slate-500">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              >
                {STATUS_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-xs text-slate-500">Page count</label>
              <input
                type="number"
                value={pageCount}
                onChange={(e) => setPageCount(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs text-slate-500">Problem count</label>
              <input
                type="number"
                value={problemCount}
                onChange={(e) => setProblemCount(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs text-slate-500">Details</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="min-h-[120px] w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs text-slate-500">Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Optional notes..."
              className="min-h-[90px] w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </div>

          <div className="space-y-2 rounded-xl border border-slate-200 bg-slate-50 p-4">
            <h2 className="text-lg font-semibold">AI Summary</h2>

            {summary ? (
              <div className="space-y-2 text-sm leading-relaxed">
                <p>
                  <span className="font-semibold">Focus:</span> {summary.focus}
                </p>
                <p>
                  <span className="font-semibold">Content Requirements:</span>{" "}
                  {summary.content}
                </p>
                <p>
                  <span className="font-semibold">Research Sources:</span>{" "}
                  {summary.sources}
                </p>
                <p>
                  <span className="font-semibold">Structure:</span>{" "}
                  {summary.structure}
                </p>
                <p>
                  <span className="font-semibold">Formatting & Submission:</span>{" "}
                  {summary.formatting}
                </p>
              </div>
            ) : (
              <p className="text-sm text-slate-500">No summary</p>
            )}
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Checklist</h2>
              <button
                onClick={addChecklistItem}
                className="text-sm font-medium text-blue-600"
              >
                + Add step
              </button>
            </div>

            <div className="flex flex-wrap gap-3 text-sm text-slate-600">
              <span>{completedCount}/{checklistItems.length} completed</span>
              <span>Total: {totalMinutes} min</span>
              <span>Remaining: {remainingMinutes} min</span>
            </div>

            <textarea
              value={checklistOverview}
              onChange={(e) => setChecklistOverview(e.target.value)}
              placeholder="Checklist overview..."
              rows={2}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />

            {checklistItems.length ? (
              <div className="overflow-hidden rounded-lg border border-slate-200">
                <div className="grid grid-cols-[60px_60px_1fr_100px_150px_90px] bg-slate-50 px-2 py-2 text-xs font-semibold text-slate-500">
                  <div>Done</div>
                  <div>#</div>
                  <div>Task</div>
                  <div>Min</div>
                  <div>Date</div>
                  <div></div>
                </div>

                <div className="divide-y divide-slate-200">
                  {checklistItems.map((item, index) => (
                    <div
                      key={item.id}
                      className="grid grid-cols-[60px_60px_1fr_100px_150px_90px] items-center gap-2 px-2 py-2"
                    >
                      <div className="flex justify-center">
                        <input
                          type="checkbox"
                          checked={item.checked}
                          onChange={() =>
                            updateChecklistItem(item.id, {
                              checked: !item.checked,
                            })
                          }
                        />
                      </div>

                      <div className="text-sm">{index + 1}</div>

                      <input
                        value={item.step}
                        onChange={(e) =>
                          updateChecklistItem(item.id, { step: e.target.value })
                        }
                        className="rounded border px-2 py-2 text-sm"
                      />

                      <input
                        type="number"
                        value={item.minutes}
                        onChange={(e) =>
                          updateChecklistItem(item.id, {
                            minutes: Number(e.target.value) || 0,
                          })
                        }
                        className="rounded border px-2 py-2 text-sm"
                      />

                      <input
                        type="date"
                        value={item.dueDate}
                        onChange={(e) =>
                          updateChecklistItem(item.id, {
                            dueDate: e.target.value,
                          })
                        }
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
            ) : (
              <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 px-4 py-5 text-sm text-slate-500">
                No checklist yet.
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}