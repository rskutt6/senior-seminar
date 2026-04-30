'use client';

import { useEffect, useMemo, useState } from 'react';
import MonthCalendar from './_components/MonthCalendar';
import { getCurrentUser } from '@/lib/auth';

type ApiAssignment = {
  id: number;
  title: string;
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
  const [error, setError] = useState('');

  // 🔥 MODAL STATE
  const [showModal, setShowModal] = useState(false);
  const [newEvent, setNewEvent] = useState({
    title: '',
    date: '',
    time: '',
    notes: '',
  });

  // 🔥 LOAD DATA
  useEffect(() => {
    if (!userId) return;

    async function load() {
      setLoading(true);
      setError('');

      try {
        const [aRes] = await Promise.all([
          fetch(`http://localhost:4000/assignments?userId=${userId}`, { cache: 'no-store' }),
        ]);

        const aData = await aRes.json().catch(() => []);

        if (!aRes.ok) throw new Error('Assignments failed');

        setAssignments(aData);
        
      } catch (e: any) {
        setError(e.message || 'Failed to load');
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


  async function handleMoveAssignment(id: number, newDate: string) {
    try {
      setAssignments((prev) =>
        prev.map((a) =>
          a.id === id ? { ...a, dueAt: newDate } : a
        )
      );

      await fetch(
        `http://localhost:4000/assignments/${id}?userId=${userId}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ dueAt: newDate }),
        }
      );
    } catch (err) {
      console.error(err);
    }
  }

  async function handleCreateEvent() {
  if (!newEvent.title || !newEvent.date) {
    alert("Title and date required");
    return;
  }

  const safeDate = new Date(
    newEvent.date + (newEvent.time ? `T${newEvent.time}:00` : "T12:00:00")
  ).toISOString();

  try {
    const res = await fetch(
      `http://localhost:4000/events?userId=${userId}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },

        body: JSON.stringify({
  title: newEvent.title,
  date: safeDate,
  time: newEvent.time || null,
  notes: newEvent.notes || null,
}),
      }
    );

    if (!res.ok) {
      const text = await res.text();
      console.error("BACKEND ERROR:", text);
      throw new Error("failed");
    }

    setShowModal(false);
    location.reload();

  } catch (err) {
    console.error(err);
    alert("Still broken — check terminal");
  }
}

  return (
    <main className="mx-auto w-full max-w-[1280px] px-8">
      <h1 className="text-[32px] font-black">Calendar</h1>


      <p className="mt-2 opacity-80">
        Assignment due dates (click a day).
      </p>

      {loading && <p className="mt-4">Loading…</p>}
      {error && <p className="mt-4 text-red-700">{error}</p>}

      {!loading && !error && (
        <MonthCalendar
          assignments={dueAssignments}
          onMoveAssignment={handleMoveAssignment}
        />
      )}


    </main>
  );
}