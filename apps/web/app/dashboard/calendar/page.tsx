'use client';

import { useEffect, useMemo, useState } from 'react';
import MonthCalendar from './_components/MonthCalendar';
import { getCurrentUser } from '@/lib/auth';

type ApiAssignment = {
  id: number;
  description: string;
  dueAt: string | null;
  weight: number | null;
  userId: number;
  courseId: number | null;
};

export default function CalendarPage() {
  const user = getCurrentUser();
  const userId = user?.id;

  const [assignments, setAssignments] = useState<ApiAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [deletingId, setDeletingId] = useState<number | null>(null);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      setError('You must be logged in.');
      return;
    }

    async function load() {
      setLoading(true);
      setError('');

      try {
        const res = await fetch(
          `http://localhost:4000/assignments?userId=${userId}`,
          { cache: 'no-store' }
        );

        const data = await res.json().catch(() => ({}));

        if (!res.ok) {
          throw new Error(data.message || 'Failed to load assignments');
        }

        setAssignments(data as ApiAssignment[]);
      } catch (e: any) {
        setError(e.message || 'Failed to load assignments');
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [userId]);

  const dueAssignments = useMemo(
    () => assignments.filter((a) => !!a.dueAt),
    [assignments]
  );

  async function handleDeleteAssignment(id: number) {
    setError('');
    setDeletingId(id);

    const prev = assignments;
    setAssignments((cur) => cur.filter((a) => a.id !== id));

    try {
      const res = await fetch(
        `http://localhost:4000/assignments/${id}?userId=${userId}`,
        { method: 'DELETE' }
      );

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.message || 'Failed to delete assignment');
      }
    } catch (e: any) {
      setAssignments(prev);
      setError(e.message || 'Failed to delete assignment');
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <main className="mx-auto w-full max-w-[1280px] px-8">
      <h1 className="m-0 text-[32px] font-black">Calendar</h1>
      <p className="mt-2 text-base opacity-80">
        Assignment due dates (click a day).
      </p>

      {loading && <p className="mt-4">Loading…</p>}
      {error && <p className="mt-4 text-red-700">{error}</p>}

      {!loading && !error && (
        <MonthCalendar
          assignments={dueAssignments}
          onDelete={handleDeleteAssignment}
          deletingId={deletingId}
        />
      )}
    </main>
  );
}
