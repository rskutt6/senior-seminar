import Link from "next/link";

export default function DayCard({
  dayName,
  items,
}: {
  dayName: string;
  items: string[];
}) {
  return (
    <div style={styles.card}>
      <div style={styles.dayHeader}>{dayName}</div>

      <ol style={styles.list}>
        {items.slice(0, 3).map((task, i) => (
          <li key={i}>{task}</li>
        ))}
      </ol>

      <Link
        href={`/dashboard/day/${dayName.toLowerCase()}`}
        style={styles.viewAll}
      >
        View all…
      </Link>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  card: {
    border: "1px solid rgba(0,0,0,0.12)",
    borderRadius: 16,
    padding: 20,
    background: "white",
    minHeight: 200,
    boxShadow: "0 8px 20px rgba(0,0,0,0.08)",
  },
  dayHeader: {
    fontSize: 18,
    fontWeight: 900,
    borderBottom: "1px solid rgba(0,0,0,0.08)",
    paddingBottom: 8,
    marginBottom: 12,
  },
  list: {
    margin: 0,
    paddingLeft: 18,
    lineHeight: 1.9,
  },
  viewAll: {
    display: "inline-block",
    marginTop: 12,
    padding: "8px 12px",
    borderRadius: 12,
    border: "1px solid rgba(0,0,0,0.15)",
    textDecoration: "none",
    fontWeight: 700,
  },
};



