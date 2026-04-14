"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import React from "react";

type AudioItem = {
  id: number;
  title: string;
  sourceType: "pdf" | "text";
  sourceName?: string | null;
  sourceText: string;
  audioUrl: string;
  createdAt: string;
};

export default function AudioDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  // ✅ FIX: unwrap params properly
  const resolvedParams = React.use(params);
  const id = resolvedParams.id;

  const [item, setItem] = useState<AudioItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadItem() {
      try {
        setLoading(true);
        setError("");

        const res = await fetch(
          `http://localhost:4000/audio/library/${id}`
        );

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data?.message || "Failed to load audio item");
        }

        setItem(data);
      } catch (err: any) {
        setError(err.message || "Failed to load audio item");
      } finally {
        setLoading(false);
      }
    }

    if (id) {
      loadItem();
    }
  }, [id]);

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <Link
        href="/dashboard/audio-library"
        className="inline-block text-sm text-gray-400 hover:text-white mb-6"
      >
        ← Back to library
      </Link>

      {loading && <div className="text-gray-400">Loading audio...</div>}

      {error && (
        <div className="bg-red-900/40 border border-red-500 text-red-300 rounded-lg px-4 py-3">
          {error}
        </div>
      )}

      {item && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <h1 className="text-2xl font-bold mb-2">{item.title}</h1>

          <p className="text-sm text-gray-400 mb-1">
            {item.sourceType === "pdf" ? "PDF" : "Pasted text"}
            {item.sourceName ? ` • ${item.sourceName}` : ""}
          </p>

          <p className="text-sm text-gray-500 mb-6">
            {new Date(item.createdAt).toLocaleString()}
          </p>

          <audio controls className="w-full mb-6">
            <source src={item.audioUrl} type="audio/mpeg" />
            Your browser does not support the audio element.
          </audio>

          <details>
            <summary className="text-sm text-gray-400 cursor-pointer hover:text-gray-200">
              View source text
            </summary>
            <div className="mt-3 text-sm text-gray-300 max-h-72 overflow-y-auto whitespace-pre-wrap bg-gray-950 rounded-lg p-4 border border-gray-800">
              {item.sourceText}
            </div>
          </details>
        </div>
      )}
    </div>
  );
}