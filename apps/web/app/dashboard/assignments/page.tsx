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
  const [sortDirection, setSortDirection] =
    useState<SortDirection>("asc");

  const [classFilter, setClassFilter] = useState("");
  const [dateFilter, setDateFilter] = useState("");

  /* ---------------- LOAD ---------------- */
  useEffect(() => {
    if (!userId) return;

    async function load() {
      const [aRes, cRes] = await Promise.all([
        fetch(`http://localhost:4000/assignments?userId=${userId}`),
        fetch(`http://localhost:4000/courses?userId=${userId}`),
      ]);

      const aData = await aRes.json();
      const cData = await cRes.json();

      setAssignments(aData || []);
      setCourses(cData || []);
      setLoading(false);
    }

    load();
  }, [userId]);

  /* ---------------- DELETE ---------------- */
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

      if (!res.ok) throw new Error();
    } catch {
      setAssignments(prev);
    }
  }

  /* ---------------- SORT ---------------- */
  function handleSort(key: SortKey) {
    if (key === sortKey) {
      setSortDirection((prev) =>
        prev === "asc" ? "desc" : "asc"
      );
    } else {
      setSortKey(key);
      setSortDirection("asc");
    }
  }

  /* ---------------- FILTER + SORT ---------------- */
  const filtered = useMemo(() => {
    let res = [...assignments];

    res = res.filter((a) =>
      showCompleted ? a.status === "done" : a.status !== "done"
    );

    if (classFilter) {
      res = res.filter(
        (a) => String(a.courseId ?? "") === classFilter
      );
    }

    if (dateFilter) {
      res = res.filter((a) =>
        a.dueAt?.slice(0, 10) === dateFilter
      );
    }

    res.sort((a, b) => {
      if (sortKey === "title") {
        const t1 = (a.title || "").toLowerCase();
        const t2 = (b.title || "").toLowerCase();
        return sortDirection === "asc"
          ? t1.localeCompare(t2)
          : t2.localeCompare(t1);
      }

      const d1 = a.dueAt
        ? new Date(a.dueAt).getTime()
        : Infinity;
      const d2 = b.dueAt
        ? new Date(b.dueAt).getTime()
        : Infinity;

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

  return (
    <main className="p-6 max-w-6xl mx-auto">

      {/* HEADER */}
      <div className="flex justify-between mb-6">
        <h1 className="text-3xl font-bold">Assignments</h1>

        <button
          onClick={() => setShowCompleted(!showCompleted)}
          className="border px-4 py-1 rounded"
        >
          {showCompleted ? "Active" : "Completed"}
        </button>
      </div>

      {/* FILTERS */}
      <div className="flex gap-3 mb-6">
        <input
          type="date"
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value)}
          className="border px-2 py-1 rounded"
        />

        <select
          value={classFilter}
          onChange={(e) => setClassFilter(e.target.value)}
          className="border px-2 py-1 rounded"
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
          className="border px-3 py-1 rounded"
        >
          Reset
        </button>
      </div>

      {/* TABLE */}
      {loading ? (
        <p>Loading...</p>
      ) : (
        <div className="border rounded overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 text-sm">
              <tr>
                <th
                  onClick={() => handleSort("title")}
                  className="cursor-pointer p-3 text-left"
                >
                  Title
                </th>

                <th
                  onClick={() => handleSort("dueAt")}
                  className="cursor-pointer p-3 text-left"
                >
                  Due
                </th>

                <th className="p-3 text-left">Priority</th>

                <th className="p-3 text-right">Action</th>
              </tr>
            </thead>

            <tbody>
              {filtered.map((a) => (
                <tr key={a.id} className="border-t">
                  <td className="p-3">
                    <Link href={`/dashboard/assignments/${a.id}`}>
                      {a.title || "Untitled"}
                    </Link>
                  </td>

                  <td className="p-3">
                    {a.dueAt?.slice(0, 10) || "—"}
                  </td>

                  <td className="p-3">
                    <div
                      className={`w-3 h-3 rounded-full ${priorityDot(
                        a.priority
                      )}`}
                    />
                  </td>

                  <td className="p-3 text-right">
                    <button
                      onClick={() => handleDelete(a.id)}
                      className="border border-red-300 text-red-600 px-3 py-1 rounded text-sm hover:bg-red-50"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>

          </table>
        </div>
      )}
    </main>
  );
}