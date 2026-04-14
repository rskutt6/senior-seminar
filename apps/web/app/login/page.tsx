"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Image from "next/image";

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

    const data = await res.json();

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
        <div style={logoWrapper}>
          <Image
            src="/FocusFlow_Logo.png"
            alt="FocusFlow Logo"
            width={120}
            height={120}
            style={{ objectFit: "contain" }}
          />
        </div>

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
  background: "#F4F1EC",
  padding: 24,
  color: "#6E7F5B",
  fontFamily:
    'ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, "Helvetica Neue", Arial',
};

const card: React.CSSProperties = {
  width: "100%",
  maxWidth: 420,
  borderRadius: 18,
  padding: 24,
  background: "#ffffff",
  border: "1px solid #9CAF88",
  boxShadow: "0 18px 55px rgba(0,0,0,0.08)",
};

const logoWrapper: React.CSSProperties = {
  display: "flex",
  justifyContent: "center",
  marginBottom: 16,
};

const title: React.CSSProperties = { margin: 0, fontSize: 26, color: "#6E7F5B", textAlign: "center" };
const subtitle: React.CSSProperties = {
  margin: "6px 0 18px",
  fontSize: 13,
  color: "#8A7967",
  textAlign: "center",
};

const form: React.CSSProperties = { display: "flex", flexDirection: "column", gap: 10 };

const input: React.CSSProperties = {
  padding: "11px 12px",
  borderRadius: 12,
  border: "1px solid #7FA7B5",
  background: "#F4F1EC",
  color: "#6E7F5B",
  outline: "none",
};

const primaryBtn: React.CSSProperties = {
  marginTop: 8,
  padding: "11px 12px",
  borderRadius: 12,
  border: "none",
  background: "#9CAF88",
  color: "#F4F1EC",
  fontWeight: 650,
  cursor: "pointer",
};

const footer: React.CSSProperties = {
  marginTop: 14,
  fontSize: 13,
  textAlign: "center",
};

const muted: React.CSSProperties = { color: "#8A7967" };

const link: React.CSSProperties = {
  color: "#7FA7B5",
  textDecoration: "underline",
  textUnderlineOffset: 4,
};
