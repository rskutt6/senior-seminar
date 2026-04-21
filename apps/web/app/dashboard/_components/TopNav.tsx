'use client';
import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const tabs = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "Calendar", href: "/dashboard/calendar" },
  { label: "Audio Library", href: "/dashboard/audio-library" },
  { label: "Input Assignments", href: "/dashboard/input-assignments" },
  { label: "Settings", href: "/dashboard/settings" },
];

export default function TopNav() {
  const [name, setName] = useState('');
  const router = useRouter();

  useEffect(() => {
    const stored = localStorage.getItem('name');
    if (stored) setName(stored);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('name');
    router.push('/login');
  };

  return (
    <header style={styles.header} aria-label="Top navigation">
      <Image
        src="/FocusFlow_Logo.png"
        alt="FocusFlow Logo"
        width={60}
        height={60}
        style={{ objectFit: "contain" }}
      />
      <nav style={styles.row}>
        {tabs.map((t) => (
          <Link key={t.href} href={t.href} style={styles.tab}>
            {t.label}
          </Link>
        ))}
        <button onClick={handleLogout} style={styles.tab}>
          Logout →
        </button>
      </nav>
      {name && <div style={styles.greeting}>Hi, {name}</div>}
    </header>
  );
}

const styles: Record<string, React.CSSProperties> = {
  header: {
    borderBottom: "1px solid #9CAF88",
    padding: "12px 24px",
    background: "#ffffff",
    display: "flex",
    alignItems: "center",
    gap: 16,
  },
  row: {
    display: "flex",
    flex: 1,
    justifyContent: "space-evenly",
    alignItems: "center",
  },
  tab: {
    textDecoration: "none",
    fontWeight: 700,
    fontSize: 18,
    color: "#6E7F5B",
    border: "none",
    background: "transparent",
    cursor: "pointer",
    fontFamily: "inherit",
    padding: 0,
  },
  greeting: {
    fontWeight: 700,
    fontSize: 15,
    color: "#8A7967",
    whiteSpace: "nowrap",
  },
};
