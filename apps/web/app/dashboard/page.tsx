import WeekGrid from "./_components/WeekGrid";

export default function DashboardPage() {
  const week = {
    label: "Week of Feb 16",
    days: [
      { name: "Monday", items: ["Task 1", "Task 2", "Task 3"] },
      { name: "Tuesday", items: ["Task 1", "Task 2"] },
      { name: "Wednesday", items: ["Task 1"] },
      { name: "Thursday", items: ["Task 1", "Task 2", "Task 3"] },
      { name: "Friday", items: ["Task 1", "Task 2"] },
      { name: "Saturday", items: ["Task 1"] },
      { name: "Sunday", items: ["Task 1", "Task 2", "Task 3"] },
    ],
  };

  return (
    <main>
      <h1 style={{ fontSize: 28, fontWeight: 900 }}>Dashboard</h1>
      <p style={{ opacity: 0.8 }}>{week.label}</p>

      <WeekGrid days={week.days} />
    </main>
  );
}
