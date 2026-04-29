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
  courseId: number | null;
  status?: string;
  priority?: string;
};

type Course = {
  id: number;
  name: string;
};

type SortKey = "title" | "dueAt";
type SortDirection = "asc" | "desc";

export default function AssignmentsPage() {
  const user = getCurrentUser();
  const userId = user?.id;

  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  const [showCompleted, setShowCompleted] = useState(false);
  const [sortKey, setSortKey] = useState<SortKey>("dueAt");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [classFilter, setClassFilter] = useState("");
  const [dateFilter, setDateFilter] = useState("");

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

  async function handleDelete(id: number) {
    if (!userId) return;

    const confirmed = window.confirm("Delete this assignment?");
    if (!confirmed) return;

    const prev = assignments;
    setAssignments((cur) => cur.filter((a) => a.id !== id));

    try {
      const res = await fetch(
        `http://localhost:4000/assignments/${id}?userId=${userId}`,
        { method: "DELETE" }
      );

      if (!res.ok) throw new Error("Delete failed");
    } catch {
      setAssignments(prev);
    }
  }

  function handleSort(key: SortKey) {
    if (key === sortKey) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDirection("asc");
    }
  }

  const filtered = useMemo(() => {
    let res = [...assignments];

    res = res.filter((a) =>
      showCompleted ? a.status === "done" : a.status !== "done"
    );

    if (classFilter) {
      res = res.filter((a) => String(a.courseId ?? "") === classFilter);
    }

    if (dateFilter) {
      res = res.filter((a) => a.dueAt?.slice(0, 10) === dateFilter);
    }

    res.sort((a, b) => {
      if (sortKey === "title") {
        const t1 = (a.title || "").toLowerCase();
        const t2 = (b.title || "").toLowerCase();
        return sortDirection === "asc"
          ? t1.localeCompare(t2)
          : t2.localeCompare(t1);
      }

      const d1 = a.dueAt ? new Date(a.dueAt).getTime() : Infinity;
      const d2 = b.dueAt ? new Date(b.dueAt).getTime() : Infinity;

      return sortDirection === "asc" ? d1 - d2 : d2 - d1;
    });

    return res;
  }, [
    assignments,
    showCompleted,
    classFilter,
    dateFilter,
    sortKey,
    sortDirection,
  ]);

  function priorityDot(priority?: string) {
    if (priority === "high") return "bg-red-500";
    if (priority === "medium") return "bg-yellow-400";
    if (priority === "low") return "bg-green-500";
    return "bg-gray-300";
  }

  function sortIndicator(key: SortKey) {
    if (sortKey !== key) return "";
    return sortDirection === "asc" ? " ↑" : " ↓";
  }

  return (
    <main className="mx-auto w-full max-w-6xl px-6 py-10 text-[#6E7F5B]">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-4xl font-extrabold tracking-tight">Assignments</h1>

        <button
          onClick={() => setShowCompleted(!showCompleted)}
          className="h-10 rounded-md border border-[#6E7F5B] px-10 font-medium hover:bg-[#6E7F5B]/10"
        >
          {showCompleted ? "Active" : "Completed"}
        </button>
      </div>

      <div className="mb-8 flex flex-wrap items-center gap-4">
        <input
          type="date"
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value)}
          className="h-10 rounded-md border border-[#6E7F5B] bg-transparent px-3 outline-none"
        />

        <select
          value={classFilter}
          onChange={(e) => setClassFilter(e.target.value)}
          className="h-10 min-w-[220px] rounded-md border border-[#6E7F5B] bg-transparent px-3 outline-none"
        >
          <option value="">All classes</option>
          {courses.map((c) => (
            <option key={c.id} value={String(c.id)}>
              {c.name}
            </option>
          ))}
        </select>

        <button
          onClick={() => {
            setClassFilter("");
            setDateFilter("");
            setSortKey("dueAt");
            setSortDirection("asc");
          }}
          className="h-10 rounded-md border border-[#6E7F5B] px-10 hover:bg-[#6E7F5B]/10"
        >
          Reset
        </button>
      </div>

      {loading ? (
        <p className="text-sm text-[#64748B]">Loading...</p>
      ) : (
        <div className="overflow-hidden rounded-md border border-[#6E7F5B]">
          <table className="w-full table-fixed border-collapse">
            <thead className="bg-white/40">
              <tr className="border-b border-[#6E7F5B]">
                <th
                  onClick={() => handleSort("title")}
                  className="w-[50%] cursor-pointer px-6 py-4 text-left font-bold"
                >
                  Title{sortIndicator("title")}
                </th>

                <th
                  onClick={() => handleSort("dueAt")}
                  className="w-[20%] cursor-pointer px-6 py-4 text-left font-bold"
                >
                  Due{sortIndicator("dueAt")}
                </th>

                <th className="w-[15%] px-6 py-4 text-left font-bold">
                  Priority
                </th>

                <th className="w-[15%] px-6 py-4 text-right font-bold">
                  Action
                </th>
              </tr>
            </thead>

            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td
                    colSpan={4}
                    className="px-6 py-12 text-center text-sm text-[#64748B]"
                  >
                    No assignments found.
                  </td>
                </tr>
              ) : (
                filtered.map((a) => (
                  <tr
                    key={a.id}
                    className="border-b border-[#6E7F5B]/60 last:border-b-0"
                  >
                    <td className="px-6 py-5 align-middle">
                      <Link
                        href={`/dashboard/assignments/${a.id}`}
                        className="line-clamp-2 font-medium leading-6 hover:underline"
                      >
                        {a.title || "Untitled"}
                      </Link>
                    </td>

                    <td className="whitespace-nowrap px-6 py-5 align-middle">
                      {a.dueAt?.slice(0, 10) || "—"}
                    </td>

                    <td className="px-6 py-5 align-middle">
                      <div
                        title={a.priority || "No priority"}
                        className={`h-3 w-3 rounded-full ${priorityDot(
                          a.priority
                        )}`}
                      />
                    </td>

                    <td className="px-6 py-5 text-right align-middle">
                      <button
                        onClick={() => handleDelete(a.id)}
                        className="rounded-md border border-red-300 px-5 py-2 text-sm text-red-600 hover:bg-red-50"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}