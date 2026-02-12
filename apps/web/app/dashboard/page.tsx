export default function Dashboard() {
  return (
    <main style={page}>
      <div style={card}>
        <div style={headerRow}>
          <div>
            <h1 style={title}>Welcome to your dashboard</h1>
            <p style={subtitle}>Your account was successfully created.</p>
          </div>

          <div style={pill}>Signed in</div>
        </div>

        <div style={grid}>
          <section style={panel}>
            <h2 style={panelTitle}>Next steps</h2>
            <ul style={list}>
              <li>✅ Explore your features</li>
              <li>✅ Update your profile</li>
              <li>✅ Start using the app</li>
            </ul>
          </section>

          <section style={panel}>
            <h2 style={panelTitle}>Quick actions</h2>
            <div style={buttonRow}>
              <button style={primaryBtn}>Go to Profile</button>
              <button style={secondaryBtn}>Log out</button>
            </div>
            <p style={hint}>
              (Buttons are just UI for now — we can wire them up next.)
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}

const page: React.CSSProperties = {
  minHeight: '100vh',
  padding: '60px 16px',
  display: 'flex',
  justifyContent: 'center',
  backgroundColor: '#0f172a', // solid dark base
};


const card: React.CSSProperties = {
  width: '100%',
  maxWidth: 900,
  borderRadius: 20,
  padding: 28,
  backgroundColor: '#ffffff',
  boxShadow: '0 20px 60px rgba(0, 0, 0, 0.35)',
  color: '#0f172a',
};

const headerRow: React.CSSProperties = {
  display: 'flex',
  alignItems: 'flex-start',
  justifyContent: 'space-between',
  gap: 16,
  marginBottom: 18,
};

const title: React.CSSProperties = {
  fontSize: 28,
  fontWeight: 800,
  margin: 0,
  letterSpacing: -0.3,
  color: '#0f172a',
};

const subtitle: React.CSSProperties = {
  margin: '8px 0 0',
  color: '#334155',
};


const pill: React.CSSProperties = {
  padding: '8px 10px',
  borderRadius: 999,
  fontSize: 12,
  fontWeight: 700,
  border: '1px solid rgba(0,0,0,0.1)',
  background: 'rgba(16,185,129,0.12)',
};

const grid: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
  gap: 14,
};

const panel: React.CSSProperties = {
  borderRadius: 16,
  border: '1px solid rgba(0,0,0,0.08)',
  padding: 16,
  background: 'white',
};

const panelTitle: React.CSSProperties = {
  margin: 0,
  fontSize: 16,
  fontWeight: 800,
};

const list: React.CSSProperties = {
  margin: '10px 0 0',
  paddingLeft: 18,
  lineHeight: 1.8,
};

const buttonRow: React.CSSProperties = {
  display: 'flex',
  gap: 10,
  marginTop: 10,
  flexWrap: 'wrap',
};

const primaryBtn: React.CSSProperties = {
  padding: '10px 14px',
  borderRadius: 12,
  border: '1px solid rgba(0,0,0,0.12)',
  background: 'black',
  color: 'white',
  fontWeight: 700,
  cursor: 'pointer',
};

const secondaryBtn: React.CSSProperties = {
  padding: '10px 14px',
  borderRadius: 12,
  border: '1px solid rgba(0,0,0,0.12)',
  background: 'white',
  color: 'black',
  fontWeight: 700,
  cursor: 'pointer',
};

const hint: React.CSSProperties = {
  margin: '10px 0 0',
  fontSize: 12,
  color: '#64748b',
};
