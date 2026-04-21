'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import WeekGrid from './_components/WeekGrid';

function getCurrentWeekDays() {
  const today = new Date();
  const dayOfWeek = today.getDay();
  const monday = new Date(today);
  monday.setDate(today.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));

  const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  return dayNames.map((name, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return { name, items: [] as string[], date: d };
  });
}

function getWeekLabel() {
  const today = new Date();
  const dayOfWeek = today.getDay();
  const monday = new Date(today);
  monday.setDate(today.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
  return `Week of ${monday.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
}

function getTodayLabel() {
  return new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
}

export default function DashboardPage() {
  const router = useRouter();
  const [name, setName] = useState('');

  useEffect(() => {
    const user = localStorage.getItem('user');
    if (!user) { router.push('/'); return; }
    const stored = localStorage.getItem('name');
    if (stored) setName(stored);
  }, [router]);

  const weekDays = getCurrentWeekDays();

  return (
    <main style={page}>
      <div style={card}>
        <div style={headerRow}>
          <div>
            <h1 style={title}>{name ? `Hi, ${name} 👋` : 'Dashboard'}</h1>
            <p style={subtitle}>{getWeekLabel()}</p>
            <p style={todayLabel}>Today is {getTodayLabel()}</p>
          </div>
        </div>
        <section style={panel}>
          <div style={quickLinksRow}>
            <Link href="/dashboard/assignments" style={linkCard}>
              <div style={linkTitle}>Assignments</div>
              <div style={linkText}>View and manage all assignments</div>
            </Link>
            <Link href="/dashboard/input-assignments" style={linkCard}>
              <div style={linkTitle}>Add assignment</div>
              <div style={linkText}>Paste in a new assignment</div>
            </Link>
          </div>
          <WeekGrid days={weekDays} />
        </section>
      </div>
    </main>
  );
}

const page: React.CSSProperties = { minHeight: '100vh', padding: '24px', background: '#F4F1EC', color: '#6E7F5B' };
const card: React.CSSProperties = { maxWidth: 1100, margin: '0 auto' };
const headerRow: React.CSSProperties = { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, marginBottom: 16 };
const title: React.CSSProperties = { fontSize: 32, fontWeight: 900, margin: 0, color: '#6E7F5B' };
const subtitle: React.CSSProperties = { margin: '6px 0 0', opacity: 0.8, color: '#8A7967' };
const todayLabel: React.CSSProperties = { margin: '4px 0 0', fontSize: 13, color: '#9CAF88', fontWeight: 700 };
const panel: React.CSSProperties = { borderRadius: 16, border: '1px solid #9CAF88', padding: 16, background: '#ffffff' };
const quickLinksRow: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 12, marginBottom: 16 };
const linkCard: React.CSSProperties = { display: 'block', textDecoration: 'none', border: '1px solid #7FA7B5', borderRadius: 14, padding: 14, background: '#F4F1EC', color: '#6E7F5B' };
const linkTitle: React.CSSProperties = { fontSize: 16, fontWeight: 800, marginBottom: 4, color: '#6E7F5B' };
const linkText: React.CSSProperties = { fontSize: 14, color: '#8A7967' };
