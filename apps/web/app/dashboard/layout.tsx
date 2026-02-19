import Sidebar from "./_components/Sidebar";
import TopNav from "./_components/TopNav";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={styles.shell}>
      <Sidebar />

      <div style={styles.main}>
        <TopNav />
        <div style={styles.content}>{children}</div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  shell: {
  minHeight: "100vh",
  display: "grid",
  gridTemplateColumns: "240px 1fr",
  background: "#f3f4f6",
  color: "#111",
},
  main: {
    display: "flex",
    flexDirection: "column",
    minWidth: 0,
  },
  content: {
    padding: 24,
  },
};

