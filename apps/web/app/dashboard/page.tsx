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
  priority?: string | null;
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
  priority: string;
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

function priorityBadge(priority?: string) {
  if (priority === "high") {
    return "border-red-200 bg-red-50 text-red-600";
  }

  if (priority === "medium") {
    return "border-yellow-200 bg-yellow-50 text-yellow-700";
  }

  if (priority === "low") {
    return "border-green-200 bg-green-50 text-green-700";
  }

  return "border-slate-200 bg-slate-50 text-slate-500";
}

function priorityLabel(priority?: string) {
  if (priority === "high") return "High";
  if (priority === "medium") return "Medium";
  if (priority === "low") return "Low";
  return "Normal";
}

function formatShortDate(date: Date) {
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
  });
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
        label: formatShortDate(d),
        isToday: i === 0,
      };
    });
  }, []);

  const allTasks = useMemo<DashboardTask[]>((() => {
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
          priority: assignment.priority || "normal",
          effectiveDate,
        };
      });
    });
  }) as () => DashboardTask[], [assignments, courses, today]);

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

  function TaskCard({
    task,
    index,
    compact = false,
  }: {
    task: DashboardTask;
    index: number;
    compact?: boolean;
  }) {
    return (
      <article
        draggable
        onDragStart={() => setDraggingTask(task)}
        onDragEnd={() => setDraggingTask(null)}
        className="group flex cursor-move items-start gap-4 rounded-2xl border border-[#6E7F5B]/35 bg-white/60 p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-[#6E7F5B]/70 hover:bg-white hover:shadow-md"
      >
        <input
          type="checkbox"
          checked={task.checked}
          onChange={() => toggleTask(task)}
          onClick={(e) => e.stopPropagation()}
          className="mt-1 h-4 w-4 rounded border-[#6E7F5B]"
        />

        <div className="min-w-0 flex-1">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <span
              className={`rounded-full border px-2.5 py-1 text-xs font-bold ${priorityBadge(
                task.priority
              )}`}
            >
              {priorityLabel(task.priority)}
            </span>

            <span className="rounded-full border border-[#6E7F5B]/25 bg-[#6E7F5B]/10 px-2.5 py-1 text-xs font-bold text-[#6E7F5B]">
              {task.minutes} min
            </span>
          </div>

          <Link
            href={`/dashboard/assignments/${task.assignmentId}`}
            className={`block font-semibold leading-6 ${
              compact ? "text-sm" : "text-base"
            } ${
              task.checked
                ? "text-slate-400 line-through"
                : "text-slate-900 hover:underline"
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            {index + 1}. {task.step}
          </Link>

          <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-[#64748B]">
            <span>{task.courseName || "No class assigned"}</span>
            <span>•</span>
            <span className="capitalize">{task.assignmentType}</span>
          </div>
        </div>
      </article>
    );
  }

  const todayTasks = getTasksForDate(today);
  const upcomingDays = week.slice(1);

  const todayCompleted = todayTasks.filter((task) => task.checked).length;
  const todayMinutes = todayTasks.reduce(
    (sum, task) => (task.checked ? sum : sum + Number(task.minutes || 0)),
    0
  );

  return (
    <main className="mx-auto w-full max-w-7xl px-6 py-10 text-[#6E7F5B]">
      <Link
        href="/dashboard/assignments"
        className="mb-8 inline-block border-b border-[#6E7F5B] text-sm font-medium hover:opacity-70"
      >
        View assignment library →
      </Link>

      <section className="mb-8 rounded-3xl border border-[#6E7F5B]/40 bg-white/50 p-7 shadow-sm">
        <p className="text-sm font-semibold text-[#64748B]">Welcome back</p>

        <div className="mt-2 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-4xl font-extrabold tracking-tight text-[#6E7F5B]">
              Today’s Focus
            </h1>
            <p className="mt-2 text-sm text-[#64748B]">
              Plan your day, finish your highest-priority tasks, and drag tasks to
              reschedule them.
            </p>
          </div>

          {!loading && (
            <div className="flex flex-wrap gap-3">
              <div className="rounded-2xl border border-[#6E7F5B]/30 bg-white/60 px-4 py-3 text-center shadow-sm">
                <p className="text-2xl font-extrabold">{todayTasks.length}</p>
                <p className="text-xs font-semibold text-[#64748B]">Tasks</p>
              </div>

              <div className="rounded-2xl border border-[#6E7F5B]/30 bg-white/60 px-4 py-3 text-center shadow-sm">
                <p className="text-2xl font-extrabold">{todayCompleted}</p>
                <p className="text-xs font-semibold text-[#64748B]">Done</p>
              </div>

              <div className="rounded-2xl border border-[#6E7F5B]/30 bg-white/60 px-4 py-3 text-center shadow-sm">
                <p className="text-2xl font-extrabold">{todayMinutes}</p>
                <p className="text-xs font-semibold text-[#64748B]">Min left</p>
              </div>
            </div>
          )}
        </div>
      </section>

      {loading ? (
        <p className="text-sm text-[#64748B]">Loading...</p>
      ) : (
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          <section
            className="rounded-3xl border border-[#6E7F5B]/45 bg-white/45 p-6 shadow-sm xl:col-span-2"
            onDragOver={(e) => e.preventDefault()}
            onDrop={async (e) => {
              e.preventDefault();
              if (!draggingTask) return;

              await moveTaskToDate(draggingTask, today);
              setDraggingTask(null);
            }}
          >
            <div className="mb-5 flex items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-extrabold text-[#6E7F5B]">
                  Today
                </h2>
                <p className="mt-1 text-sm text-[#64748B]">
                  {week[0]?.label}
                </p>
              </div>

              <span className="rounded-full border border-[#6E7F5B]/30 bg-[#6E7F5B]/10 px-3 py-1 text-xs font-bold">
                {todayTasks.length} tasks
              </span>
            </div>

            {todayTasks.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-[#6E7F5B]/40 bg-white/35 px-6 py-12 text-center">
                <p className="text-sm font-bold">No tasks today</p>
                <p className="mt-1 text-xs text-[#64748B]">
                  Rest, review, or get ahead on future work.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {todayTasks.slice(0, 5).map((task, index) => (
                  <TaskCard key={`${task.assignmentId}-${task.id}`} task={task} index={index} />
                ))}

                {todayTasks.length > 5 && (
                  <Link
                    href={`/dashboard/tasks/${today}`}
                    className="block rounded-2xl border border-[#6E7F5B]/40 bg-white/40 px-4 py-3 text-center text-sm font-bold hover:bg-white"
                  >
                    View all {todayTasks.length} tasks
                  </Link>
                )}
              </div>
            )}
          </section>

          <section className="rounded-3xl border border-[#6E7F5B]/45 bg-white/45 p-6 shadow-sm">
            <div className="mb-5">
              <h2 className="text-2xl font-extrabold text-[#6E7F5B]">
                Quick Links
              </h2>
              <p className="mt-1 text-sm text-[#64748B]">
                Jump into planning.
              </p>
            </div>

            <div className="space-y-3">
              <Link
                href="/dashboard/assignments"
                className="block rounded-2xl border border-[#6E7F5B]/35 bg-white/55 p-4 shadow-sm transition hover:-translate-y-0.5 hover:bg-white"
              >
                <p className="font-extrabold">Assignment Library</p>
                <p className="mt-1 text-sm text-[#64748B]">
                  View, edit, and organize all assignments.
                </p>
              </Link>

              <Link
                href="/dashboard/input-assignments"
                className="block rounded-2xl border border-[#6E7F5B]/35 bg-white/55 p-4 shadow-sm transition hover:-translate-y-0.5 hover:bg-white"
              >
                <p className="font-extrabold">Input Assignments</p>
                <p className="mt-1 text-sm text-[#64748B]">
                  Add new work and generate task steps.
                </p>
              </Link>

              <Link
                href="/dashboard/calendar"
                className="block rounded-2xl border border-[#6E7F5B]/35 bg-white/55 p-4 shadow-sm transition hover:-translate-y-0.5 hover:bg-white"
              >
                <p className="font-extrabold">Calendar</p>
                <p className="mt-1 text-sm text-[#64748B]">
                  See your schedule by date.
                </p>
              </Link>
            </div>
          </section>

          <section className="xl:col-span-3">
            <div className="mb-5 flex items-end justify-between gap-4">
              <div>
                <h2 className="text-2xl font-extrabold text-[#6E7F5B]">
                  Upcoming Week
                </h2>
                <p className="mt-1 text-sm text-[#64748B]">
                  Drag cards between days to reschedule.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
              {upcomingDays.map(({ key, label }) => {
                const tasks = getTasksForDate(key);

                return (
                  <section
                    key={key}
                    className="min-h-[260px] rounded-3xl border border-[#6E7F5B]/40 bg-white/40 p-5 shadow-sm"
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={async (e) => {
                      e.preventDefault();
                      if (!draggingTask) return;

                      await moveTaskToDate(draggingTask, key);
                      setDraggingTask(null);
                    }}
                  >
                    <div className="mb-4 flex items-center justify-between gap-3">
                      <h3 className="text-lg font-extrabold">{label}</h3>

                      <span className="rounded-full border border-[#6E7F5B]/30 bg-[#6E7F5B]/10 px-3 py-1 text-xs font-bold">
                        {tasks.length}
                      </span>
                    </div>

                    {tasks.length === 0 ? (
                      <div className="rounded-2xl border border-dashed border-[#6E7F5B]/35 bg-white/30 px-4 py-8 text-center">
                        <p className="text-sm font-bold">No tasks</p>
                        <p className="mt-1 text-xs text-[#64748B]">
                          Clear day ahead.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {tasks.slice(0, 3).map((task, index) => (
                          <TaskCard
                            key={`${task.assignmentId}-${task.id}`}
                            task={task}
                            index={index}
                            compact
                          />
                        ))}

                        <Link
                          href={`/dashboard/tasks/${key}`}
                          className="block rounded-2xl border border-[#6E7F5B]/35 bg-white/35 px-4 py-2 text-center text-sm font-bold hover:bg-white"
                        >
                          View all...
                        </Link>
                      </div>
                    )}
                  </section>
                );
              })}
            </div>
          </section>
        </div>
      )}
    </main>
  );
}