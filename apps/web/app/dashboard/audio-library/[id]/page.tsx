"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type AudioItem = {
  id: number;
  title: string;
  sourceType: "pdf" | "text";
  sourceName?: string | null;
  sourceText: string;
  audioUrl: string;
  folderId?: number | null;
  createdAt: string;
};

type AudioFolder = {
  id: number;
  name: string;
  createdAt: string;
};

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000";

export default function AudioDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const id = params.id;

  const [item, setItem] = useState<AudioItem | null>(null);
  const [folders, setFolders] = useState<AudioFolder[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingFolders, setLoadingFolders] = useState(true);
  const [error, setError] = useState("");

  const [renameValue, setRenameValue] = useState("");
  const [selectedFolderId, setSelectedFolderId] = useState<string>("");
  const [renameLoading, setRenameLoading] = useState(false);
  const [moveLoading, setMoveLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    async function loadItem() {
      try {
        setLoading(true);
        setError("");

        const res = await fetch(`${API_BASE}/audio/library/${id}`, {
          cache: "no-store",
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data?.message || "Failed to load audio item");
        }

        setItem(data);
        setRenameValue(data.title ?? "");
        setSelectedFolderId(
          data.folderId === null || data.folderId === undefined
            ? ""
            : String(data.folderId)
        );
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

  useEffect(() => {
    async function loadFolders() {
      try {
        setLoadingFolders(true);

        const res = await fetch(`${API_BASE}/audio/library`, {
          cache: "no-store",
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data?.message || "Failed to load folders");
        }

        setFolders(data?.folders ?? []);
      } catch (err) {
        console.error("Failed to load folders", err);
      } finally {
        setLoadingFolders(false);
      }
    }

    loadFolders();
  }, []);

  useEffect(() => {
    if (!successMessage) return;

    const timeout = window.setTimeout(() => {
      setSuccessMessage("");
    }, 2500);

    return () => window.clearTimeout(timeout);
  }, [successMessage]);

  const currentFolderName = useMemo(() => {
    if (!item || item.folderId == null) return "No folder";
    return folders.find((folder) => folder.id === item.folderId)?.name ?? "Unknown folder";
  }, [folders, item]);

  async function handleRename() {
    if (!item) return;

    const trimmed = renameValue.trim();

    if (!trimmed) {
      setError("Title cannot be empty");
      return;
    }

    try {
      setRenameLoading(true);
      setError("");

      const res = await fetch(`${API_BASE}/audio/${item.id}/rename`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ title: trimmed }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.message || "Failed to rename audio");
      }

      setItem((prev) =>
        prev
          ? {
              ...prev,
              title: data.title,
            }
          : prev
      );
      setRenameValue(data.title);
      setSuccessMessage("Title updated");
    } catch (err: any) {
      setError(err.message || "Failed to rename audio");
    } finally {
      setRenameLoading(false);
    }
  }

  async function handleMove() {
    if (!item) return;

    try {
      setMoveLoading(true);
      setError("");

      const folderId =
        selectedFolderId === "" ? null : Number(selectedFolderId);

      const res = await fetch(`${API_BASE}/audio/${item.id}/move`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ folderId }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.message || "Failed to move audio");
      }

      setItem((prev) =>
        prev
          ? {
              ...prev,
              folderId: data.folderId,
            }
          : prev
      );
      setSelectedFolderId(
        data.folderId === null || data.folderId === undefined
          ? ""
          : String(data.folderId)
      );
      setSuccessMessage("Audio moved");
    } catch (err: any) {
      setError(err.message || "Failed to move audio");
    } finally {
      setMoveLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#F4F1EC] px-6 py-8 text-[#6E7F5B]">
      <div className="mx-auto max-w-4xl">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <Link
            href="/dashboard/audio-library"
            className="inline-block text-sm text-[#8A7967] hover:text-[#6E7F5B]"
          >
            ← Back to library
          </Link>

          {item && (
            <Link
              href="/dashboard/audio-library/create"
              className="rounded-xl border border-[#9CAF88] bg-white px-4 py-2 text-sm font-semibold text-[#6E7F5B] transition hover:bg-[#F7F4EE]"
            >
              Create New Audio
            </Link>
          )}
        </div>

        {loading && (
          <div className="rounded-2xl border border-[#D8D2C8] bg-white px-5 py-4 text-sm text-[#8A7967] shadow-sm">
            Loading audio...
          </div>
        )}

        {error && (
          <div className="mb-4 rounded-xl border border-[#c9837a] bg-[rgba(201,131,122,0.15)] px-4 py-3 text-sm text-[#c9837a]">
            {error}
          </div>
        )}

        {successMessage && (
          <div className="mb-4 rounded-xl border border-[#9CAF88] bg-[#EEF5E8] px-4 py-3 text-sm text-[#6E7F5B]">
            {successMessage}
          </div>
        )}

        {item && (
          <div className="grid gap-6 lg:grid-cols-[1.5fr_0.9fr]">
            <section className="rounded-3xl border border-[#D8D2C8] bg-white p-6 shadow-sm md:p-8">
              <div className="mb-6">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#8A7967]">
                  Audio Details
                </p>
                <h1 className="mt-2 text-3xl font-extrabold tracking-tight">
                  {item.title}
                </h1>
                <p className="mt-3 text-sm text-[#8A7967]">
                  {item.sourceType === "pdf" ? "PDF" : "Pasted text"}
                  {item.sourceName ? ` • ${item.sourceName}` : ""}
                </p>
                <p className="mt-1 text-sm text-[#8A7967]">
                  Created {new Date(item.createdAt).toLocaleString()}
                </p>
              </div>

              <div className="rounded-2xl border border-[#D8D2C8] bg-[#FCFBF8] p-4">
                <p className="mb-3 text-sm font-semibold text-[#6E7F5B]">
                  Audio Player
                </p>
                <audio controls className="w-full">
                  <source src={item.audioUrl} type="audio/mpeg" />
                  Your browser does not support the audio element.
                </audio>
              </div>

              <div className="mt-6 rounded-2xl border border-[#D8D2C8] bg-[#FCFBF8] p-4">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-[#6E7F5B]">
                    Source Text
                  </p>
                  <span className="text-xs text-[#8A7967]">
                    {item.sourceText.length.toLocaleString()} characters
                  </span>
                </div>

                <div className="max-h-[420px] overflow-y-auto whitespace-pre-wrap rounded-xl border border-[#D8D2C8] bg-white p-4 text-sm leading-6 text-[#6E7F5B]">
                  {item.sourceText}
                </div>
              </div>
            </section>

            <aside className="rounded-3xl border border-[#D8D2C8] bg-white p-6 shadow-sm">
              <h2 className="text-lg font-bold">Manage File</h2>

              <div className="mt-6 space-y-6">
                <div>
                  <label className="mb-2 block text-sm font-medium text-[#8A7967]">
                    Rename audio
                  </label>
                  <input
                    value={renameValue}
                    onChange={(e) => setRenameValue(e.target.value)}
                    placeholder="Enter a new title"
                    className="w-full rounded-xl border border-[#9CAF88] bg-white px-4 py-3 text-sm text-[#6E7F5B] outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleRename}
                    disabled={renameLoading || !renameValue.trim()}
                    className="mt-3 w-full rounded-xl bg-[#6E7F5B] px-4 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {renameLoading ? "Saving..." : "Save Title"}
                  </button>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-[#8A7967]">
                    Move to folder
                  </label>
                  <select
                    value={selectedFolderId}
                    onChange={(e) => setSelectedFolderId(e.target.value)}
                    disabled={loadingFolders || moveLoading}
                    className="w-full rounded-xl border border-[#9CAF88] bg-white px-4 py-3 text-sm text-[#6E7F5B] outline-none"
                  >
                    <option value="">No folder</option>
                    {folders.map((folder) => (
                      <option key={folder.id} value={folder.id}>
                        {folder.name}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={handleMove}
                    disabled={moveLoading}
                    className="mt-3 w-full rounded-xl border border-[#9CAF88] bg-white px-4 py-3 text-sm font-semibold text-[#6E7F5B] transition hover:bg-[#F7F4EE] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {moveLoading ? "Moving..." : "Update Folder"}
                  </button>
                  <p className="mt-2 text-xs text-[#8A7967]">
                    Current folder: {loadingFolders ? "Loading..." : currentFolderName}
                  </p>
                </div>

                <div className="rounded-2xl border border-[#D8D2C8] bg-[#FCFBF8] p-4">
                  <h3 className="text-sm font-semibold text-[#6E7F5B]">
                    Source Information
                  </h3>

                  <dl className="mt-3 space-y-3 text-sm">
                    <div>
                      <dt className="text-[#8A7967]">Type</dt>
                      <dd className="font-medium text-[#6E7F5B]">
                        {item.sourceType === "pdf" ? "PDF" : "Pasted text"}
                      </dd>
                    </div>

                    <div>
                      <dt className="text-[#8A7967]">Source name</dt>
                      <dd className="font-medium text-[#6E7F5B]">
                        {item.sourceName || "Not provided"}
                      </dd>
                    </div>

                    <div>
                      <dt className="text-[#8A7967]">Saved on</dt>
                      <dd className="font-medium text-[#6E7F5B]">
                        {new Date(item.createdAt).toLocaleString()}
                      </dd>
                    </div>
                  </dl>
                </div>

                <div className="flex flex-col gap-3">
                  <Link
                    href="/dashboard/audio-library"
                    className="inline-flex items-center justify-center rounded-xl border border-[#9CAF88] bg-white px-4 py-3 text-sm font-semibold text-[#6E7F5B] transition hover:bg-[#F7F4EE]"
                  >
                    Back to Library
                  </Link>

                  <Link
                    href="/dashboard/audio-library/create"
                    className="inline-flex items-center justify-center rounded-xl bg-[#6E7F5B] px-4 py-3 text-sm font-semibold text-white transition hover:opacity-90"
                  >
                    Create Another Audio
                  </Link>
                </div>
              </div>
            </aside>
          </div>
        )}
      </div>
    </main>
  );
}