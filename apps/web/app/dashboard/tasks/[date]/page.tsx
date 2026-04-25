"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { getCurrentUser } from "@/lib/auth";

type ChecklistItem = {
  id: string;
  step: string;
  minutes: number;
  dueDate: string;
  checked: boolean;
  priorityScore?: number;
};

type Assignment = {
  id: number;
  dueAt: string | null;
  weight: number | null;
  assignmentType?: string | null;
  status?: string | null;
  checklistItems?: string | ChecklistItem[] | null;
  courseId?: number | null;
};

type Course = {
  id: number;
  name: string;
};

type Task = ChecklistItem & {
  assignmentId: number;
  dueAt: string | null;
  weight: number;
  assignmentType: string;
  courseId?: number | null;
  courseName: string;
  effectiveDate: string;
};

function parseChecklist(raw: Assignment["checklistItems"]): ChecklistItem[] {
  if (!raw) return [];

  try {
    const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;

    if (!Array.isArray(parsed)) return [];

    return parsed.map((item) => ({
      id: String(item?.id ?? crypto.randomUUID()),
      step: String(item?.step ?? ""),
      minutes: Number(item?.minutes ?? 0),
      dueDate: String(item?.dueDate ?? ""),
      checked: Boolean(item?.checked),
      priorityScore: Number(item?.priorityScore ?? 50),
    }));
  } catch {
    return [];
  }
}

function toLocalYMD(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function normalizeDate(value?: string | null) {
  if (!value) return "";
  return value.slice(0, 10);
}

function daysUntil(dateStr: string | null) {
  if (!dateStr) return 999;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const due = new Date(dateStr);
  due.setHours(0, 0, 0, 0);

  return Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

function typeBonus(type?: string | null) {
  switch (type) {
    case "exam":
      return 30;
    case "project":
      return 25;
    case "essay":
      return 20;
    case "presentation":
      return 18;
    case "lab":
      return 15;
    case "quiz":
      return 12;
    case "homework":
      return 8;
    case "reading":
      return 5;
    default:
      return 0;
  }
}

function getTaskScore(task: Task) {
  return (
    (task.priorityScore ?? 50) +
    task.weight * 1.5 +
    typeBonus(task.assignmentType) -
    daysUntil(task.dueAt) * 2
  );
}

export default function TasksByDatePage() {
  const { date } = useParams() as { date: string };
  const user = getCurrentUser();
  const userId = user?.id;

  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [draggingTask, setDraggingTask] = useState<Task | null>(null);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    async function load() {
      setLoading(true);

      try {
        const [aRes, cRes] = await Promise.all([
          fetch(`http://localhost:4000/assignments?userId=${userId}`, {
            cache: "no-store",
          }),
          fetch(`http://localhost:4000/courses?userId=${userId}`, {
            cache: "no-store",
          }),
        ]);

        const aData = await aRes.json().catch(() => []);
        const cData = await cRes.json().catch(() => []);

        setAssignments(Array.isArray(aData) ? aData : []);
        setCourses(Array.isArray(cData) ? cData : []);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [userId]);

  function getCourseName(courseId?: number | null) {
    return courses.find((course) => course.id === courseId)?.name || "";
  }

  const today = toLocalYMD(new Date());
  const selectedDate = normalizeDate(date);

  const tasks = useMemo<Task[]>(() => {
    return assignments
      .flatMap((assignment) => {
        if (assignment.status === "done" || assignment.status === "completed") {
          return [];
        }

        const checklist = parseChecklist(assignment.checklistItems);

        return checklist.map((item) => {
          const rawDate = normalizeDate(item.dueDate);
          const effectiveDate = rawDate && rawDate < today ? today : rawDate || today;

          return {
            ...item,
            assignmentId: assignment.id,
            dueAt: assignment.dueAt,
            weight: Number(assignment.weight ?? 0),
            assignmentType: assignment.assignmentType || "homework",
            courseId: assignment.courseId,
            courseName: getCourseName(assignment.courseId),
            effectiveDate,
          };
        });
      })
      .filter((task) => task.effectiveDate === selectedDate)
      .sort((a, b) => getTaskScore(b) - getTaskScore(a));
  }, [assignments, courses, selectedDate, today]);

  async function updateChecklistForAssignment(
    assignmentId: number,
    nextChecklist: ChecklistItem[]
  ) {
    if (!userId) return;

    const previous = assignments;

    setAssignments((current) =>
      current.map((assignment) =>
        assignment.id === assignmentId
          ? { ...assignment, checklistItems: JSON.stringify(nextChecklist) }
          : assignment
      )
    );

    try {
      const res = await fetch(
        `http://localhost:4000/assignments/${assignmentId}?userId=${userId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            checklistItems: JSON.stringify(nextChecklist),
          }),
        }
      );

      if (!res.ok) throw new Error("Failed to save task.");
    } catch {
      setAssignments(previous);
    }
  }

  async function toggleTask(task: Task) {
    const assignment = assignments.find((a) => a.id === task.assignmentId);
    if (!assignment) return;

    const nextChecklist = parseChecklist(assignment.checklistItems).map((item) =>
      item.id === task.id ? { ...item, checked: !item.checked } : item
    );

    await updateChecklistForAssignment(task.assignmentId, nextChecklist);
  }

  async function moveTaskToDate(task: Task, newDate: string) {
    const assignment = assignments.find((a) => a.id === task.assignmentId);
    if (!assignment) return;

    const nextChecklist = parseChecklist(assignment.checklistItems).map((item) =>
      item.id === task.id ? { ...item, dueDate: newDate } : item
    );

    await updateChecklistForAssignment(task.assignmentId, nextChecklist);
  }

  return (
    <main className="mx-auto w-full max-w-[900px] px-4 py-6 text-slate-900">
      <Link href="/dashboard" className="text-sm underline mb-4 inline-block">
        ← Back
      </Link>

      <h1 className="text-xl font-semibold mb-4">{selectedDate}</h1>

      <div
        className="min-h-[200px]"
        onDragOver={(e) => e.preventDefault()}
        onDrop={async (e) => {
          e.preventDefault();
          if (!draggingTask) return;

          await moveTaskToDate(draggingTask, selectedDate);
          setDraggingTask(null);
        }}
      >
        {loading ? (
          <p className="text-sm text-gray-500">Loading...</p>
        ) : tasks.length === 0 ? (
          <div className="mt-6 rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
            No tasks to do today! Rest or try getting ahead on future tasks!
          </div>
        ) : (
          tasks.map((task, index) => (
            <div
              key={`${task.assignmentId}-${task.id}`}
              draggable
              onDragStart={() => setDraggingTask(task)}
              onDragEnd={() => setDraggingTask(null)}
              className="rounded-xl border border-slate-200 p-4 mb-3 flex gap-3 cursor-move"
            >
              <input
                type="checkbox"
                checked={task.checked}
                onChange={() => toggleTask(task)}
                onClick={(e) => e.stopPropagation()}
                className="mt-1"
              />

              <div className="flex-1">
                <Link
                  href={`/dashboard/assignments/${task.assignmentId}`}
                  className={`text-sm ${
                    task.checked
                      ? "line-through text-gray-400"
                      : "hover:underline"
                  }`}
                  onClick={(e) => e.stopPropagation()}
                >
                  {index + 1}. {task.step}
                </Link>

                <div className="text-xs text-gray-500 mt-1">
                  – {task.courseName || "No class"}
                </div>

                <div className="text-xs text-gray-400 mt-1">
                  {task.minutes} min
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </main>
  );
}