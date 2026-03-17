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
  // TODO: replace with real logged-in user id later
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
        if (!res.ok) throw new Error(data.message || 'Failed to load assignments');

        setAssignments(data as ApiAssignment[]);
      } catch (e: any) {
        setError(e.message || 'Failed to load assignments');
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [userId]);

  // Only show assignments that actually have a due date
  const dueAssignments = useMemo(
    () => assignments.filter((a) => !!a.dueAt),
    [assignments]
  );

  // handles deleting assignments
  async function handleDeleteAssignment(id: number) {
  setError('');
  setDeletingId(id);

  // optimistic UI
  const prev = assignments;
  setAssignments((cur) => cur.filter((a) => a.id !== id));

  try {
    const res = await fetch(
      `http://localhost:4000/assignments/${id}?userId=${userId}`,
      { method: 'DELETE' }
    );

    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.message || 'Failed to delete assignment');
  } catch (e: any) {
    // rollback if it failed
    setAssignments(prev);
    setError(e.message || 'Failed to delete assignment');
  } finally {
    setDeletingId(null);
  }
}

  return (
    <main style={{ maxWidth: 1100, margin: '0 auto' }}>
      <h1 style={{ margin: 0, fontSize: 28, fontWeight: 900 }}>Calendar</h1>
      <p style={{ opacity: 0.8, marginTop: 6 }}>
        Assignment due dates (click a day).
      </p>

      {loading && <p>Loading…</p>}
      {error && <p style={{ color: 'crimson' }}>{error}</p>}

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
