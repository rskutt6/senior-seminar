import { AudioLibraryResponse } from "./types";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000";

export async function fetchLibrary(): Promise<AudioLibraryResponse> {
  const res = await fetch(`${API_BASE}/audio/library`, {
    cache: "no-store",
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.message || "Failed to load library");
  return data;
}

export async function fetchAudioItem(id: string | number) {
  const res = await fetch(`${API_BASE}/audio/library/${id}`, {
    cache: "no-store",
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.message || "Failed to load audio");
  return data;
}

export async function createFolder(name: string) {
  const res = await fetch(`${API_BASE}/audio/folders`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.message || "Failed to create folder");
  return data;
}

export async function renameAudio(id: number, title: string) {
  const res = await fetch(`${API_BASE}/audio/${id}/rename`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.message || "Failed to rename audio");
  return data;
}

export async function moveAudio(id: number, folderId: number | null) {
  const res = await fetch(`${API_BASE}/audio/${id}/move`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ folderId }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.message || "Failed to move audio");
  return data;
}

export async function renameFolder(id: number, name: string) {
  const res = await fetch(`${API_BASE}/audio/folders/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.message || "Failed to rename folder");
  return data;
}