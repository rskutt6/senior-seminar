'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function CreateAccountPage() {
  const router = useRouter();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();

    // Require a real-ish email like name@example.com
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      alert('Please enter a valid email address (like name@example.com).');
      return;
    }

    if (password.length < 6) {
      alert('Password must be at least 6 characters.');
      return;
    }

    const res = await fetch('http://localhost:4000/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ firstName, lastName, email, password }),
    });

    const data = await res.json();

    if (!res.ok) {
      alert(data.message || 'Failed to create account');
      return;
    }

    // Log them in so dashboard doesn't redirect them back
    localStorage.setItem('user', JSON.stringify(data));

    // Go straight to dashboard
    router.push('/dashboard');
  };

  return (
    <main style={page}>
      <div style={card}>
        <div style={header}>
          <h1 style={title}>Create account</h1>
          <p style={subtitle}>
            Use a real email — then you’ll go straight to your dashboard.
          </p>
        </div>

        <form onSubmit={handleCreateAccount} style={form}>
          <div style={row}>
            <div style={field}>
              <label style={label}>First name</label>
              <input
                style={input}
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="First Name"
                required
              />
            </div>

            <div style={field}>
              <label style={label}>Last name</label>
              <input
                style={input}
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Last Name"
                required
              />
            </div>
          </div>

          <div style={field}>
            <label style={label}>Email</label>
            <input
              style={input}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
              required
            />
          </div>

          <div style={field}>
            <label style={label}>Password</label>
            <input
              style={input}
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
            <p style={hint}>Must be at least 6 characters.</p>
          </div>

          <button type="submit" style={primaryBtn}>
            Create account
          </button>

          <button
            type="button"
            style={ghostBtn}
            onClick={() => router.push('/login')}
          >
            Back to login
          </button>
        </form>
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
  width: '560px',
  background: '#111827',
  borderRadius: '20px',
  padding: '40px',
  color: '#f9fafb',
  boxShadow: '0 10px 25px rgba(0,0,0,0.4)',
  border: '1px solid rgba(255,255,255,0.06)',
};

const header: React.CSSProperties = {
  marginBottom: '22px',
};

const title: React.CSSProperties = {
  fontSize: '28px',
  fontWeight: 700,
  margin: 0,
};

const subtitle: React.CSSProperties = {
  color: '#9ca3af',
  marginTop: '8px',
  marginBottom: 0,
  lineHeight: 1.4,
};

const form: React.CSSProperties = {
  display: 'grid',
  gap: '16px',
};

const row: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: '12px',
};

const field: React.CSSProperties = {
  display: 'grid',
  gap: '8px',
};

const label: React.CSSProperties = {
  fontSize: '14px',
  color: '#cbd5e1',
};

const input: React.CSSProperties = {
  background: '#0b1220',
  border: '1px solid #243042',
  color: '#f9fafb',
  padding: '12px 14px',
  borderRadius: '12px',
  outline: 'none',
};

const hint: React.CSSProperties = {
  fontSize: '12px',
  color: '#94a3b8',
  marginTop: '-2px',
};

const primaryBtn: React.CSSProperties = {
  background: '#3b82f6',
  color: 'white',
  border: 'none',
  padding: '12px 16px',
  borderRadius: '12px',
  cursor: 'pointer',
  fontWeight: 700,
};

const ghostBtn: React.CSSProperties = {
  background: 'transparent',
  color: '#cbd5e1',
  border: '1px solid rgba(255,255,255,0.12)',
  padding: '12px 16px',
  borderRadius: '12px',
  cursor: 'pointer',
  fontWeight: 600,
};
