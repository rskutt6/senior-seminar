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
  onDelete: (id: number) => void;
  deletingId: number | null;
};

function pad2(n: number) {
  return String(n).padStart(2, '0');
}

function toLocalDateKey(date: Date) {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(
    date.getDate()
  )}`;
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

export default function MonthCalendar({
  assignments,
  onDelete,
  deletingId,
}: Props) {
  const [viewDate, setViewDate] = useState(() => new Date());
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);

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

  const gridDays = useMemo(() => {
    const start = new Date(monthStart);
    const dayOfWeek = start.getDay();
    const gridStart = addDays(start, -dayOfWeek);

    const days: Date[] = [];
    for (let i = 0; i < 42; i++) {
      days.push(addDays(gridStart, i));
    }

    return days;
  }, [monthStart]);

  const selectedKey = selectedDay ? toLocalDateKey(selectedDay) : null;
  const selectedAssignments = selectedKey ? byDay.get(selectedKey) ?? [] : [];

  const monthLabel = useMemo(() => {
    const fmt = new Intl.DateTimeFormat(undefined, {
      month: 'long',
      year: 'numeric',
    });

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
    <div className="mt-6">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-col gap-3">
          <h2 className="m-0 text-[26px] font-black tracking-[-0.2px]">
            {monthLabel}
          </h2>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={goPrevMonth}
              aria-label="Previous month"
              className="rounded-xl border border-black/10 bg-white px-4 py-3 font-bold shadow-sm hover:bg-zinc-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            >
              ←
            </button>

            <button
              type="button"
              onClick={goNextMonth}
              aria-label="Next month"
              className="rounded-xl border border-black/10 bg-white px-4 py-3 font-bold shadow-sm hover:bg-zinc-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            >
              →
            </button>

            <button
              type="button"
              onClick={goToday}
              className="rounded-xl border border-black/10 bg-white px-4 py-3 font-bold shadow-sm hover:bg-zinc-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            >
              Today
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2 text-sm opacity-85">
          <span className="inline-block h-2.5 w-2.5 rounded-full bg-blue-600" />
          <span>Has due dates</span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,2.2fr)_minmax(320px,0.8fr)] xl:items-start">
        <section
          aria-label="Month calendar"
          className="overflow-hidden rounded-2xl border border-black/10 bg-white shadow-[0_10px_30px_rgba(0,0,0,0.08)]"
        >
          <div
            aria-hidden="true"
            className="grid grid-cols-7 border-b border-black/10 bg-black/[0.02]"
          >
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
              <div
                key={d}
                className="px-4 py-3 text-sm font-extrabold opacity-75"
              >
                {d}
              </div>
            ))}
          </div>

          <div
            role="grid"
            aria-label="Calendar days"
            className="grid grid-cols-7 auto-rows-[140px] divide-x divide-y divide-black/10"
          >
            {gridDays.map((day) => {
              const inMonth = day.getMonth() === monthStart.getMonth();
              const key = toLocalDateKey(day);
              const dayAssignments = byDay.get(key) ?? [];
              const hasDue = dayAssignments.length > 0;
              const isSelected = selectedDay
                ? isSameDay(day, selectedDay)
                : false;

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
                  className={[
                    'p-3 text-left',
                    'flex flex-col gap-1 overflow-hidden',
                    'bg-white hover:bg-zinc-50',
                    'focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500',
                    !inMonth ? 'bg-black/[0.02] opacity-70' : '',
                    isSelected
                      ? 'bg-blue-50 shadow-[inset_0_0_0_2px_rgba(37,99,235,0.55)]'
                      : '',
                  ].join(' ')}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-base font-black">
                      {day.getDate()}
                    </span>

                    {hasDue && (
                      <span
                        className="h-2.5 w-2.5 rounded-full bg-blue-600"
                        aria-label="Has due dates"
                      />
                    )}
                  </div>

                  {hasDue && (
                    <div className="mt-2 flex-1 space-y-1 overflow-hidden">
                      {dayAssignments.slice(0, 3).map((a) => (
                        <div
                          key={a.id}
                          title={a.description}
                          className="truncate rounded-full border border-black/10 bg-black/[0.02] px-2 py-1 text-xs leading-snug"
                        >
                          {a.description}
                        </div>
                      ))}

                      {dayAssignments.length > 3 && (
                        <div className="text-xs opacity-70">
                          +{dayAssignments.length - 3} more
                        </div>
                      )}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </section>

        <aside
          aria-label="Selected day details"
          className="rounded-2xl border border-black/10 bg-white p-5 shadow-[0_10px_30px_rgba(0,0,0,0.08)]"
        >
          <h3 className="m-0 text-lg font-black">
            {selectedDay
              ? new Intl.DateTimeFormat(undefined, {
                  weekday: 'long',
                  month: 'long',
                  day: 'numeric',
                }).format(selectedDay)
              : 'Select a day'}
          </h3>

          {!selectedDay && (
            <p className="mt-2 text-sm opacity-75">
              Click a date to see assignments due that day.
            </p>
          )}

          {selectedDay && selectedAssignments.length === 0 && (
            <p className="mt-2 text-sm opacity-75">
              No assignments due on this day.
            </p>
          )}

          {selectedDay && selectedAssignments.length > 0 && (
            <ul className="mt-4 flex flex-col gap-3 p-0">
              {selectedAssignments.map((a) => {
                const time = a.dueAt
                  ? new Intl.DateTimeFormat(undefined, {
                      hour: 'numeric',
                      minute: '2-digit',
                    }).format(new Date(a.dueAt))
                  : null;

                const isDeleting = deletingId === a.id;

                return (
                  <li
                    key={a.id}
                    className="list-none rounded-2xl border border-black/10 bg-black/[0.02] p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex flex-col gap-1">
                        <div className="text-sm font-black">
                          {a.description}
                        </div>

                        <div className="text-xs opacity-75">
                          {time ? <span>Due {time}</span> : <span>No due time</span>}
                          {typeof a.weight === 'number' ? (
                            <span> • Weight {a.weight}%</span>
                          ) : null}
                          {a.courseId ? <span> • Course #{a.courseId}</span> : null}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => onDelete(a.id)}
                        disabled={isDeleting}
                        aria-label={`Delete assignment: ${a.description}`}
                        className={
                          isDeleting
                            ? 'rounded-xl border border-black/10 bg-black/5 px-3 py-2 text-xs font-extrabold text-black/45 cursor-not-allowed'
                            : 'rounded-xl border border-red-500/25 bg-red-500/10 px-3 py-2 text-xs font-extrabold text-red-700 hover:bg-red-500/15'
                        }
                      >
                        {isDeleting ? 'Deleting…' : 'Delete'}
                      </button>
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