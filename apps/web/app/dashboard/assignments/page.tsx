"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { getCurrentUser } from "@/lib/auth";

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

type SortKey = "title" | "dueAt";
type SortDirection = "asc" | "desc";

function formatDueDate(value: string | null) {
  if (!value) return "No due date";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "No due date";

  return new Intl.DateTimeFormat(undefined, {
    month: "numeric",
    day: "numeric",
    year: "2-digit",
  }).format(date);
}

function getDateInputValue(value: string | null) {
  if (!value) return "";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");

  return `${yyyy}-${mm}-${dd}`;
}

export default function AssignmentsPage() {
  const user = getCurrentUser();
  const userId = user?.id;

  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const [sortKey, setSortKey] = useState<SortKey>("dueAt");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [classFilter, setClassFilter] = useState("");
  const [dueDateFilter, setDueDateFilter] = useState("");

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      setError("You must be logged in.");
      return;
    }

    async function load() {
      setLoading(true);
      setError("");

      try {
        const [assignmentsRes, coursesRes] = await Promise.all([
          fetch(`http://localhost:4000/assignments?userId=${userId}`, {
            cache: "no-store",
          }),
          fetch(`http://localhost:4000/courses?userId=${userId}`, {
            cache: "no-store",
          }),
        ]);

        const assignmentsData = await assignmentsRes.json().catch(() => []);
        const coursesData = await coursesRes.json().catch(() => []);

        if (!assignmentsRes.ok) {
          throw new Error(
            assignmentsData?.message || "Failed to load assignments."
          );
        }

        if (!coursesRes.ok) {
          throw new Error(coursesData?.message || "Failed to load classes.");
        }

        setAssignments(Array.isArray(assignmentsData) ? assignmentsData : []);
        setCourses(Array.isArray(coursesData) ? coursesData : []);
      } catch (e) {
        setError(
          e instanceof Error ? e.message : "Failed to load assignments."
        );
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [userId]);

  async function handleDelete(id: number) {
    if (!userId) return;

    const confirmed = window.confirm("Delete this assignment?");
    if (!confirmed) return;

    setDeletingId(id);
    setError("");

    const previous = assignments;
    setAssignments((current) => current.filter((a) => a.id !== id));

    try {
      const res = await fetch(
        `http://localhost:4000/assignments/${id}?userId=${userId}`,
        {
          method: "DELETE",
        }
      );

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data?.message || "Failed to delete assignment.");
      }
    } catch (e) {
      setAssignments(previous);
      setError(
        e instanceof Error ? e.message : "Failed to delete assignment."
      );
    } finally {
      setDeletingId(null);
    }
  }

  function handleSortClick(nextKey: SortKey) {
    if (sortKey === nextKey) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
      return;
    }

    setSortKey(nextKey);
    setSortDirection("asc");
  }

  const courseMap = useMemo(() => {
    const map = new Map<number, string>();
    for (const course of courses) {
      map.set(course.id, course.name);
    }
    return map;
  }, [courses]);

  const filtered = useMemo(() => {
    let res = [...assignments];

    if (classFilter) {
      res = res.filter(
        (assignment) => String(assignment.courseId ?? "") === classFilter
      );
    }

    if (dueDateFilter) {
      res = res.filter((assignment) => {
        if (!assignment.dueAt) return false;
        return getDateInputValue(assignment.dueAt) === dueDateFilter;
      });
    }

    res.sort((a, b) => {
      if (sortKey === "title") {
        const aTitle = (a.title || "Untitled Assignment").toLowerCase();
        const bTitle = (b.title || "Untitled Assignment").toLowerCase();
        const comparison = aTitle.localeCompare(bTitle);
        return sortDirection === "asc" ? comparison : -comparison;
      }

      const aTime = a.dueAt
        ? new Date(a.dueAt).getTime()
        : Number.MAX_SAFE_INTEGER;
      const bTime = b.dueAt
        ? new Date(b.dueAt).getTime()
        : Number.MAX_SAFE_INTEGER;

      const comparison = aTime - bTime;
      if (comparison !== 0) {
        return sortDirection === "asc" ? comparison : -comparison;
      }

      const aTitle = (a.title || "Untitled Assignment").toLowerCase();
      const bTitle = (b.title || "Untitled Assignment").toLowerCase();
      return aTitle.localeCompare(bTitle);
    });

    return res;
  }, [assignments, classFilter, dueDateFilter, sortKey, sortDirection]);

  return (
    <main className="min-h-screen w-full px-4 py-6 text-black md:px-6">
      <div className="mx-auto w-full max-w-6xl">
        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-black">Assignments</h1>
            <p className="mt-2 text-sm text-black/60">
              View, sort, filter, and manage assignments.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="rounded-full border border-black/10 bg-neutral-100 px-3 py-1 text-xs text-black">
              {loading ? "Loading..." : `${filtered.length} shown`}
            </div>

            <Link
              href="/dashboard/input-assignments"
              className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              Add assignment
            </Link>
          </div>
        </div>

        <section className="mb-6 rounded-2xl border border-black/10 bg-white p-4 shadow-[0_10px_30px_rgba(0,0,0,0.06)]">
          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            <input
              type="date"
              value={dueDateFilter}
              onChange={(e) => setDueDateFilter(e.target.value)}
              className="rounded-xl border border-black/15 px-3 py-2 text-sm outline-none"
            />

            <select
              value={classFilter}
              onChange={(e) => setClassFilter(e.target.value)}
              className="rounded-xl border border-black/15 px-3 py-2 text-sm outline-none"
            >
              <option value="">All classes</option>
              {courses.map((course) => (
                <option key={course.id} value={String(course.id)}>
                  {course.name}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={() => {
                setClassFilter("");
                setDueDateFilter("");
                setSortKey("dueAt");
                setSortDirection("asc");
              }}
              className="rounded-xl border border-black/10 px-3 py-2 text-sm transition hover:bg-black/5"
            >
              Reset
            </button>
          </div>
        </section>

        {error ? (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        <section className="overflow-hidden rounded-2xl border border-black/10 bg-white shadow-[0_10px_30px_rgba(0,0,0,0.06)]">
          {loading ? (
            <div className="p-6 text-sm text-black/60">Loading assignments...</div>
          ) : filtered.length === 0 ? (
            <div className="p-6 text-sm text-black/60">No assignments found.</div>
          ) : (
            <div className="w-full overflow-x-auto">
              <table className="w-full table-fixed border-collapse">
                <thead className="border-b border-black/10 bg-neutral-50">
                  <tr>
                    <th
                      onClick={() => handleSortClick("title")}
                      className="w-[45%] cursor-pointer px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-black/60"
                    >
                      Title{" "}
                      {sortKey === "title"
                        ? sortDirection === "asc"
                          ? "↑"
                          : "↓"
                        : ""}
                    </th>

                    <th
                      onClick={() => handleSortClick("dueAt")}
                      className="w-[20%] cursor-pointer px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-black/60"
                    >
                      Due{" "}
                      {sortKey === "dueAt"
                        ? sortDirection === "asc"
                          ? "↑"
                          : "↓"
                        : ""}
                    </th>

                    <th className="w-[20%] px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-black/60">
                      Class
                    </th>

                    <th className="w-[15%] px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-black/60">
                      Action
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {filtered.map((a) => (
                    <tr
                      key={a.id}
                      className="border-b border-black/10 transition hover:bg-black/[0.02]"
                    >
                      <td className="px-5 py-4 align-middle">
                        <Link
                          href={`/dashboard/assignments/${a.id}`}
                          className="block font-medium leading-5 text-black hover:underline"
                        >
                          {a.title || "Untitled Assignment"}
                        </Link>
                      </td>

                      <td className="whitespace-nowrap px-5 py-4 align-middle text-sm text-black/70">
                        {formatDueDate(a.dueAt)}
                      </td>

                      <td className="whitespace-nowrap px-5 py-4 align-middle text-sm text-black/70">
                        {a.courseId
                          ? courseMap.get(a.courseId) || "Unknown class"
                          : "No class"}
                      </td>

                      <td className="px-5 py-4 text-right align-middle">
                        <button
                          type="button"
                          onClick={() => handleDelete(a.id)}
                          disabled={deletingId === a.id}
                          className="rounded-lg border border-red-300 px-3 py-1.5 text-sm text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {deletingId === a.id ? "Deleting..." : "Delete"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}