'use client';

import { useState } from 'react';

type FormState = {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
};

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

function isValidPassword(password: string) {
  return password.length >= 8;
}

export default function CreateAccountPage() {
  const [form, setForm] = useState<FormState>({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const canSubmit =
    form.firstName.trim() &&
    form.lastName.trim() &&
    isValidEmail(form.email) &&
    isValidPassword(form.password);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!canSubmit) {
      setError(
        'Please fill out all fields. Password must be at least 8 characters.',
      );
      return;
    }

    const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
    if (!baseUrl) {
      setError('NEXT_PUBLIC_API_BASE_URL is not set.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${baseUrl}/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: form.firstName.trim(),
          lastName: form.lastName.trim(),
          email: form.email.trim().toLowerCase(),
          password: form.password,
        }),
      });

      if (!res.ok) {
        let msg = `Request failed (${res.status})`;
        try {
          const data = await res.json();
          if (typeof data?.message === 'string') msg = data.message;
          if (Array.isArray(data?.message)) msg = data.message.join(', ');
        } catch {}
        throw new Error(msg);
      }

      setSuccess('Account created! 🎉');
      setForm({ firstName: '', lastName: '', email: '', password: '' });
    } catch (err: any) {
      setError(err?.message ?? 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={{ maxWidth: 520, margin: '40px auto', padding: 16 }}>
      <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>
        Create Account
      </h1>

      <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 14 }}>
        <label style={labelStyle}>
          <span>First name</span>
          <input
            value={form.firstName}
            onChange={(e) => setForm({ ...form, firstName: e.target.value })}
            style={inputStyle}
          />
        </label>

        <label style={labelStyle}>
          <span>Last name</span>
          <input
            value={form.lastName}
            onChange={(e) => setForm({ ...form, lastName: e.target.value })}
            style={inputStyle}
          />
        </label>

        <label style={labelStyle}>
          <span>Email</span>
          <input
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            inputMode="email"
            style={inputStyle}
          />
        </label>

        <label style={labelStyle}>
          <span>Password</span>
          <input
            type="password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            style={inputStyle}
          />
          <span style={{ fontSize: 12, opacity: 0.7 }}>
            Must be at least 8 characters
          </span>
        </label>

        {error && (
          <div style={{ background: '#ffecec', padding: 10, borderRadius: 10 }}>
            <span style={{ color: 'crimson' }}>{error}</span>
          </div>
        )}

        {success && (
          <div style={{ background: '#eaffea', padding: 10, borderRadius: 10 }}>
            <span>{success}</span>
          </div>
        )}

        <button
          type="submit"
          disabled={!canSubmit || loading}
          style={{
            padding: '10px 14px',
            borderRadius: 10,
            border: '1px solid #ddd',
            fontWeight: 600,
            cursor: !canSubmit || loading ? 'not-allowed' : 'pointer',
            opacity: !canSubmit || loading ? 0.6 : 1,
          }}
        >
          {loading ? 'Creating...' : 'Create account'}
        </button>
      </form>
    </main>
  );
}

const labelStyle: React.CSSProperties = {
  display: 'grid',
  gap: 6,
};

const inputStyle: React.CSSProperties = {
  padding: '10px 12px',
  borderRadius: 10,
  border: '1px solid #ddd',
  outline: 'none',
};
