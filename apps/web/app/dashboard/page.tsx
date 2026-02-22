'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function Dashboard() {
  const router = useRouter();

  useEffect(() => {
    const user = localStorage.getItem('user');

    // If no user is logged in, send back to create account page
    if (!user) {
      router.push('/');
    }
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('user');
    router.push('/');
  };

  return (
    <main style={page}>
      <div style={card}>
        <div style={headerRow}>
          <div>
            <h1 style={title}>Welcome to your dashboard</h1>
            <p style={subtitle}>Your account was successfully created.</p>
          </div>

          <div style={pill}>Signed in</div>
        </div>

        <div style={grid}>
          <section style={panel}>
            <h2 style={panelTitle}>Next steps</h2>
            <ul style={list}>
              <li>✅ Explore your features</li>
              <li>✅ Update your profile</li>
              <li>✅ Start using the app</li>
            </ul>
          </section>

          <section style={panel}>
            <h2 style={panelTitle}>Quick actions</h2>
            <div style={buttonRow}>
              <button style={primaryBtn}>Go to Profile</button>
              <button style={secondaryBtn} onClick={handleLogout}>
                Log out
              </button>
            </div>
            <p style={hint}>
              (Buttons are just UI for now — we can wire them up next.)
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}

const page: React.CSSProperties = {
  minHeight: '100vh',
  background: '#0f172a',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontFamily: 'system-ui, sans-serif',
  padding: '24px',
};

const card: React.CSSProperties = {
  background: '#111827',
  padding: '40px',
  borderRadius: '20px',
  width: '600px',
  color: '#f9fafb',
  boxShadow: '0 10px 25px rgba(0,0,0,0.4)',
};

const headerRow: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: '30px',
};

const title: React.CSSProperties = {
  fontSize: '28px',
  fontWeight: 700,
};

const subtitle: React.CSSProperties = {
  color: '#9ca3af',
};

const pill: React.CSSProperties = {
  background: '#22c55e',
  color: 'white',
  padding: '6px 14px',
  borderRadius: '999px',
  fontSize: '14px',
};

const grid: React.CSSProperties = {
  display: 'grid',
  gap: '20px',
};

const panel: React.CSSProperties = {
  background: '#1f2937',
  padding: '20px',
  borderRadius: '14px',
};

const panelTitle: React.CSSProperties = {
  marginBottom: '10px',
  fontSize: '18px',
};

const list: React.CSSProperties = {
  paddingLeft: '18px',
};

const buttonRow: React.CSSProperties = {
  display: 'flex',
  gap: '10px',
  marginBottom: '10px',
};

const primaryBtn: React.CSSProperties = {
  background: '#3b82f6',
  color: 'white',
  border: 'none',
  padding: '10px 16px',
  borderRadius: '10px',
  cursor: 'pointer',
  fontWeight: 600,
};

const secondaryBtn: React.CSSProperties = {
  background: '#ef4444',
  color: 'white',
  border: 'none',
  padding: '10px 16px',
  borderRadius: '10px',
  cursor: 'pointer',
  fontWeight: 600,
};

const hint: React.CSSProperties = {
  fontSize: '12px',
  color: '#9ca3af',
};
