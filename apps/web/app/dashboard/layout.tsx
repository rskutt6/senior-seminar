import TopNav from "./_components/TopNav";
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={styles.shell}>
      <TopNav />
      <div style={styles.content}>{children}</div>
    </div>
  );
}
const styles: Record<string, React.CSSProperties> = {
  shell: {
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column",
    background: "#F4F1EC",
    color: "#6E7F5B",
  },
  content: {
    padding: 24,
  },
};
