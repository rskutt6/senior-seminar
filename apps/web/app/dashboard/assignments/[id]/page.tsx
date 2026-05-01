"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";

/* ---------------- TYPES ---------------- */

type Course = {
  id: number;
  name: string;
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

  summary?: any;
  checklistOverview?: string | null;
  checklistItems?: string | EditableChecklistItem[] | null;

  notes?: string | null;
};

const PRIORITY_OPTIONS = ["high", "medium", "low"];
const STATUS_OPTIONS = [
  { value: "not_started", label: "Not started" },
  { value: "in_progress", label: "In progress" },
  { value: "done", label: "Done" },
];

/* ---------------- HELPERS ---------------- */

function makeId() {
  return Math.random().toString(36).slice(2);
}

function parseChecklistItems(raw: Assignment["checklistItems"]): EditableChecklistItem[] {
  if (!raw) return [];
  try {
    const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
    if (!Array.isArray(parsed)) return [];

    return parsed.map((i) => ({
      id: String(i?.id ?? makeId()),
      step: String(i?.step ?? ""),
      minutes: Number(i?.minutes ?? 0),
      dueDate: String(i?.dueDate ?? ""),
      checked: Boolean(i?.checked),
    }));
  } catch {
    return [];
  }
}

/* ---------------- COMPONENT ---------------- */

export default function AssignmentDetailPage() {
  const params = useParams();
  const user = getCurrentUser();

  const id = Array.isArray(params?.id) ? params.id[0] : params?.id;
  const userId = user?.id;

  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const prevDue = useRef<string | null>(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueAt, setDueAt] = useState("");
  const [courseId, setCourseId] = useState("");
  const [priority, setPriority] = useState("");
  const [status, setStatus] = useState("not_started");
  const [notes, setNotes] = useState("");

  const [checklistItems, setChecklistItems] = useState<EditableChecklistItem[]>([]);
  const hasLoadedRef = useRef(false);

  /* LOAD */
  useEffect(() => {
    if (!id || !userId) return;

    async function load() {
      const [aRes, cRes] = await Promise.all([
        fetch(`http://localhost:4000/assignments/${id}?userId=${userId}`),
        fetch(`http://localhost:4000/courses?userId=${userId}`),
      ]);

      const aData = await aRes.json();
      const cData = await cRes.json();

      setAssignment(aData);
      setCourses(cData);

      setTitle(aData.title ?? "");
      setDescription(aData.description ?? "");
      setDueAt(aData.dueAt?.slice(0, 10) ?? "");
      setCourseId(String(aData.courseId ?? ""));
      setPriority(aData.priority ?? "");
      setStatus(aData.status ?? "not_started");
      setNotes(aData.notes ?? "");

      setChecklistItems(parseChecklistItems(aData.checklistItems));
      hasLoadedRef.current = true;

      setLoading(false);
    }

    load();
  }, [id, userId]);

  useEffect(() => {
  if (!hasLoadedRef.current) return;
  if (!dueAt) return;
  if (!checklistItems.length) return;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const newDue = new Date(dueAt);
  newDue.setHours(0, 0, 0, 0);

  if (Number.isNaN(newDue.getTime())) return;

  setChecklistItems((prev) =>
    prev.map((item, i) => {
      const d = new Date(newDue);

      // Spread items backwards from due date,
      // but NEVER before today.
      d.setDate(newDue.getDate() - Math.floor((prev.length - 1 - i) / 2));

      if (d < today) {
        return {
          ...item,
          dueDate: today.toISOString().slice(0, 10),
        };
      }

      return {
        ...item,
        dueDate: d.toISOString().slice(0, 10),
      };
    })
  );
}, [dueAt]);

  /* AUTOSAVE */
  useEffect(() => {
    if (!hasLoadedRef.current || !assignment) return;

    const timer = setTimeout(async () => {
      await fetch(`http://localhost:4000/assignments/${id}?userId=${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          dueAt,
          courseId: courseId ? Number(courseId) : null,
          priority,
          status,
          notes,
          checklistItems: JSON.stringify(checklistItems),
        }),
      });
    }, 600);

    return () => clearTimeout(timer);
  }, [title, description, dueAt, courseId, priority, status, notes, checklistItems]);

  function updateItem(id: string, patch: Partial<EditableChecklistItem>) {
    setChecklistItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, ...patch } : i))
    );
  }

  function addItem() {
    setChecklistItems((prev) => [
      ...prev,
      { id: makeId(), step: "", minutes: 15, dueDate: "", checked: false },
    ]);
  }

  function removeItem(id: string) {
    setChecklistItems((prev) => prev.filter((i) => i.id !== id));
  }

  const totalMinutes = useMemo(
    () => checklistItems.reduce((s, i) => s + i.minutes, 0),
    [checklistItems]
  );

  const remainingMinutes = useMemo(
    () => checklistItems.reduce((s, i) => (i.checked ? s : s + i.minutes), 0),
    [checklistItems]
  );

  if (loading) return <main className="p-6">Loading...</main>;

  return (
    <main className="mx-auto w-full max-w-5xl px-6 py-10 text-[#6E7F5B]">
      <Link
        href="/dashboard/assignments"
        className="mb-6 inline-block text-sm underline"
      >
        ← Back to assignments
      </Link>

      <div className="space-y-8 rounded-md border border-[#6E7F5B] p-6">

        {/* TITLE */}
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full border-b border-[#6E7F5B] bg-transparent pb-2 text-3xl font-extrabold outline-none"
          placeholder="Assignment title"
        />

        {/* META */}
        <div className="grid gap-4 md:grid-cols-3">
          <input
            type="date"
            value={dueAt}
            onChange={(e) => setDueAt(e.target.value)}
            className="rounded-md border border-[#6E7F5B] px-3 py-2"
          />

          <select
            value={courseId}
            onChange={(e) => setCourseId(e.target.value)}
            className="rounded-md border border-[#6E7F5B] px-3 py-2"
          >
            <option value="">No class</option>
            {courses.map((c) => (
              <option key={c.id} value={String(c.id)}>
                {c.name}
              </option>
            ))}
          </select>

          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
            className="rounded-md border border-[#6E7F5B] px-3 py-2"
          >
            <option value="">Priority</option>
            {PRIORITY_OPTIONS.map((p) => (
              <option key={p}>{p}</option>
            ))}
          </select>

          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="rounded-md border border-[#6E7F5B] px-3 py-2"
          >
            {STATUS_OPTIONS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>

        {/* DESCRIPTION */}
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="min-h-[120px] w-full rounded-md border border-[#6E7F5B] p-3"
          placeholder="Details..."
        />

        {/* NOTES */}
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="min-h-[80px] w-full rounded-md border border-[#6E7F5B] p-3"
          placeholder="Notes..."
        />

        {/* CHECKLIST */}
        <div>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-xl font-bold">Checklist</h2>
            <button onClick={addItem} className="text-sm underline">
              + Add step
            </button>
          </div>

          <div className="mb-4 text-sm text-[#64748B]">
            Total: {totalMinutes} min • Remaining: {remainingMinutes} min
          </div>

          <div className="space-y-3">
            {checklistItems.map((item, i) => (
              <div
                key={item.id}
                className="flex flex-wrap items-center gap-3 rounded-md border border-[#6E7F5B] p-3"
              >
                <input
                  type="checkbox"
                  checked={item.checked}
                  onChange={() =>
                    updateItem(item.id, { checked: !item.checked })
                  }
                />

                <span className="text-sm">{i + 1}.</span>

                <input
                  value={item.step}
                  onChange={(e) =>
                    updateItem(item.id, { step: e.target.value })
                  }
                  className="flex-1 rounded border px-2 py-1"
                  placeholder="Task"
                />

                <input
                  type="number"
                  value={item.minutes}
                  onChange={(e) =>
                    updateItem(item.id, {
                      minutes: Number(e.target.value) || 0,
                    })
                  }
                  className="w-20 rounded border px-2 py-1"
                />

                <input
                  type="date"
                  value={item.dueDate}
                  onChange={(e) =>
                    updateItem(item.id, { dueDate: e.target.value })
                  }
                  className="rounded border px-2 py-1"
                />

                <button
                  onClick={() => removeItem(item.id)}
                  className="text-red-500 text-sm"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}