"use client";

import Link from "next/link";
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

type DashboardTask = ChecklistItem & {
  assignmentId: number;
  courseName: string;
  dueAt: string | null;
  weight: number;
  assignmentType: string;
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

function getTaskScore(task: DashboardTask) {
  return (
    (task.priorityScore ?? 50) +
    task.weight * 1.5 +
    typeBonus(task.assignmentType) -
    daysUntil(task.dueAt) * 2
  );
}

export default function DashboardPage() {
  const user = getCurrentUser();
  const userId = user?.id;

  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [draggingTask, setDraggingTask] = useState<DashboardTask | null>(null);

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

  const week = useMemo(() => {
    const start = new Date();

    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(start);
      d.setDate(start.getDate() + i);

      return {
        key: toLocalYMD(d),
        label: d.toLocaleDateString("en-US", {
          weekday: "long",
          month: "short",
          day: "numeric",
        }),
      };
    });
  }, []);

  const allTasks = useMemo<DashboardTask[]>(() => {
    return assignments.flatMap((assignment) => {
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
          courseName: getCourseName(assignment.courseId),
          dueAt: assignment.dueAt,
          weight: Number(assignment.weight ?? 0),
          assignmentType: assignment.assignmentType || "homework",
          effectiveDate,
        };
      });
    });
  }, [assignments, courses, today]);

  function getTasksForDate(date: string) {
    return allTasks
      .filter((task) => task.effectiveDate === date)
      .sort((a, b) => getTaskScore(b) - getTaskScore(a));
  }

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

  async function toggleTask(task: DashboardTask) {
    const assignment = assignments.find((a) => a.id === task.assignmentId);
    if (!assignment) return;

    const nextChecklist = parseChecklist(assignment.checklistItems).map((item) =>
      item.id === task.id ? { ...item, checked: !item.checked } : item
    );

    await updateChecklistForAssignment(task.assignmentId, nextChecklist);
  }

  async function moveTaskToDate(task: DashboardTask, newDate: string) {
    const assignment = assignments.find((a) => a.id === task.assignmentId);
    if (!assignment) return;

    const nextChecklist = parseChecklist(assignment.checklistItems).map((item) =>
      item.id === task.id ? { ...item, dueDate: newDate } : item
    );

    await updateChecklistForAssignment(task.assignmentId, nextChecklist);
  }

  return (
    <main className="p-6 max-w-6xl mx-auto">
      <Link href="/dashboard/assignments" className="underline text-sm mb-4 block">
        View assignment library →
      </Link>

      <h1 className="text-3xl font-bold mb-6">Dashboard</h1>

      {loading ? (
        <p className="text-sm text-gray-500">Loading...</p>
      ) : (
        <div className="grid grid-cols-2 gap-6">
          {week.map(({ key, label }) => {
            const tasks = getTasksForDate(key);

            return (
              <div
                key={key}
                className="border rounded p-4"
                onDragOver={(e) => e.preventDefault()}
                onDrop={async (e) => {
                  e.preventDefault();
                  if (!draggingTask) return;

                  await moveTaskToDate(draggingTask, key);
                  setDraggingTask(null);
                }}
              >
                <h2 className="font-semibold mb-2">{label}</h2>

                {tasks.length === 0 ? (
                  <p className="text-sm text-gray-500">
                    No tasks to do today! Rest or try getting ahead on future tasks!
                  </p>
                ) : (
                  tasks.slice(0, 3).map((task, index) => (
                    <div
                      key={`${task.assignmentId}-${task.id}`}
                      draggable
                      onDragStart={() => setDraggingTask(task)}
                      onDragEnd={() => setDraggingTask(null)}
                      className="border rounded p-3 mb-2 flex gap-2 cursor-move"
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
                      </div>
                    </div>
                  ))
                )}

                <Link
                  href={`/dashboard/tasks/${key}`}
                  className="border px-3 py-1 rounded text-sm inline-block mt-2"
                >
                  View all...
                </Link>
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}

const page: React.CSSProperties = {
  minHeight: '100vh',
  padding: '24px',
  background: '#F4F1EC',
  color: '#6E7F5B',
};

const card: React.CSSProperties = {
  maxWidth: 1100,
  margin: '0 auto',
};

const headerRow: React.CSSProperties = {
  display: 'flex',
  alignItems: 'flex-start',
  justifyContent: 'space-between',
  gap: 16,
  marginBottom: 16,
};

const rightHeader: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 10,
};

const title: React.CSSProperties = {
  fontSize: 32,
  fontWeight: 900,
  margin: 0,
  color: '#6E7F5B',
};

const subtitle: React.CSSProperties = {
  margin: '6px 0 0',
  opacity: 0.8,
  color: '#8A7967',
};

const pill: React.CSSProperties = {
  padding: '8px 10px',
  borderRadius: 999,
  fontSize: 12,
  fontWeight: 700,
  border: '1px solid #9CAF88',
  background: 'rgba(156,175,136,0.15)',
  color: '#6E7F5B',
};

const panel: React.CSSProperties = {
  borderRadius: 16,
  border: '1px solid #9CAF88',
  padding: 16,
  background: '#ffffff',
};

const quickLinksRow: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
  gap: 12,
  marginBottom: 16,
};

const linkCard: React.CSSProperties = {
  display: 'block',
  textDecoration: 'none',
  border: '1px solid #7FA7B5',
  borderRadius: 14,
  padding: 14,
  background: '#F4F1EC',
  color: '#6E7F5B',
};

const linkTitle: React.CSSProperties = {
  fontSize: 16,
  fontWeight: 800,
  marginBottom: 4,
  color: '#6E7F5B',
};

const linkText: React.CSSProperties = {
  fontSize: 14,
  color: '#8A7967',
};

const secondaryBtn: React.CSSProperties = {
  padding: '10px 14px',
  borderRadius: 12,
  border: '1px solid #9CAF88',
  background: '#ffffff',
  color: '#6E7F5B',
  fontWeight: 700,
  cursor: 'pointer',
};
