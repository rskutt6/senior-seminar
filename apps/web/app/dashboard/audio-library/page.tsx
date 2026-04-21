"use client";
import Link from "next/link";
import { useEffect, useState } from "react";

type AudioItem = {
  id: number;
  title: string;
  sourceType: "pdf" | "text";
  sourceName?: string | null;
  createdAt: string;
};

export default function AudioLibraryPage() {
  const [items, setItems] = useState<AudioItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadLibrary() {
      try {
        setLoading(true);
        setError("");
        const res = await fetch("http://localhost:4000/audio/library");
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data?.message || "Failed to load audio library");
        }
        setItems(data);
      } catch (err: any) {
        setError(err.message || "Failed to load audio library");
      } finally {
        setLoading(false);
      }
    }
    loadLibrary();
  }, []);

  return (
    <main style={page}>
      <div style={card}>
        <div style={headerRow}>
          <div>
            <h1 style={title}>Audio Library</h1>
            <p style={subtitle}>View and listen to your previously generated audio.</p>
          </div>
          <Link href="/dashboard/audio-library/create" style={primaryBtn}>
            Create Audio
          </Link>
        </div>

        {loading && <p style={mutedText}>Loading your audio library...</p>}

        {error && <div style={errorBox}>{error}</div>}

        {!loading && !error && items.length === 0 && (
          <div style={emptyBox}>
            <p style={emptyTitle}>No audio yet</p>
            <p style={emptySubtitle}>Create your first audio file from a PDF or pasted text.</p>
            <Link href="/dashboard/audio-library/create" style={primaryBtn}>
              Create Audio
            </Link>
          </div>
        )}

        {!loading && !error && items.length > 0 && (
          <div style={grid}>
            {items.map((item) => (
              <div key={item.id} style={itemCard}>
                <div style={itemInner}>
                  <div>
                    <h2 style={itemTitle}>{item.title}</h2>
                    <p style={itemMeta}>
                      {item.sourceType === "pdf" ? "PDF" : "Pasted text"}
                      {item.sourceName ? ` • ${item.sourceName}` : ""}
                    </p>
                    <p style={itemDate}>{new Date(item.createdAt).toLocaleString()}</p>
                  </div>
                  <Link href={`/dashboard/audio-library/${item.id}`} style={secondaryBtn}>
                    Open
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

const page: React.CSSProperties = { minHeight: '100vh', padding: 24, background: '#F4F1EC', color: '#6E7F5B' };
const card: React.CSSProperties = { maxWidth: 900, margin: '0 auto' };
const headerRow: React.CSSProperties = { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, marginBottom: 24 };
const title: React.CSSProperties = { fontSize: 28, fontWeight: 900, color: '#6E7F5B', marginBottom: 6 };
const subtitle: React.CSSProperties = { fontSize: 14, color: '#8A7967' };
const primaryBtn: React.CSSProperties = { display: 'inline-block', textDecoration: 'none', background: '#6E7F5B', color: '#fff', fontWeight: 700, fontSize: 14, padding: '10px 18px', borderRadius: 12 };
const secondaryBtn: React.CSSProperties = { display: 'inline-block', textDecoration: 'none', background: '#ffffff', color: '#6E7F5B', fontWeight: 700, fontSize: 14, padding: '8px 16px', borderRadius: 10, border: '1px solid #9CAF88' };
const mutedText: React.CSSProperties = { color: '#8A7967', fontSize: 14 };
const errorBox: React.CSSProperties = { background: 'rgba(201,131,122,0.15)', border: '1px solid #c9837a', color: '#c9837a', borderRadius: 12, padding: '12px 16px', marginBottom: 16 };
const emptyBox: React.CSSProperties = { background: '#ffffff', border: '1px solid #9CAF88', borderRadius: 16, padding: 32, textAlign: 'center' };
const emptyTitle: React.CSSProperties = { fontSize: 18, fontWeight: 700, color: '#6E7F5B', marginBottom: 8 };
const emptySubtitle: React.CSSProperties = { fontSize: 14, color: '#8A7967', marginBottom: 20 };
const grid: React.CSSProperties = { display: 'grid', gap: 12 };
const itemCard: React.CSSProperties = { background: '#ffffff', border: '1px solid #9CAF88', borderRadius: 14, padding: '16px 20px' };
const itemInner: React.CSSProperties = { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 };
const itemTitle: React.CSSProperties = { fontSize: 16, fontWeight: 700, color: '#6E7F5B', marginBottom: 4 };
const itemMeta: React.CSSProperties = { fontSize: 13, color: '#8A7967' };
const itemDate: React.CSSProperties = { fontSize: 12, color: '#8A7967', marginTop: 4 };
