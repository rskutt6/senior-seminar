import DayCard from "./DayCard";

export default function WeekGrid({
  days,
}: {
  days: { name: string; items: string[] }[];
}) {
  return (
    <section style={styles.grid} aria-label="Week overview">
      {days.map((d) => (
        <DayCard key={d.name} dayName={d.name} items={d.items} />
      ))}
    </section>
  );
}

const styles: Record<string, React.CSSProperties> = {
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(280px, 1fr))",
    gap: 16,
    marginTop: 16,
  },
};
