'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import WeekGrid from './_components/WeekGrid';

export default function DashboardPage() {
  const router = useRouter();

  useEffect(() => {
    const user = localStorage.getItem('user');

    if (!user) {
      router.push('/');
    }
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('user');
    router.push('/');
  };

  const week = {
    label: 'Week of Feb 16',
    days: [
      { name: 'Monday', items: ['Task 1', 'Task 2', 'Task 3'] },
      { name: 'Tuesday', items: ['Task 1', 'Task 2'] },
      { name: 'Wednesday', items: ['Task 1'] },
      { name: 'Thursday', items: ['Task 1', 'Task 2', 'Task 3'] },
      { name: 'Friday', items: ['Task 1', 'Task 2'] },
      { name: 'Saturday', items: ['Task 1'] },
      { name: 'Sunday', items: ['Task 1', 'Task 2', 'Task 3'] },
    ],
  };

  return (
    <main style={page}>
      <div style={card}>
        <div style={headerRow}>
          <div>
            <h1 style={title}>Dashboard</h1>
            <p style={subtitle}>{week.label}</p>
          </div>

          <div style={rightHeader}>
            <div style={pill}>Signed in</div>
            <button style={secondaryBtn} onClick={handleLogout}>
              Log out
            </button>
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

          <WeekGrid days={week.days} />
        </section>
      </div>
    </main>
  );
}

const page: React.CSSProperties = {
  minHeight: '100vh',
  padding: '24px',
};

const card: React.CSSProperties = {
  maxWidth: 1100,
  margin: '0 auto',
};

const headerRow: React.CSSProperties = {
  display: 'flex',
  alignItems: 'flex-start',
  justifyContent: 'space-between',
  gap: 16,
  marginBottom: 16,
};

const rightHeader: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 10,
};

const title: React.CSSProperties = {
  fontSize: 32,
  fontWeight: 900,
  margin: 0,
};

const subtitle: React.CSSProperties = {
  margin: '6px 0 0',
  opacity: 0.8,
};

const pill: React.CSSProperties = {
  padding: '8px 10px',
  borderRadius: 999,
  fontSize: 12,
  fontWeight: 700,
  border: '1px solid rgba(0,0,0,0.12)',
  background: 'rgba(16,185,129,0.12)',
};

const panel: React.CSSProperties = {
  borderRadius: 16,
  border: '1px solid rgba(0,0,0,0.08)',
  padding: 16,
  background: 'white',
};

const quickLinksRow: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
  gap: 12,
  marginBottom: 16,
};

const linkCard: React.CSSProperties = {
  display: 'block',
  textDecoration: 'none',
  border: '1px solid rgba(0,0,0,0.08)',
  borderRadius: 14,
  padding: 14,
  background: '#f8fafc',
  color: '#111',
};

const linkTitle: React.CSSProperties = {
  fontSize: 16,
  fontWeight: 800,
  marginBottom: 4,
};

const linkText: React.CSSProperties = {
  fontSize: 14,
  color: 'rgba(17,17,17,0.7)',
};

const secondaryBtn: React.CSSProperties = {
  padding: '10px 14px',
  borderRadius: 12,
  border: '1px solid rgba(0,0,0,0.12)',
  background: 'white',
  color: 'black',
  fontWeight: 700,
  cursor: 'pointer',
};