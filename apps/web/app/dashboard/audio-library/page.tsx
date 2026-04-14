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
    <div className="p-8 max-w-4xl mx-auto">
      <div className="flex items-start justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold mb-4">Audio Library</h1>
          <p className="text-gray-400">
            View and listen to your previously generated audio.
          </p>
        </div>

        <Link
          href="/dashboard/audio-library/create"
          className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5 py-3 rounded-lg"
        >
          Create Audio
        </Link>
      </div>

      {loading && (
        <div className="text-gray-400">Loading your audio library...</div>
      )}

      {error && (
        <div className="bg-red-900/40 border border-red-500 text-red-300 rounded-lg px-4 py-3 mb-6">
          {error}
        </div>
      )}

      {!loading && !error && items.length === 0 && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-8 text-center">
          <p className="text-lg font-semibold mb-2">No audio yet</p>
          <p className="text-gray-400 mb-5">
            Create your first audio file from a PDF or pasted text.
          </p>
          <Link
            href="/dashboard/audio-library/create"
            className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5 py-3 rounded-lg"
          >
            Create Audio
          </Link>
        </div>
      )}

      {!loading && !error && items.length > 0 && (
        <div className="grid gap-4">
          {items.map((item) => (
            <div
              key={item.id}
              className="bg-gray-900 border border-gray-800 rounded-xl p-5"
            >
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <h2 className="text-lg font-semibold text-white">
                    {item.title}
                  </h2>

                  <p className="text-sm text-gray-400 mt-1">
                    {item.sourceType === "pdf" ? "PDF" : "Pasted text"}
                    {item.sourceName ? ` • ${item.sourceName}` : ""}
                  </p>

                  <p className="text-sm text-gray-500 mt-1">
                    {new Date(item.createdAt).toLocaleString()}
                  </p>
                </div>

                <Link
                  href={`/dashboard/audio-library/${item.id}`}
                  className="inline-block bg-gray-800 hover:bg-gray-700 text-white font-medium px-4 py-2 rounded-lg"
                >
                  Open
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}