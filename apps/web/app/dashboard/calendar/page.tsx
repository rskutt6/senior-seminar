'use client';

import { useEffect, useMemo, useState } from 'react';
import MonthCalendar from './_components/MonthCalendar';

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
  const userId = 1;

  const [assignments, setAssignments] = useState<ApiAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
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

  return (
    <main style={{ maxWidth: 1100, margin: '0 auto' }}>
      <h1 style={{ margin: 0, fontSize: 28, fontWeight: 900 }}>Calendar</h1>
      <p style={{ opacity: 0.8, marginTop: 6 }}>
        Assignment due dates (click a day).
      </p>

      {loading && <p>Loading…</p>}
      {error && <p style={{ color: 'crimson' }}>{error}</p>}

      {!loading && !error && (
        <MonthCalendar assignments={dueAssignments} />
      )}
    </main>
  );
}
