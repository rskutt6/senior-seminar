import Link from "next/link";
import Image from "next/image";
export default function Sidebar() {
  return (
    <aside style={styles.sidebar} aria-label="Sidebar">
      <div style={styles.logoBox}>
        <Image
          src="/FocusFlow_Logo.png"
          alt="FocusFlow Logo"
          width={100}
          height={100}
          style={{ objectFit: "contain" }}
        />
      </div>
      <nav style={styles.nav} aria-label="Sidebar navigation">
        <Link href="/dashboard" style={styles.link}>
          Dashboard
        </Link>
        <Link href="/dashboard/calendar" style={styles.link}>
          Calendar
        </Link>
        <Link href="/dashboard/audio-library" style={styles.link}>
          Audio Library
        </Link>
        <Link href="/dashboard/input-assignments" style={styles.link}>
          Import Assignments
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
    borderRight: "1px solid #9CAF88",
    padding: 16,
    display: "flex",
    flexDirection: "column",
    gap: 16,
    background: "#ffffff",
  },
  logoBox: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 12,
    padding: 12,
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
    border: "1px solid #9CAF88",
    textDecoration: "none",
    fontWeight: 800,
    color: "#6E7F5B",
    background: "#F4F1EC",
  },
};
