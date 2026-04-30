'use client';
import { useState } from 'react';

export default function SettingsPage() {
  const [profile, setProfile] = useState({ name: '', email: '' });
  const [passwords, setPasswords] = useState({ new: '', confirm: '' });

  const handleSaveProfile = () => {
    localStorage.setItem('name', profile.name);
  };

  return (
    <main style={page}>
      <div style={card}>
        <h1 style={title}>Settings</h1>

        <section style={section}>
          <h2 style={sectionTitle}>Profile</h2>
          <div style={field}>
            <label style={label}>Display name</label>
            <input
              style={input}
              type="text"
              placeholder="Your name"
              value={profile.name}
              onChange={(e) => setProfile({ ...profile, name: e.target.value })}
            />
          </div>
          <div style={field}>
            <label style={label}>Email</label>
            <input
              style={input}
              type="email"
              placeholder="you@example.com"
              value={profile.email}
              onChange={(e) => setProfile({ ...profile, email: e.target.value })}
            />
          </div>
          <button style={saveBtn} onClick={handleSaveProfile}>Save profile</button>
        </section>

        <section style={section}>
          <h2 style={sectionTitle}>Password</h2>
          <div style={field}>
            <label style={label}>New password</label>
            <input
              style={input}
              type="password"
              placeholder="••••••••"
              value={passwords.new}
              onChange={(e) => setPasswords({ ...passwords, new: e.target.value })}
            />
          </div>
          <div style={field}>
            <label style={label}>Confirm new password</label>
            <input
              style={input}
              type="password"
              placeholder="••••••••"
              value={passwords.confirm}
              onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })}
            />
          </div>
          <button style={saveBtn}>Update password</button>
        </section>
      </div>
    </main>
  );
}

const page: React.CSSProperties = { minHeight: '100vh', padding: 24, background: '#F4F1EC', color: '#6E7F5B' };
const card: React.CSSProperties = { maxWidth: 720, margin: '0 auto' };
const title: React.CSSProperties = { fontSize: 28, fontWeight: 900, color: '#6E7F5B', marginBottom: 24 };
const section: React.CSSProperties = { background: '#ffffff', border: '1px solid #9CAF88', borderRadius: 16, padding: '20px 24px', marginBottom: 16 };
const sectionTitle: React.CSSProperties = { fontSize: 15, fontWeight: 700, color: '#6E7F5B', marginBottom: 16, paddingBottom: 10, borderBottom: '1px solid #e8e4dc' };
const field: React.CSSProperties = { marginBottom: 14 };
const label: React.CSSProperties = { fontSize: 13, color: '#8A7967', marginBottom: 6, display: 'block' };
const input: React.CSSProperties = { width: '100%', padding: '10px 12px', borderRadius: 10, border: '1px solid #9CAF88', background: '#F4F1EC', color: '#6E7F5B', fontSize: 14, fontFamily: 'inherit', outline: 'none' };
const saveBtn: React.CSSProperties = { marginTop: 6, width: '100%', padding: 12, borderRadius: 12, border: 'none', background: '#6E7F5B', color: '#fff', fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' };
