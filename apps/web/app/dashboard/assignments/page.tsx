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
        setError(e instanceof Error ? e.message : "Failed to load assignments.");
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

  function getSortArrow(key: SortKey) {
    if (sortKey !== key) return "↕";
    return sortDirection === "asc" ? "↑" : "↓";
  }

  const courseNameById = useMemo(() => {
    const map = new Map<number, string>();
    for (const course of courses) {
      map.set(course.id, course.name);
    }
    return map;
  }, [courses]);

  const filteredAssignments = useMemo(() => {
    let result = [...assignments];

    if (classFilter) {
      result = result.filter(
        (assignment) => String(assignment.courseId ?? "") === classFilter
      );
    }

    if (dueDateFilter) {
      result = result.filter((assignment) => {
        if (!assignment.dueAt) return false;
        return getDateInputValue(assignment.dueAt) === dueDateFilter;
      });
    }

    result.sort((a, b) => {
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

    return result;
  }, [assignments, classFilter, dueDateFilter, sortKey, sortDirection]);

  return (
    <main style={page}>
      <div style={card}>
        <div style={headerRow}>
          <div>
            <h1 style={title}>Assignments</h1>
            <p style={subtitle}>View, sort, filter, open, and delete assignments.</p>
          </div>

          <div style={rightHeader}>
            <div style={pill}>
              {loading ? "Loading..." : `${filteredAssignments.length} shown`}
            </div>
            <Link href="/dashboard/input-assignments" style={primaryBtn}>
              Add assignment
            </Link>
          </div>
        </div>

        <section style={panel}>
          <div style={filtersRow}>
            <div style={filterGroup}>
              <label style={label}>Class</label>
              <select
                value={classFilter}
                onChange={(e) => setClassFilter(e.target.value)}
                style={input}
              >
                <option value="">All classes</option>
                {courses.map((course) => (
                  <option key={course.id} value={String(course.id)}>
                    {course.name}
                  </option>
                ))}
              </select>
            </div>

            <div style={filterGroup}>
              <label style={label}>Due date</label>
              <input
                type="date"
                value={dueDateFilter}
                onChange={(e) => setDueDateFilter(e.target.value)}
                style={input}
              />
            </div>

            <button
              type="button"
              onClick={() => {
                setClassFilter("");
                setDueDateFilter("");
                setSortKey("dueAt");
                setSortDirection("asc");
              }}
              style={secondaryBtn}
            >
              Reset filters
            </button>
          </div>

          {error ? <div style={errorBox}>{error}</div> : null}

          <div style={listCard}>
            <div style={listHeader}>
              <button
                type="button"
                onClick={() => handleSortClick("title")}
                style={{ ...headerBtn, justifySelf: "start" }}
              >
                <span>Title</span>
                <span>{getSortArrow("title")}</span>
              </button>

              <button
                type="button"
                onClick={() => handleSortClick("dueAt")}
                style={{ ...headerBtn, justifySelf: "start" }}
              >
                <span>Due date</span>
                <span>{getSortArrow("dueAt")}</span>
              </button>

              <div style={headerText}>Class</div>
              <div style={headerText}>Action</div>
            </div>

            {loading ? (
              <div style={emptyState}>Loading assignments...</div>
            ) : filteredAssignments.length === 0 ? (
              <div style={emptyState}>No assignments found.</div>
            ) : (
              filteredAssignments.map((assignment) => (
                <div key={assignment.id} style={row}>
                  <div style={titleCell}>
                    <Link
                      href={`/dashboard/assignments/${assignment.id}`}
                      style={titleLink}
                    >
                      {assignment.title || "Untitled Assignment"}
                    </Link>
                  </div>

                  <div style={cell}>{formatDueDate(assignment.dueAt)}</div>

                  <div style={cell}>
                    {assignment.courseId
                      ? courseNameById.get(assignment.courseId) || "Unknown class"
                      : "No class"}
                  </div>

                  <div style={actionCell}>
                    <button
                      type="button"
                      onClick={() => handleDelete(assignment.id)}
                      disabled={deletingId === assignment.id}
                      style={{
                        ...deleteBtn,
                        opacity: deletingId === assignment.id ? 0.6 : 1,
                        cursor:
                          deletingId === assignment.id ? "not-allowed" : "pointer",
                      }}
                    >
                      {deletingId === assignment.id ? "Deleting..." : "Delete"}
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </main>
  );
}

const page: React.CSSProperties = {
  minHeight: "100vh",
  padding: "24px",
};

const card: React.CSSProperties = {
  maxWidth: 1100,
  margin: "0 auto",
};

const headerRow: React.CSSProperties = {
  display: "flex",
  alignItems: "flex-start",
  justifyContent: "space-between",
  gap: 16,
  marginBottom: 16,
};

const rightHeader: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 10,
  flexWrap: "wrap",
};

const title: React.CSSProperties = {
  fontSize: 32,
  fontWeight: 900,
  margin: 0,
  color: "#111",
};

const subtitle: React.CSSProperties = {
  margin: "6px 0 0",
  opacity: 0.8,
  color: "#111",
};

const pill: React.CSSProperties = {
  padding: "8px 10px",
  borderRadius: 999,
  fontSize: 12,
  fontWeight: 700,
  border: "1px solid rgba(0,0,0,0.12)",
  background: "rgba(16,185,129,0.12)",
  color: "#111",
};

const panel: React.CSSProperties = {
  borderRadius: 16,
  border: "1px solid rgba(0,0,0,0.08)",
  padding: 16,
  background: "white",
};

const filtersRow: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "minmax(0, 1fr) 220px auto",
  gap: 12,
  alignItems: "end",
  marginBottom: 16,
};

const filterGroup: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 6,
};

const label: React.CSSProperties = {
  fontSize: 13,
  fontWeight: 700,
  color: "#111",
};

const input: React.CSSProperties = {
  width: "100%",
  padding: "10px 12px",
  borderRadius: 10,
  border: "1px solid rgba(0,0,0,0.12)",
  background: "white",
  color: "#111",
  fontSize: 14,
  boxSizing: "border-box",
};

const primaryBtn: React.CSSProperties = {
  padding: "10px 14px",
  borderRadius: 12,
  border: "1px solid rgba(0,0,0,0.12)",
  background: "#111827",
  color: "white",
  fontWeight: 700,
  textDecoration: "none",
  cursor: "pointer",
};

const secondaryBtn: React.CSSProperties = {
  padding: "10px 14px",
  borderRadius: 12,
  border: "1px solid rgba(0,0,0,0.12)",
  background: "white",
  color: "black",
  fontWeight: 700,
  cursor: "pointer",
};

const errorBox: React.CSSProperties = {
  marginBottom: 16,
  padding: "12px 14px",
  borderRadius: 12,
  border: "1px solid #fecaca",
  background: "#fef2f2",
  color: "#b91c1c",
  fontSize: 14,
};

const listCard: React.CSSProperties = {
  border: "1px solid rgba(0,0,0,0.08)",
  borderRadius: 14,
  overflow: "hidden",
  background: "white",
};

const listHeader: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "minmax(0, 1.5fr) 180px 180px 120px",
  gap: 12,
  padding: "14px 16px",
  borderBottom: "1px solid rgba(0,0,0,0.08)",
  background: "#fcfcfd",
  alignItems: "center",
};

const headerBtn: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
  border: "none",
  background: "transparent",
  padding: 0,
  margin: 0,
  cursor: "pointer",
  fontSize: 13,
  fontWeight: 800,
  color: "#111",
};

const headerText: React.CSSProperties = {
  fontSize: 13,
  fontWeight: 800,
  color: "#111",
};

const row: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "minmax(0, 1.5fr) 180px 180px 120px",
  gap: 12,
  padding: "14px 16px",
  borderBottom: "1px solid rgba(0,0,0,0.08)",
  alignItems: "center",
};

const titleCell: React.CSSProperties = {
  minWidth: 0,
};

const titleLink: React.CSSProperties = {
  color: "#111",
  textDecoration: "none",
  fontWeight: 700,
  fontSize: 15,
  display: "block",
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
};

const cell: React.CSSProperties = {
  fontSize: 14,
  color: "#374151",
};

const actionCell: React.CSSProperties = {
  display: "flex",
  justifyContent: "flex-start",
};

const deleteBtn: React.CSSProperties = {
  padding: "8px 12px",
  borderRadius: 10,
  border: "1px solid #fecaca",
  background: "white",
  color: "#dc2626",
  fontWeight: 700,
};

const emptyState: React.CSSProperties = {
  padding: "22px 16px",
  color: "#6b7280",
  fontSize: 14,
};