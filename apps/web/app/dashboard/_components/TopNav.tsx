import Link from "next/link";

const tabs = [
  { label: "Calendar", href: "/dashboard/calendar" },
  { label: "Audio Library", href: "/dashboard/audio-library" },
  { label: "Input Assignments", href: "/dashboard/input-assignments" },
];

export default function TopNav() {
  return (
    <header style={styles.header} aria-label="Top navigation">
      <div style={styles.row}>
        {tabs.map((t) => (
          <Link key={t.href} href={t.href} style={styles.tab}>
            {t.label}
          </Link>
        ))}
      </div>
    </header>
  );
}

const styles: Record<string, React.CSSProperties> = {
  header: {
    borderBottom: "1px solid rgba(255,255,255,0.12)",
    padding: 16,
  },
  row: {
    display: "flex",
    gap: 10,
    flexWrap: "wrap",
  },
  tab: {
    padding: "12px 14px",
    borderRadius: 12,
    border: "1px solid rgba(255,255,255,0.12)",
    textDecoration: "none",
    fontWeight: 900,
    color: "white",
  },
};
