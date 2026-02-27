'use client';

import React, { useMemo, useState } from 'react';

type Assignment = {
  id: number;
  description: string;
  dueAt: string | null;
  weight: number | null;
  userId: number;
  courseId: number | null;
};

type Props = {
  assignments: Assignment[];
};

function pad2(n: number) {
  return String(n).padStart(2, '0');
}

function toLocalDateKey(date: Date) {
  // YYYY-MM-DD in *local time*
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}

function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function endOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0);
}

function addDays(d: Date, days: number) {
  const copy = new Date(d);
  copy.setDate(copy.getDate() + days);
  return copy;
}

function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export default function MonthCalendar({ assignments }: Props) {
  // Pick month to display (defaults to "today")
  const [viewDate, setViewDate] = useState(() => new Date());
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);

  // Group assignments by local day key (YYYY-MM-DD)
  const byDay = useMemo(() => {
    const map = new Map<string, Assignment[]>();
    for (const a of assignments) {
      if (!a.dueAt) continue;
      const due = new Date(a.dueAt);
      if (Number.isNaN(due.getTime())) continue;

      const key = toLocalDateKey(due);
      const existing = map.get(key) ?? [];
      existing.push(a);
      map.set(key, existing);
    }

    // Sort assignments on each day (by dueAt time, then id)
    for (const [k, list] of map) {
      list.sort((x, y) => {
        const tx = x.dueAt ? new Date(x.dueAt).getTime() : 0;
        const ty = y.dueAt ? new Date(y.dueAt).getTime() : 0;
        if (tx !== ty) return tx - ty;
        return x.id - y.id;
      });
      map.set(k, list);
    }

    return map;
  }, [assignments]);

  const monthStart = useMemo(() => startOfMonth(viewDate), [viewDate]);
  const monthEnd = useMemo(() => endOfMonth(viewDate), [viewDate]);

  // Build a 6-week grid (Sun -> Sat), starting at the Sunday before monthStart
  const gridDays = useMemo(() => {
    const start = new Date(monthStart);
    const dayOfWeek = start.getDay(); // 0=Sun
    const gridStart = addDays(start, -dayOfWeek);

    const days: Date[] = [];
    for (let i = 0; i < 42; i++) days.push(addDays(gridStart, i));
    return days;
  }, [monthStart]);

  const selectedKey = selectedDay ? toLocalDateKey(selectedDay) : null;
  const selectedAssignments = selectedKey ? byDay.get(selectedKey) ?? [] : [];

  const monthLabel = useMemo(() => {
    const fmt = new Intl.DateTimeFormat(undefined, { month: 'long', year: 'numeric' });
    return fmt.format(viewDate);
  }, [viewDate]);

  function goPrevMonth() {
    setSelectedDay(null);
    setViewDate((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1));
  }

  function goNextMonth() {
    setSelectedDay(null);
    setViewDate((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1));
  }

  function goToday() {
    const t = new Date();
    setViewDate(new Date(t.getFullYear(), t.getMonth(), 1));
    setSelectedDay(t);
  }

  return (
    <div style={styles.wrap}>
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.headerLeft}>
          <h2 style={styles.monthTitle}>{monthLabel}</h2>
          <div style={styles.headerBtns}>
            <button type="button" style={styles.btn} onClick={goPrevMonth} aria-label="Previous month">
              ←
            </button>
            <button type="button" style={styles.btn} onClick={goNextMonth} aria-label="Next month">
              →
            </button>
            <button type="button" style={styles.btn} onClick={goToday}>
              Today
            </button>
          </div>
        </div>

        <div style={styles.legend}>
          <span style={styles.legendDot} />
          <span style={styles.legendText}>Has due dates</span>
        </div>
      </div>

      {/* Calendar + side panel */}
      <div style={styles.layout}>
        {/* Calendar grid */}
        <section aria-label="Month calendar" style={styles.calendarCard}>
          <div style={styles.dowRow} aria-hidden="true">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
              <div key={d} style={styles.dowCell}>
                {d}
              </div>
            ))}
          </div>

          <div style={styles.grid} role="grid" aria-label="Calendar days">
            {gridDays.map((day) => {
              const inMonth = day.getMonth() === monthStart.getMonth();
              const key = toLocalDateKey(day);
              const hasDue = (byDay.get(key)?.length ?? 0) > 0;
              const isSelected = selectedDay ? isSameDay(day, selectedDay) : false;

              const label = new Intl.DateTimeFormat(undefined, {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
                year: 'numeric',
              }).format(day);

              return (
                <button
                  key={key}
                  type="button"
                  role="gridcell"
                  aria-label={label}
                  aria-selected={isSelected}
                  onClick={() => setSelectedDay(day)}
                  style={{
                    ...styles.dayCell,
                    ...(inMonth ? null : styles.dayCellOut),
                    ...(isSelected ? styles.dayCellSelected : null),
                  }}
                >
                  <div style={styles.dayTopRow}>
                    <span style={styles.dayNumber}>{day.getDate()}</span>
                    {hasDue && <span style={styles.dot} aria-label="Has due dates" />}
                  </div>

                  {/* preview up to 2 items in the cell */}
                  {hasDue && (
                    <div style={styles.preview}>
                      {(byDay.get(key) ?? []).slice(0, 2).map((a) => (
                        <div key={a.id} style={styles.previewItem} title={a.description}>
                          {a.description}
                        </div>
                      ))}
                      {(byDay.get(key)?.length ?? 0) > 2 && (
                        <div style={styles.previewMore}>+{(byDay.get(key)?.length ?? 0) - 2} more</div>
                      )}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </section>

        {/* Side panel */}
        <aside aria-label="Selected day details" style={styles.sideCard}>
          <h3 style={styles.sideTitle}>
            {selectedDay ? (
              <>
                {new Intl.DateTimeFormat(undefined, {
                  weekday: 'long',
                  month: 'long',
                  day: 'numeric',
                }).format(selectedDay)}
              </>
            ) : (
              <>Select a day</>
            )}
          </h3>

          {!selectedDay && <p style={styles.sideHint}>Click a date to see assignments due that day.</p>}

          {selectedDay && selectedAssignments.length === 0 && (
            <p style={styles.sideHint}>No assignments due on this day.</p>
          )}

          {selectedDay && selectedAssignments.length > 0 && (
            <ul style={styles.list}>
              {selectedAssignments.map((a) => {
                const time = a.dueAt
                  ? new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit' }).format(
                      new Date(a.dueAt)
                    )
                  : null;

                return (
                  <li key={a.id} style={styles.listItem}>
                    <div style={styles.itemMain}>
                      <div style={styles.itemTitle}>{a.description}</div>
                      <div style={styles.itemMeta}>
                        {time ? <span>Due {time}</span> : <span>No due time</span>}
                        {typeof a.weight === 'number' ? <span> • Weight {a.weight}%</span> : null}
                        {a.courseId ? <span> • Course #{a.courseId}</span> : null}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </aside>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  wrap: {
    marginTop: 16,
  },

  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    gap: 12,
    marginBottom: 12,
  },
  headerLeft: {
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
  },
  monthTitle: {
    margin: 0,
    fontSize: 22,
    fontWeight: 900,
    letterSpacing: -0.2,
  },
  headerBtns: {
    display: 'flex',
    gap: 8,
    flexWrap: 'wrap',
  },
  btn: {
    padding: '8px 10px',
    borderRadius: 10,
    border: '1px solid rgba(0,0,0,0.12)',
    background: 'white',
    cursor: 'pointer',
    fontWeight: 700,
  },
  legend: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    opacity: 0.85,
    fontSize: 13,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 999,
    background: '#2563eb',
    display: 'inline-block',
  },
  legendText: {},

  layout: {
    display: 'grid',
    gridTemplateColumns: '1.5fr 1fr',
    gap: 14,
    alignItems: 'start',
  },

  calendarCard: {
    border: '1px solid rgba(0,0,0,0.10)',
    borderRadius: 16,
    background: 'white',
    overflow: 'hidden',
    boxShadow: '0 10px 30px rgba(0,0,0,0.08)',
  },

  dowRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(7, 1fr)',
    borderBottom: '1px solid rgba(0,0,0,0.08)',
    background: 'rgba(0,0,0,0.02)',
  },
  dowCell: {
    padding: '10px 10px',
    fontSize: 12,
    fontWeight: 800,
    opacity: 0.75,
  },

  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(7, 1fr)',
  },

  dayCell: {
    minHeight: 96,
    padding: 10,
    borderRight: '1px solid rgba(0,0,0,0.06)',
    borderBottom: '1px solid rgba(0,0,0,0.06)',
    background: 'white',
    textAlign: 'left',
    cursor: 'pointer',
    outline: 'none',
  },
  dayCellOut: {
    background: 'rgba(0,0,0,0.02)',
    opacity: 0.65,
  },
  dayCellSelected: {
    boxShadow: 'inset 0 0 0 2px rgba(37, 99, 235, 0.55)',
    background: 'rgba(37, 99, 235, 0.06)',
  },

  dayTopRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 8,
  },
  dayNumber: {
    fontWeight: 900,
    fontSize: 14,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 999,
    background: '#2563eb',
  },

  preview: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
  },
  previewItem: {
    fontSize: 12,
    lineHeight: 1.2,
    padding: '4px 6px',
    borderRadius: 10,
    border: '1px solid rgba(0,0,0,0.10)',
    background: 'rgba(0,0,0,0.02)',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  previewMore: {
    fontSize: 12,
    opacity: 0.7,
  },

  sideCard: {
    border: '1px solid rgba(0,0,0,0.10)',
    borderRadius: 16,
    background: 'white',
    padding: 14,
    boxShadow: '0 10px 30px rgba(0,0,0,0.08)',
  },
  sideTitle: {
    margin: 0,
    fontSize: 16,
    fontWeight: 900,
  },
  sideHint: {
    margin: '10px 0 0',
    opacity: 0.75,
    fontSize: 13,
    lineHeight: 1.4,
  },

  list: {
    margin: '12px 0 0',
    paddingLeft: 18,
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
  },
  listItem: {
    padding: '10px 10px',
    borderRadius: 14,
    border: '1px solid rgba(0,0,0,0.10)',
    background: 'rgba(0,0,0,0.02)',
    listStyleType: 'none',
  },
  itemMain: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
  },
  itemTitle: {
    fontWeight: 900,
    fontSize: 13,
  },
  itemMeta: {
    fontSize: 12,
    opacity: 0.75,
  },
};