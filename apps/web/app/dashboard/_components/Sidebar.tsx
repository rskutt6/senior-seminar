import Link from "next/link";

export default function Sidebar() {
  return (
    <aside style={styles.sidebar} aria-label="Sidebar">
      <div style={styles.logoBox}>LOGO</div>

      <nav style={styles.nav} aria-label="Sidebar navigation">
        <Link href="/dashboard" style={styles.link}>
          Dashboard
        </Link>
        <Link href="/dashboard/settings" style={styles.link}>
          Settings
        </Link>
        <Link href="/logout" style={styles.link}>
          Logout →
        </Link>
      </nav>
    </aside>
  );
}

const styles: Record<string, React.CSSProperties> = {
  sidebar: {
    borderRight: "1px solid rgba(255,255,255,0.12)",
    padding: 16,
    display: "flex",
    flexDirection: "column",
    gap: 16,
  },
  logoBox: {
    border: "1px solid rgba(255,255,255,0.18)",
    borderRadius: 12,
    padding: 12,
    fontWeight: 900,
    textAlign: "center",
    letterSpacing: 0.5,
  },
  nav: {
    display: "flex",
    flexDirection: "column",
    gap: 10,
    marginTop: 8,
  },
  link: {
    padding: "12px 12px",
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,0.12)",
    textDecoration: "none",
    fontWeight: 800,
    color: "white",
  },
};

