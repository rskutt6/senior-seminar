"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

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

  "summary": {
  "focus": "string",
  "content": "string",
  "sources": "string",
  "structure": "string",
  "formatting": "string"
}
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

type SummarizeResponse = {
  summary?: unknown;
  assignmentType?: string | null;
  priority?: string | null;
  status?: string | null;
  problemCount?: number | null;
  pageCount?: number | null;
  notes?: string | null;
};

type ChecklistApiItem = {
  step?: string;
  minutes?: number;
  dueDate?: string;
};

type ChecklistResponse = {
  overview?: string;
  checklist?: ChecklistApiItem[];
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
  { value: "completed", label: "Completed" },
] as const;

function makeId() {
  return Math.random().toString(36).slice(2, 10);
}

function isMissing(value: unknown) {
  return value === null || value === undefined || String(value).trim() === "";
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

function toLocalDateTimeInputValue(value: string | null) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";

  const pad = (n: number) => String(n).padStart(2, "0");

  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(
    d.getDate()
  )}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
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

function generateFallbackDates(count: number, dueAtLocal: string) {
  if (!count) return [];
  if (!dueAtLocal) return Array.from({ length: count }, () => "");

  const now = new Date();
  const due = new Date(dueAtLocal);
  if (Number.isNaN(due.getTime())) return Array.from({ length: count }, () => "");

  const totalDays = Math.max(
    1,
    Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  );

  return Array.from({ length: count }, (_, i) => {
    const ratio = count === 1 ? 1 : i / (count - 1);
    const offset = Math.max(0, Math.floor(ratio * totalDays));
    const d = new Date(now);
    d.setDate(now.getDate() + offset);
    return d.toISOString().slice(0, 10);
  });
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
      return {
        focus: String((parsed as Record<string, unknown>).focus ?? ""),
        content: String((parsed as Record<string, unknown>).content ?? ""),
        sources: String((parsed as Record<string, unknown>).sources ?? ""),
        structure: String((parsed as Record<string, unknown>).structure ?? ""),
        formatting: String((parsed as Record<string, unknown>).formatting ?? ""),
      };
    }
  } catch {
    // keep going
  }

  const cleaned = text.replace(/\r/g, "");
  const lines = cleaned
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  const sections: SummarySections = {
    focus: "",
    content: "",
    sources: "",
    structure: "",
    formatting: "",
  };

  const buckets: Array<keyof SummarySections> = [
    "focus",
    "content",
    "sources",
    "structure",
    "formatting",
  ];

  for (const line of lines) {
    const normalized = line.toLowerCase();

    if (
      normalized.includes("focus") ||
      normalized.includes("objective") ||
      normalized.includes("overview")
    ) {
      sections.focus = line.replace(/^\**[^:]+:\**\s*/i, "");
      continue;
    }

    if (
      normalized.includes("content") ||
      normalized.includes("key task") ||
      normalized.includes("requirement")
    ) {
      sections.content = line.replace(/^\**[^:]+:\**\s*/i, "");
      continue;
    }

    if (
      normalized.includes("source") ||
      normalized.includes("research")
    ) {
      sections.sources = line.replace(/^\**[^:]+:\**\s*/i, "");
      continue;
    }

    if (
      normalized.includes("structure") ||
      normalized.includes("outline")
    ) {
      sections.structure = line.replace(/^\**[^:]+:\**\s*/i, "");
      continue;
    }

    if (
      normalized.includes("format") ||
      normalized.includes("submission") ||
      normalized.includes("deadline")
    ) {
      sections.formatting = line.replace(/^\**[^:]+:\**\s*/i, "");
      continue;
    }
  }

  if (!sections.focus && lines.length) sections.focus = lines[0];
  if (!sections.content && lines.length > 1) sections.content = lines[1];
  if (!sections.sources && lines.length > 2) sections.sources = lines[2];
  if (!sections.structure && lines.length > 3) sections.structure = lines[3];
  if (!sections.formatting && lines.length > 4) sections.formatting = lines[4];

  const hasAnything = buckets.some((key) => sections[key].trim());
  return hasAnything ? sections : null;
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

  const [assignmentType, setAssignmentType] = useState("");
  const [priority, setPriority] = useState("");
  const [status, setStatus] = useState("not_started");
  const [problemCount, setProblemCount] = useState("");
  const [pageCount, setPageCount] = useState("");
  const [notes, setNotes] = useState("");

  const [summary, setSummary] = useState<SummarySections | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);

  const [checklistOverview, setChecklistOverview] = useState("");
  const [checklistItems, setChecklistItems] = useState<EditableChecklistItem[]>([]);
  const [checklistLoading, setChecklistLoading] = useState(false);
  const [checklistError, setChecklistError] = useState("");

  const [showCreateCourse, setShowCreateCourse] = useState(false);
  const [newCourseName, setNewCourseName] = useState("");
  const [creatingCourse, setCreatingCourse] = useState(false);
  const [courseError, setCourseError] = useState("");

  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">(
    "idle"
  );
  const [saveError, setSaveError] = useState("");

  const hasLoadedRef = useRef(false);
  const isGeneratingChecklistRef = useRef(false);

  const missingTitle = isMissing(title);
  const missingCourse = isMissing(selectedCourseId);
  const missingDueAt = isMissing(dueAtLocal);
  const missingWeight = isMissing(weight);
  const missingType = isMissing(assignmentType);
  const missingPriority = isMissing(priority);
  const missingStatus = isMissing(status);
  const missingProblemCount = isMissing(problemCount);
  const missingPageCount = isMissing(pageCount);

  const totalMinutes = useMemo(() => {
    return checklistItems.reduce((sum, item) => sum + (Number(item.minutes) || 0), 0);
  }, [checklistItems]);

  const remainingMinutes = useMemo(() => {
    return checklistItems.reduce((sum, item) => {
      return item.checked ? sum : sum + (Number(item.minutes) || 0);
    }, 0);
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

        setAssignmentType(loadedAssignment.assignmentType ?? "");
        setPriority(loadedAssignment.priority ?? "");
        setStatus(loadedAssignment.status ?? "not_started");

        setProblemCount(
          loadedAssignment.problemCount === null ||
            loadedAssignment.problemCount === undefined
            ? ""
            : String(loadedAssignment.problemCount)
        );

        setPageCount(
          loadedAssignment.pageCount === null || loadedAssignment.pageCount === undefined
            ? ""
            : String(loadedAssignment.pageCount)
        );

        setNotes("");

        setSummary(normalizeSummary(loadedAssignment.summary ?? ""));
        setChecklistOverview(loadedAssignment.checklistOverview ?? "");
        setChecklistItems(parseChecklistItems(loadedAssignment.checklistItems));

        setLoadError("");
        hasLoadedRef.current = true;
      } catch (e) {
        const message = e instanceof Error ? e.message : "Failed to load assignment";
        setLoadError(message);
      }
    }

    load();
  }, [id, userId]);

  useEffect(() => {
    async function runSummary() {
      if (!description.trim()) return;

      setSummaryLoading(true);

      try {
        const res = await fetch("/api/summarize-assignment", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ title, description }),
        });

        const data = (await res.json().catch(() => ({}))) as SummarizeResponse;

        if (!res.ok) {
          throw new Error((data as { error?: string })?.error || "Failed to summarize");
        }

        const nextSummary = normalizeSummary(data.summary);
        setSummary(nextSummary);

        if (!assignmentType && typeof data.assignmentType === "string" && data.assignmentType.trim()) {
          setAssignmentType(data.assignmentType.trim().toLowerCase());
        }

        if (!priority && typeof data.priority === "string" && data.priority.trim()) {
          setPriority(data.priority.trim().toLowerCase());
        }

        if (
          (status === "not_started" || !status) &&
          typeof data.status === "string" &&
          data.status.trim()
        ) {
          setStatus(data.status.trim().toLowerCase());
        }

        if (
          !problemCount &&
          typeof data.problemCount === "number" &&
          Number.isFinite(data.problemCount)
        ) {
          setProblemCount(String(data.problemCount));
        }

        if (
          !pageCount &&
          typeof data.pageCount === "number" &&
          Number.isFinite(data.pageCount)
        ) {
          setPageCount(String(data.pageCount));
        }
      } catch {
        setSummary(null);
      } finally {
        setSummaryLoading(false);
      }
    }

    if (!hasLoadedRef.current) return;
    runSummary();
  }, [title, description]);

  async function generateChecklist() {
    if (!description.trim()) return;

    isGeneratingChecklistRef.current = true;
    setChecklistLoading(true);
    setChecklistError("");

    try {
      const res = await fetch("/api/generate-checklist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, description, dueAt: dueAtLocal }),
      });

      const data = (await res.json().catch(() => ({}))) as ChecklistResponse;

      if (!res.ok) {
        throw new Error(
          (data as { error?: string })?.error || "Failed to generate checklist"
        );
      }

      const rawItems = Array.isArray(data.checklist) ? data.checklist : [];
      const fallbackDates = generateFallbackDates(rawItems.length, dueAtLocal);

      const mapped: EditableChecklistItem[] = rawItems.map((item, index) => ({
        id: makeId(),
        step: String(item?.step ?? ""),
        minutes: Number(item?.minutes ?? 0),
        dueDate:
          typeof item?.dueDate === "string" && item.dueDate.trim()
            ? item.dueDate
            : fallbackDates[index] || "",
        checked: false,
      }));

      setChecklistOverview(
        typeof data.overview === "string" ? data.overview : ""
      );
      setChecklistItems(mapped);
    } catch (e) {
      setChecklistError(
        e instanceof Error ? e.message : "Failed to generate checklist"
      );
    } finally {
      setChecklistLoading(false);
      isGeneratingChecklistRef.current = false;
    }
  }

  useEffect(() => {
    if (!hasLoadedRef.current) return;
    if (checklistItems.length > 0) return;
    if (!description.trim()) return;

    generateChecklist();
  }, [description, dueAtLocal]);

  async function autoSave() {
    if (!assignment || !userId || !hasLoadedRef.current) return;
    if (isGeneratingChecklistRef.current) return;

    setSaveState("saving");
    setSaveError("");

    try {
      const summaryPayload = summary ? JSON.stringify(summary) : null;

      const body = {
        title: title.trim(),
        description: description.trim(),
        courseId: selectedCourseId.trim() ? Number(selectedCourseId) : null,
        weight: weight.trim() ? Number(weight) : null,
        dueAt: dueAtLocal.trim() ? new Date(dueAtLocal).toISOString() : null,

        assignmentType: assignmentType.trim() || null,
        priority: priority.trim() || null,
        status: status.trim() || null,

        problemCount: problemCount.trim() ? Number(problemCount) : null,
        pageCount: pageCount.trim() ? Number(pageCount) : null,

        notes: notes.trim() || null,
        summary: summaryPayload,
        checklistOverview: checklistOverview.trim() || null,
        checklistItems: JSON.stringify(checklistItems),
      };

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
      setSaveState("saved");
    } catch (e) {
      setSaveState("error");
      setSaveError(e instanceof Error ? e.message : "Failed to save changes");
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
    weight,
    dueAtLocal,
    selectedCourseId,
    assignmentType,
    priority,
    status,
    problemCount,
    pageCount,
    notes,
    summary,
    checklistOverview,
    checklistItems,
  ]);

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

  return (
    <main className="mx-auto w-full max-w-[920px] text-slate-900">
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
            <p className="mt-1 text-sm text-slate-600">
              Check the detected details and fix anything if needed.
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Fields marked with <span className="text-red-500">*</span> were not detected by AI.
              You can still continue without filling them.
            </p>

            <div className="mt-4 flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => router.push("/dashboard/input-assignments")}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Add another assignment
              </button>

              <button
                type="button"
                onClick={() => router.push("/dashboard")}
                className="rounded-xl bg-slate-900 px-5 py-2 text-sm font-medium text-white hover:bg-slate-800"
              >
                Done
              </button>

              <div className="ml-auto rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600">
                {saveState === "saving" && "Saving..."}
                {saveState === "saved" && "Saved"}
                {saveState === "error" && "Save failed"}
                {saveState === "idle" && "Ready"}
              </div>
            </div>
          </div>

          <div className="space-y-6 px-4 py-4">
            {saveState === "error" && saveError ? (
              <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {saveError}
              </div>
            ) : null}

            <section className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  <RequiredLabel label="Title" missing={missingTitle} />
                </label>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-100"
                />
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <div className="mb-1 flex items-center justify-between">
                    <label className="text-sm font-medium text-slate-700">
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
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-100"
                  >
                    <option value="">Select class</option>
                    {courses.map((course) => (
                      <option key={course.id} value={String(course.id)}>
                        {course.name}
                      </option>
                    ))}
                  </select>

                  {showCreateCourse ? (
                    <div className="mt-2 rounded-xl border border-slate-200 bg-slate-50 p-3">
                      <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-slate-500">
                        New class name
                      </label>

                      <div className="flex flex-col gap-2 sm:flex-row">
                        <input
                          value={newCourseName}
                          onChange={(e) => setNewCourseName(e.target.value)}
                          placeholder="Ex: COMP 315"
                          className="flex-1 rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-100"
                        />
                        <button
                          type="button"
                          onClick={handleCreateCourse}
                          disabled={creatingCourse}
                          className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
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
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    <RequiredLabel label="Due date" missing={missingDueAt} />
                  </label>
                  <input
                    type="datetime-local"
                    value={dueAtLocal}
                    onChange={(e) => setDueAtLocal(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-100"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    <RequiredLabel label="Weight (%)" missing={missingWeight} />
                  </label>
                  <input
                    type="number"
                    value={weight}
                    onChange={(e) => setWeight(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-100"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    <RequiredLabel label="Type" missing={missingType} />
                  </label>
                  <select
                    value={assignmentType}
                    onChange={(e) => setAssignmentType(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-100"
                  >
                    <option value="">Select type</option>
                    {ASSIGNMENT_TYPE_OPTIONS.map((type) => (
                      <option key={type} value={type}>
                        {type.charAt(0).toUpperCase() + type.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    <RequiredLabel label="Priority" missing={missingPriority} />
                  </label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-100"
                  >
                    <option value="">Select</option>
                    {PRIORITY_OPTIONS.map((value) => (
                      <option key={value} value={value}>
                        {value.charAt(0).toUpperCase() + value.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    <RequiredLabel label="Status" missing={missingStatus} />
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-100"
                  >
                    {STATUS_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    <RequiredLabel label="Page count" missing={missingPageCount} />
                  </label>
                  <input
                    type="number"
                    value={pageCount}
                    onChange={(e) => setPageCount(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-100"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    <RequiredLabel label="Problem count" missing={missingProblemCount} />
                  </label>
                  <input
                    type="number"
                    value={problemCount}
                    onChange={(e) => setProblemCount(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-100"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Assignment description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={8}
                  className="w-full rounded-xl border border-slate-300 px-3 py-3 text-sm leading-6 outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-100"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Notes
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  placeholder="Optional notes..."
                  className="w-full rounded-xl border border-slate-300 px-3 py-3 text-sm leading-6 outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-100"
                />
              </div>
            </section>

            <section className="space-y-3 border-t border-slate-100 pt-4">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">AI Summary</h2>
                <p className="mt-1 text-sm text-slate-600">
                  Short version of the assignment.
                </p>
              </div>

              {!summaryLoading && !summary ? (
                <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500">
                  No summary
                </div>
              ) : (
                <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-7 text-slate-800">
                  {summaryLoading ? (
                    "Summarizing..."
                  ) : (
                    <div className="space-y-3">
                      {summary?.focus ? (
                        <p>
                          <span className="font-semibold">Focus:</span> {summary.focus}
                        </p>
                      ) : null}

                      {summary?.content ? (
                        <p>
                          <span className="font-semibold">Content Requirements:</span>{" "}
                          {summary.content}
                        </p>
                      ) : null}

                      {summary?.sources ? (
                        <p>
                          <span className="font-semibold">Research Sources:</span>{" "}
                          {summary.sources}
                        </p>
                      ) : null}

                      {summary?.structure ? (
                        <p>
                          <span className="font-semibold">Structure:</span>{" "}
                          {summary.structure}
                        </p>
                      ) : null}

                      {summary?.formatting ? (
                        <p>
                          <span className="font-semibold">Formatting & Submission:</span>{" "}
                          {summary.formatting}
                        </p>
                      ) : null}
                    </div>
                  )}
                </div>
              )}
            </section>

            <section className="space-y-3 border-t border-slate-100 pt-4">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">Checklist</h2>
                  <p className="mt-1 text-sm text-slate-600">
                    Edit tasks, dates, and time estimates.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={addChecklistItem}
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Add item
                </button>
              </div>

              {checklistError ? (
                <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                  {checklistError}
                </div>
              ) : null}

              <div className="flex flex-wrap gap-2">
                <div className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-700">
                  {completedCount}/{checklistItems.length} completed
                </div>
                <div className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-700">
                  Total: {totalMinutes} min
                </div>
                <div className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-700">
                  Remaining: {remainingMinutes} min
                </div>
              </div>

              <textarea
                value={checklistOverview}
                onChange={(e) => setChecklistOverview(e.target.value)}
                placeholder="Checklist overview..."
                rows={2}
                className="w-full rounded-xl border border-slate-300 px-3 py-3 text-sm leading-6 text-slate-900 outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-100"
              />

              {!checklistItems.length && !checklistLoading ? (
                <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-5 text-sm text-slate-500">
                  No checklist yet.
                </div>
              ) : null}

              {checklistItems.length ? (
                <div className="overflow-x-auto rounded-xl border border-slate-200">
                  <table className="w-full border-collapse text-sm text-slate-900">
                    <thead className="bg-slate-50 text-slate-600">
                      <tr>
                        <th className="w-16 border-b border-slate-200 px-3 py-2 text-left font-semibold">
                          ✓
                        </th>
                        <th className="w-16 border-b border-slate-200 px-3 py-2 text-left font-semibold">
                          #
                        </th>
                        <th className="border-b border-slate-200 px-3 py-2 text-left font-semibold">
                          Task
                        </th>
                        <th className="w-28 border-b border-slate-200 px-3 py-2 text-left font-semibold">
                          Min
                        </th>
                        <th className="w-40 border-b border-slate-200 px-3 py-2 text-left font-semibold">
                          Date
                        </th>
                        <th className="w-24 border-b border-slate-200 px-3 py-2 text-left font-semibold">
                          Action
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      {checklistItems.map((item, index) => (
                        <tr
                          key={item.id}
                          className="border-b border-slate-200 last:border-b-0"
                        >
                          <td className="px-3 py-2 align-middle">
                            <input
                              type="checkbox"
                              checked={item.checked}
                              onChange={() =>
                                updateChecklistItem(item.id, {
                                  checked: !item.checked,
                                })
                              }
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
                              onChange={(e) =>
                                updateChecklistItem(item.id, {
                                  step: e.target.value,
                                })
                              }
                              className={`w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-100 ${
                                item.checked ? "text-slate-400 line-through" : "text-slate-900"
                              }`}
                              placeholder={`Step ${index + 1} task`}
                            />
                          </td>

                          <td className="px-3 py-2 align-middle">
                            <input
                              type="number"
                              min={0}
                              value={item.minutes}
                              onChange={(e) =>
                                updateChecklistItem(item.id, {
                                  minutes: Number.isFinite(Number(e.target.value))
                                    ? Number(e.target.value)
                                    : 0,
                                })
                              }
                              className="w-24 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-100"
                            />
                          </td>

                          <td className="px-3 py-2 align-middle">
                            <input
                              type="date"
                              value={item.dueDate}
                              onChange={(e) =>
                                updateChecklistItem(item.id, {
                                  dueDate: e.target.value,
                                })
                              }
                              className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-100"
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