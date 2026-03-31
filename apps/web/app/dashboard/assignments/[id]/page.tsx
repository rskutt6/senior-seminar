"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

type ChecklistItem = {
  id: string;
  step: string;
  minutes: number;
  checked: boolean;
};

export default function AssignmentDetailPage() {
  const params = useParams();
  const id = params?.id;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueAt, setDueAt] = useState("");
  const [weight, setWeight] = useState("");
  const [course, setCourse] = useState("");
  const [summary, setSummary] = useState("");

  const [checklistItems, setChecklistItems] = useState<ChecklistItem[]>([]);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(
          `http://localhost:4000/assignments/${id}?userId=1`
        );

        const data = await res.json();

        setTitle(data.title || "");
        setDescription(data.description || "");
        setDueAt(data.dueAt ? data.dueAt.slice(0, 10) : "");
        setWeight(data.weight ? String(data.weight) : "");
        setCourse(data.courseId ? String(data.courseId) : "");
        setSummary(data.summary || "");

        // TEMP checklist (replace later with backend)
        setChecklistItems([
          { id: "1", step: "Understand assignment", minutes: 30, checked: false },
          { id: "2", step: "Start work", minutes: 60, checked: false },
        ]);
      } catch (e: any) {
        setError("Failed to load assignment");
      } finally {
        setLoading(false);
      }
    }

    if (id) load();
  }, [id]);

  function toggleStep(id: string) {
    setChecklistItems((items) =>
      items.map((item) =>
        item.id === id ? { ...item, checked: !item.checked } : item
      )
    );
  }

  function updateStepText(id: string, value: string) {
    setChecklistItems((items) =>
      items.map((item) =>
        item.id === id ? { ...item, step: value } : item
      )
    );
  }

  function updateStepMinutes(id: string, value: string) {
    setChecklistItems((items) =>
      items.map((item) =>
        item.id === id ? { ...item, minutes: Number(value) } : item
      )
    );
  }

  function removeChecklistItem(id: string) {
    setChecklistItems((items) => items.filter((i) => i.id !== id));
  }

  function addChecklistItem() {
    setChecklistItems((items) => [
      ...items,
      {
        id: crypto.randomUUID(),
        step: "",
        minutes: 0,
        checked: false,
      },
    ]);
  }

  if (loading) return <p>Loading...</p>;
  if (error) return <p>{error}</p>;

  return (
    <main className="mx-auto w-full max-w-[900px] text-slate-900">
      <div className="space-y-4">

        {/* Back */}
        <Link
          href="/dashboard/assignments"
          className="text-sm font-medium text-slate-600 underline"
        >
          ← Back to assignments
        </Link>

        {/* Card */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">

          {/* Title */}
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full text-2xl font-bold outline-none border-b border-slate-200 pb-2"
            placeholder="Assignment title"
          />

          {/* Top fields */}
          <div className="grid grid-cols-3 gap-3">

            <div>
              <label className="text-xs text-slate-500">Due date</label>
              <input
                type="date"
                value={dueAt}
                onChange={(e) => setDueAt(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </div>

            <div>
              <label className="text-xs text-slate-500">Class</label>
              <input
                value={course}
                onChange={(e) => setCourse(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </div>

            <div>
              <label className="text-xs text-slate-500">Weight</label>
              <input
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </div>

          </div>

          {/* Description */}
          <div>
            <label className="text-xs text-slate-500">Details</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full min-h-[120px] rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </div>

          {/* Summary */}
          <div>
            <label className="text-xs text-slate-500">Summary</label>
            <textarea
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              className="w-full min-h-[80px] rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </div>

          {/* Checklist */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Checklist</h2>
              <button
                onClick={addChecklistItem}
                className="text-sm text-blue-600"
              >
                + Add step
              </button>
            </div>

            {checklistItems.length ? (
              <div className="overflow-hidden rounded-lg border border-slate-200">

                {/* HEADER */}
                <div className="grid grid-cols-[60px_60px_1fr_100px_90px] bg-slate-50 px-2 py-2 text-xs font-semibold text-slate-500">
                  <div>Done</div>
                  <div>#</div>
                  <div>Task</div>
                  <div>Min</div>
                  <div></div>
                </div>

                {/* ROWS */}
                <div className="divide-y divide-slate-200">
                  {checklistItems.map((item, index) => (
                    <div
                      key={item.id}
                      className="grid grid-cols-[60px_60px_1fr_100px_90px] items-center gap-2 px-2 py-2"
                    >
                      <input
                        type="checkbox"
                        checked={item.checked}
                        onChange={() => toggleStep(item.id)}
                      />

                      <div className="text-sm">{index + 1}</div>

                      <input
                        value={item.step}
                        onChange={(e) =>
                          updateStepText(item.id, e.target.value)
                        }
                        className="rounded border px-2 py-2 text-sm"
                      />

                      <input
                        type="number"
                        value={item.minutes}
                        onChange={(e) =>
                          updateStepMinutes(item.id, e.target.value)
                        }
                        className="rounded border px-2 py-2 text-sm"
                      />

                      <button
                        onClick={() => removeChecklistItem(item.id)}
                        className="text-red-600 text-sm"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

          </div>

        </div>
      </div>
    </main>
  );
}