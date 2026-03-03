"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const res = await fetch("http://localhost:4000/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json()

    if (!res.ok) {
      alert(data.message || "Login failed");
      return;
    }

    localStorage.setItem("user", JSON.stringify(data));
    router.replace("/dashboard");
  };

  return (
    <main style={page}>
      <div style={card}>
        <h1 style={title}>Login</h1>
        <p style={subtitle}>Welcome back.</p>

        <form onSubmit={handleLogin} style={form}>
          <input
            style={input}
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            style={input}
            placeholder="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <button type="submit" style={primaryBtn}>
            Log in
          </button>
        </form>

        {/* IMPORTANT: This is a Link, not a button, so it can’t hijack submit */}
        <div style={footer}>
          <span style={muted}>No account?</span>{" "}
          <Link href="/create-account" style={link}>
            Create one
          </Link>
        </div>
      </div>
    </main>
  );
}

const page: React.CSSProperties = {
  minHeight: "100vh",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  background: "#0b0d12",
  padding: 24,
  color: "#e9eef8",
  fontFamily:
    'ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, "Helvetica Neue", Arial',
};

const card: React.CSSProperties = {
  width: "100%",
  maxWidth: 420,
  borderRadius: 18,
  padding: 24,
  background: "rgba(20,24,33,0.9)",
  border: "1px solid rgba(255,255,255,0.08)",
  boxShadow: "0 18px 55px rgba(0,0,0,0.55)",
};

const title: React.CSSProperties = { margin: 0, fontSize: 26 };
const subtitle: React.CSSProperties = {
  margin: "6px 0 18px",
  fontSize: 13,
  color: "rgba(233,238,248,0.6)",
};

const form: React.CSSProperties = { display: "flex", flexDirection: "column", gap: 10 };

const input: React.CSSProperties = {
  padding: "11px 12px",
  borderRadius: 12,
  border: "1px solid rgba(255,255,255,0.10)",
  background: "rgba(7,10,16,0.55)",
  color: "#e9eef8",
  outline: "none",
};

const primaryBtn: React.CSSProperties = {
  marginTop: 8,
  padding: "11px 12px",
  borderRadius: 12,
  border: "1px solid rgba(255,255,255,0.10)",
  background: "rgba(255,255,255,0.92)",
  color: "#0b0d12",
  fontWeight: 650,
  cursor: "pointer",
};

const footer: React.CSSProperties = {
  marginTop: 14,
  fontSize: 13,
  textAlign: "center",
};

const muted: React.CSSProperties = { color: "rgba(233,238,248,0.6)" };

const link: React.CSSProperties = {
  color: "#e9eef8",
  textDecoration: "underline",
  textUnderlineOffset: 4,
};