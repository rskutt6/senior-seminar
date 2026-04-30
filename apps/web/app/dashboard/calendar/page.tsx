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
  const [error, setError] = useState<string>('');
  const [deletingId, setDeletingId] = useState<number | null>(null);

  useEffect(() => {
    if (!userId) { setLoading(false); setError('You must be logged in.'); return; }
    async function load() {
      setLoading(true); setError('');
      try {
        const res = await fetch(`http://localhost:4000/assignments?userId=${userId}`, { cache: 'no-store' });
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

  const dueAssignments = useMemo(() => assignments.filter((a) => !!a.dueAt), [assignments]);

  async function handleDeleteAssignment(id: number) {
    setError(''); setDeletingId(id);
    const prev = assignments;
    setAssignments((cur) => cur.filter((a) => a.id !== id));
    try {
      const res = await fetch(`http://localhost:4000/assignments/${id}?userId=${userId}`, { method: 'DELETE' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || 'Failed to delete assignment');
    } catch (e: any) {
      setAssignments(prev);
      setError(e.message || 'Failed to delete assignment');
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <main style={page}>
      <div style={card}>
        <h1 style={title}>Calendar</h1>
        <p style={subtitle}>Assignment due dates — click a day to see details.</p>

        {error && <div style={errorBox}>{error}</div>}

        {loading && <p style={mutedText}>Loading...</p>}

        {!loading && !error && dueAssignments.length === 0 && (
          <div style={emptyBox}>
            <p style={emptyTitle}>No upcoming due dates</p>
            <p style={emptySubtitle}>Add an assignment to see it appear on your calendar.</p>
            <a href="/dashboard/input-assignments" style={emptyBtn}>Add assignment</a>
          </div>
        )}

        {!loading && !error && dueAssignments.length > 0 && (
          <MonthCalendar
            assignments={dueAssignments}
            onDelete={handleDeleteAssignment}
            deletingId={deletingId}
          />
        )}
      </div>
    </main>
  );
}

const page: React.CSSProperties = { minHeight: '100vh', padding: 24, background: '#F4F1EC', color: '#6E7F5B' };
const card: React.CSSProperties = { maxWidth: 1100, margin: '0 auto' };
const title: React.CSSProperties = { fontSize: 28, fontWeight: 900, color: '#6E7F5B', marginBottom: 6 };
const subtitle: React.CSSProperties = { fontSize: 14, color: '#8A7967', marginBottom: 24 };
const mutedText: React.CSSProperties = { color: '#8A7967', fontSize: 14 };
const errorBox: React.CSSProperties = { background: 'rgba(201,131,122,0.15)', border: '1px solid #c9837a', color: '#c9837a', borderRadius: 12, padding: '12px 16px', marginBottom: 16 };
const emptyBox: React.CSSProperties = { background: '#ffffff', border: '1px solid #9CAF88', borderRadius: 16, padding: 40, textAlign: 'center' };
const emptyTitle: React.CSSProperties = { fontSize: 18, fontWeight: 700, color: '#6E7F5B', marginBottom: 8 };
const emptySubtitle: React.CSSProperties = { fontSize: 14, color: '#8A7967', marginBottom: 20 };
const emptyBtn: React.CSSProperties = { display: 'inline-block', textDecoration: 'none', background: '#6E7F5B', color: '#fff', fontWeight: 700, fontSize: 14, padding: '10px 20px', borderRadius: 12 };
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
console.log("ALL ASSIGNMENTS:", aData);
        
      } catch (e: any) {
        setError(e.message || 'Failed to load');
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [userId]);

  const dueAssignments = useMemo(() => {
  return assignments.filter((a) => {
    if (!a.dueAt) return false;

    const d = new Date(a.dueAt);
    return !Number.isNaN(d.getTime());
  });
}, [assignments]);


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
