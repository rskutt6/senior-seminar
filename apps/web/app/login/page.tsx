'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    const res = await fetch('http://localhost:4000/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();

    if (!res.ok) {
      alert(data.message || 'Login failed');
      return;
    }

    if (data.accessToken) {
      localStorage.setItem('accessToken', data.accessToken);
    }

    router.push('/dashboard');
  };

  return (
    <div className="authWrap">
      <div className="authCard">
        <h1 className="authTitle">Login</h1>
        <p className="authSub">Welcome back — let’s get you in.</p>

        <form onSubmit={handleLogin} className="authForm">
          <label className="authLabel">
            Email
            <input
              className="authInput"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </label>

          <label className="authLabel">
            Password
            <input
              className="authInput"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </label>

          <button className="authButton" type="submit">
            Login
          </button>
        </form>

        <p className="authFooter">
          Don’t have an account? <Link href="/create-account">Create one</Link>
        </p>
      </div>
    </div>
  );
}