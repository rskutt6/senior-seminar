"use client";

import { useMemo, useState } from "react";

type Assignment = { id: string; title: string; dueDate: string }; // YYYY-MM-DD

function toISODate(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export default function MonthCalendar({ assignments }: { assignments: Assignment[] }) {
  const [cursor, setCursor] = useState(() => new Date());
  const [selected, setSelected] = useState(() => toISODate(new Date()));

  const year = cursor.getFullYear();
  const month = cursor.getMonth(); // 0-11

  const monthLabel = cursor.toLocaleDateString(undefined, {
    month: "long",
    year: "numeric",
  });

  // Build grid start: Sunday of week containing the 1st
  const gridDays = useMemo(() => {
    const first = new Date(year, month, 1);
    const start = new Date(first);
    start.setDate(first.getDate() - first.getDay()); // back to Sunday

    const days: Date[] = [];
    for (let i = 0; i < 42; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      days.push(d);
    }
    return days;
  }, [year, month]);

  const byDate = useMemo(() => {
    const map = new Map<string, Assignment[]>();
    for (const a of assignments) {
      if (!map.has(a.dueDate)) map.set(a.dueDate, []);
      map.get(a.dueDate)!.push(a);
    }
    return map;
  }, [assignments]);

  const selectedAssignments = byDate.get(selected) ?? [];

  function prevMonth() {
    setCursor(new Date(year, month - 1, 1));
  }
  function nextMonth() {
    setCursor(new Date(year, month + 1, 1));
  }

  return (
    <div style={styles.wrap}>
      {/* Header */}
      <div style={styles.header}>
        <button type="button" onClick={prevMonth} style={styles.navBtn} aria-label="Previous month">
          ←
        </button>

        <div style={styles.monthTitle}>{monthLabel}</div>

        <button type="button" onClick={nextMonth} style={styles.navBtn} aria-label="Next month">
          →
        </button>
      </div>

      {/* Weekday labels */}
      <div style={styles.weekdays} aria-hidden="true">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((w) => (
          <div key={w} style={styles.weekday}>
            {w}
          </div>
        ))}
      </div>

      {/* Grid */}
      <div style={styles.grid} role="grid" aria-label="Monthly calendar">
        {gridDays.map((d) => {
          const iso = toISODate(d);
          const inMonth = d.getMonth() === month;
          const isSelected = iso === selected;
          const items = byDate.get(iso) ?? [];

          return (
            <button
              key={iso}
              type="button"
              role="gridcell"
              onClick={() => setSelected(iso)}
              style={{
                ...styles.cell,
                ...(inMonth ? {} : styles.cellMuted),
                ...(isSelected ? styles.cellSelected : {}),
              }}
            >
              <div style={styles.dateRow}>
                <span style={styles.dateNum}>{d.getDate()}</span>
                {items.length > 0 ? <span style={styles.dot} aria-label={`${items.length} due`} /> : null}
              </div>

              {/* show up to 2 due items for readability */}
              <div style={styles.items}>
                {items.slice(0, 2).map((a) => (
                  <div key={a.id} style={styles.item}>
                    {a.title}
                  </div>
                ))}
                {items.length > 2 ? (
                  <div style={styles.more}>+{items.length - 2} more</div>
                ) : null}
              </div>
            </button>
          );
        })}
      </div>

      {/* Day detail panel (matches your “press day to see what is due”) */}
      <div style={styles.detail} aria-label="Selected day details">
        <div style={styles.detailTitle}>Due on {selected}</div>
        {selectedAssignments.length === 0 ? (
          <div style={{ opacity: 0.8 }}>No assignments due.</div>
        ) : (
          <ul style={styles.detailList}>
            {selectedAssignments.map((a) => (
              <li key={a.id} style={styles.detailItem}>
                {a.title}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  wrap: { marginTop: 16 },
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 12,
  },
  monthTitle: { fontSize: 20, fontWeight: 900 },
  navBtn: {
    padding: "10px 12px",
    borderRadius: 12,
    border: "1px solid rgba(0,0,0,0.15)",
    background: "white",
    fontWeight: 900,
    cursor: "pointer",
  },

  weekdays: {
    display: "grid",
    gridTemplateColumns: "repeat(7, 1fr)",
    gap: 10,
    marginBottom: 10,
  },
  weekday: { fontWeight: 900, opacity: 0.75 },

  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(7, 1fr)",
    gap: 10,
  },
  cell: {
    textAlign: "left",
    border: "1px solid rgba(0,0,0,0.12)",
    borderRadius: 14,
    background: "white",
    padding: 12,
    minHeight: 110,
    cursor: "pointer",
  },
  cellMuted: { opacity: 0.45 },
  cellSelected: {
    outline: "3px solid rgba(37, 99, 235, 0.35)",
    borderColor: "rgba(37, 99, 235, 0.35)",
  },

  dateRow: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 },
  dateNum: { fontWeight: 900 },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 999,
    background: "#2563eb",
    display: "inline-block",
  },

  items: { display: "grid", gap: 6 },
  item: {
    fontSize: 13,
    fontWeight: 700,
    border: "1px solid rgba(0,0,0,0.08)",
    borderRadius: 10,
    padding: "6px 8px",
    background: "rgba(0,0,0,0.03)",
  },
  more: { fontSize: 12, fontWeight: 800, opacity: 0.7 },

  detail: {
    marginTop: 14,
    border: "1px solid rgba(0,0,0,0.12)",
    borderRadius: 16,
    padding: 14,
    background: "white",
  },
  detailTitle: { fontWeight: 900, marginBottom: 8 },
  detailList: { margin: 0, paddingLeft: 18, lineHeight: 1.9 },
  detailItem: { fontWeight: 700 },
};
