"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

type EditableChecklistItem = {
  id: string;
  step: string;
  minutes: number;
  checked: boolean;
  dueDate?: string;
};

function makeId() {
  return Math.random().toString(36).slice(2, 10);
}

export default function Page() {
  const params = useSearchParams();

  const id = params.get("id");
  const userId = params.get("userId");

  const [assignment, setAssignment] = useState<any>(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueAt, setDueAt] = useState("");
  const [weight, setWeight] = useState("");

  const [summary, setSummary] = useState("");

  const [assignmentType, setAssignmentType] = useState("");
  const [priority, setPriority] = useState("");
  const [status, setStatus] = useState("");

  const [checklistItems, setChecklistItems] = useState<EditableChecklistItem[]>([]);

  // LOAD
  useEffect(() => {
    async function load() {
      const res = await fetch(
        `http://localhost:4000/assignments/${id}?userId=${userId}`
      );

      const data = await res.json();

      setAssignment(data);

      setTitle(data.title || "");
      setDescription(data.description || "");
      setDueAt(data.dueAt?.slice(0, 16) || "");
      setWeight(data.weight ? String(data.weight) : "");

      setSummary(data.summary || "");
      setAssignmentType(data.assignmentType || "");
      setPriority(data.priority || "");
      setStatus(data.status || "not_started");

      setChecklistItems(data.checklistItems || []);
    }

    if (id) load();
  }, [id]);

  // AI SUMMARY
  useEffect(() => {
    async function run() {
      if (!description) return;

      const res = await fetch("/api/summarize-assignment", {
        method: "POST",
        body: JSON.stringify({ title, description }),
      });

      const data = await res.json();

      setSummary(data.summary || "");
      setAssignmentType(data.assignmentType || "");
      setPriority(data.priority || "");
      setStatus(data.status || "not_started");
    }

    run();
  }, [title, description]);

  // AUTO SAVE
  useEffect(() => {
    if (!assignment) return;

    const timeout = setTimeout(() => {
      fetch(
        `http://localhost:4000/assignments/${assignment.id}?userId=${userId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title,
            description,
            dueAt: dueAt ? new Date(dueAt).toISOString() : null,
            weight: weight ? Number(weight) : null,

            summary,
            assignmentType,
            priority,
            status,

            checklistItems,
          }),
        }
      );
    }, 800);

    return () => clearTimeout(timeout);
  }, [
    title,
    description,
    dueAt,
    weight,
    summary,
    assignmentType,
    priority,
    status,
    checklistItems,
  ]);

  function updateItem(id: string, field: string, value: any) {
    setChecklistItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, [field]: value } : i))
    );
  }

  function addItem() {
    setChecklistItems((prev) => [
      ...prev,
      {
        id: makeId(),
        step: "",
        minutes: 30,
        checked: false,
      },
    ]);
  }

  return (
    <main className="max-w-[900px] mx-auto p-6 space-y-6">

      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="text-2xl font-bold w-full border-b"
      />

      {/* DROPDOWNS */}
      <div className="grid grid-cols-3 gap-3">

        <select value={assignmentType} onChange={(e) => setAssignmentType(e.target.value)}>
          <option value="">Type</option>
          <option>Homework</option>
          <option>Exam</option>
          <option>Quiz</option>
          <option>Project</option>
          <option>Essay</option>
        </select>

        <select value={priority} onChange={(e) => setPriority(e.target.value)}>
          <option value="">Priority</option>
          <option>high</option>
          <option>medium</option>
          <option>low</option>
        </select>

        <select value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">Status</option>
          <option>not_started</option>
          <option>in_progress</option>
          <option>completed</option>
        </select>

      </div>

      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        className="w-full border p-2"
      />

      {/* SUMMARY */}
      <div className="border p-3 bg-gray-50 whitespace-pre-wrap">
        {summary}
      </div>

      {/* CHECKLIST */}
      <div>
        <h2 className="text-lg font-semibold">Checklist</h2>

        {checklistItems.map((item, i) => (
          <div key={item.id} className="flex gap-2 items-center">

            <input
              type="checkbox"
              checked={item.checked}
              onChange={() => updateItem(item.id, "checked", !item.checked)}
            />

            <input
              value={item.step}
              onChange={(e) => updateItem(item.id, "step", e.target.value)}
              className="flex-1 border p-2"
            />

            <input
              type="number"
              value={item.minutes}
              onChange={(e) => updateItem(item.id, "minutes", Number(e.target.value))}
              className="w-20 border p-2"
            />

            <input
              type="date"
              value={item.dueDate || ""}
              onChange={(e) => updateItem(item.id, "dueDate", e.target.value)}
              className="border p-2"
            />

          </div>
        ))}

        <button onClick={addItem}>+ Add</button>
      </div>

    </main>
  );
}