"use client";

import { useEffect, useMemo, useState } from "react";
import FolderSidebar from "./FolderSidebar";
import LibraryToolbar from "./LibraryToolbar";
import AudioGrid from "./AudioGrid";
import AudioPreviewDrawer from "./AudioPreviewDrawer";
import CreateFolderModal from "./CreateFolderModal";
import RenameAudioModal from "./RenameAudioModal";
import MoveAudioModal from "./MoveAudioModal";
import DeleteAudioModal from "./DeleteAudioModal";

import type {
  AudioFolder,
  AudioItem,
  AudioLibraryResponse,
  FolderFilter,
} from "../_lib/types";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000";

export default function AudioLibraryClient() {
  const [items, setItems] = useState<AudioItem[]>([]);
  const [folders, setFolders] = useState<AudioFolder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [selectedFolder, setSelectedFolder] = useState<FolderFilter>("all");
  const [selectedAudio, setSelectedAudio] = useState<AudioItem | null>(null);
  const [searchText, setSearchText] = useState("");

  const [showCreateFolderModal, setShowCreateFolderModal] = useState(false);
  const [showRenameModal, setShowRenameModal] = useState(false);
  const [showMoveModal, setShowMoveModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const [folderNameInput, setFolderNameInput] = useState("");
  const [renameInput, setRenameInput] = useState("");
  const [moveFolderId, setMoveFolderId] = useState("");

  const [actionLoading, setActionLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  async function loadLibrary() {
    try {
      setLoading(true);
      setError("");

      const res = await fetch(`${API_BASE}/audio/library`, {
        cache: "no-store",
      });

      const data: AudioLibraryResponse | any = await res.json();

      if (!res.ok) {
        throw new Error(data?.message || "Failed to load audio library");
      }

      const nextFolders = data?.folders ?? [];
      const nextItems = data?.items ?? [];

      setFolders(nextFolders);
      setItems(nextItems);

      setSelectedAudio((prev) => {
        if (!prev) return nextItems[0] ?? null;

        return (
          nextItems.find((item: AudioItem) => item.id === prev.id) ??
          nextItems[0] ??
          null
        );
      });
    } catch (err: any) {
      setError(err.message || "Failed to load audio library");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadLibrary();
  }, []);

  useEffect(() => {
    if (!successMessage) return;

    const timeout = window.setTimeout(() => {
      setSuccessMessage("");
    }, 2500);

    return () => window.clearTimeout(timeout);
  }, [successMessage]);

  const filteredItems = useMemo(() => {
    let next = [...items];

    if (selectedFolder === "uncategorized") {
      next = next.filter((item) => item.folderId == null);
    } else if (selectedFolder !== "all") {
      next = next.filter((item) => item.folderId === selectedFolder);
    }

    const query = searchText.trim().toLowerCase();

    if (query) {
      next = next.filter((item) => {
        return (
          item.title.toLowerCase().includes(query) ||
          (item.sourceName ?? "").toLowerCase().includes(query) ||
          item.sourceType.toLowerCase().includes(query)
        );
      });
    }

    next.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    return next;
  }, [items, searchText, selectedFolder]);

  function getFolderName(folderId?: number | null) {
    if (folderId == null) return "No folder";

    return (
      folders.find((folder) => folder.id === folderId)?.name ??
      "Unknown folder"
    );
  }

  function openRenameModal(item: AudioItem) {
    setSelectedAudio(item);
    setRenameInput(item.title);
    setShowRenameModal(true);
  }

  function openMoveModal(item: AudioItem) {
    setSelectedAudio(item);
    setMoveFolderId(item.folderId == null ? "" : String(item.folderId));
    setShowMoveModal(true);
  }

  function openDeleteModal(item: AudioItem) {
    setSelectedAudio(item);
    setShowDeleteModal(true);
  }

  async function handleCreateFolder() {
    const name = folderNameInput.trim();

    if (!name) {
      setError("Folder name is required");
      return;
    }

    try {
      setActionLoading(true);
      setError("");

      const res = await fetch(`${API_BASE}/audio/folders`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.message || "Failed to create folder");
      }

      setFolderNameInput("");
      setShowCreateFolderModal(false);
      await loadLibrary();
      setSuccessMessage("Folder created");
    } catch (err: any) {
      setError(err.message || "Failed to create folder");
    } finally {
      setActionLoading(false);
    }
  }

  async function handleRenameAudio() {
    if (!selectedAudio) return;

    const title = renameInput.trim();

    if (!title) {
      setError("Audio title is required");
      return;
    }

    try {
      setActionLoading(true);
      setError("");

      const res = await fetch(`${API_BASE}/audio/${selectedAudio.id}/rename`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ title }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.message || "Failed to rename audio");
      }

      setShowRenameModal(false);
      setRenameInput("");
      await loadLibrary();
      setSuccessMessage("Audio renamed");
    } catch (err: any) {
      setError(err.message || "Failed to rename audio");
    } finally {
      setActionLoading(false);
    }
  }

  async function handleMoveAudio() {
    if (!selectedAudio) return;

    try {
      setActionLoading(true);
      setError("");

      const folderId = moveFolderId === "" ? null : Number(moveFolderId);

      const res = await fetch(`${API_BASE}/audio/${selectedAudio.id}/move`, {
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

      setShowMoveModal(false);
      await loadLibrary();
      setSuccessMessage("Audio moved");
    } catch (err: any) {
      setError(err.message || "Failed to move audio");
    } finally {
      setActionLoading(false);
    }
  }

  async function handleDeleteAudio() {
    if (!selectedAudio) return;

    try {
      setActionLoading(true);
      setError("");

      const res = await fetch(`${API_BASE}/audio/${selectedAudio.id}`, {
        method: "DELETE",
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.message || "Failed to delete audio");
      }

      setShowDeleteModal(false);
      setSelectedAudio(null);
      await loadLibrary();
      setSuccessMessage("Audio deleted");
    } catch (err: any) {
      setError(err.message || "Failed to delete audio");
    } finally {
      setActionLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#F4F1EC] text-[#6E7F5B]">
      <div className="grid min-h-screen grid-cols-1 lg:grid-cols-[280px_minmax(0,1fr)_360px]">
        <FolderSidebar
          folders={folders}
          items={items}
          selectedFolder={selectedFolder}
          onSelectFolder={setSelectedFolder}
          onCreateFolder={() => setShowCreateFolderModal(true)}
        />

        <section className="min-w-0 p-6">
          <LibraryToolbar
            searchText={searchText}
            onSearchChange={setSearchText}
            onCreateFolder={() => setShowCreateFolderModal(true)}
          />

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

          <AudioGrid
            loading={loading}
            items={filteredItems}
            selectedAudioId={selectedAudio?.id ?? null}
            getFolderName={getFolderName}
            onSelect={setSelectedAudio}
            onRename={openRenameModal}
            onMove={openMoveModal}
            onDelete={openDeleteModal}
          />
        </section>

        <AudioPreviewDrawer
          selectedAudio={selectedAudio}
          getFolderName={getFolderName}
          onRename={openRenameModal}
          onMove={openMoveModal}
          onDelete={openDeleteModal}
        />
      </div>

      <CreateFolderModal
        isOpen={showCreateFolderModal}
        value={folderNameInput}
        loading={actionLoading}
        onChange={setFolderNameInput}
        onClose={() => {
          if (actionLoading) return;
          setShowCreateFolderModal(false);
        }}
        onSubmit={handleCreateFolder}
      />

      <RenameAudioModal
        isOpen={showRenameModal}
        item={selectedAudio}
        value={renameInput}
        loading={actionLoading}
        onChange={setRenameInput}
        onClose={() => {
          if (actionLoading) return;
          setShowRenameModal(false);
        }}
        onSubmit={handleRenameAudio}
      />

      <MoveAudioModal
        isOpen={showMoveModal}
        item={selectedAudio}
        folders={folders}
        value={moveFolderId}
        loading={actionLoading}
        onChange={setMoveFolderId}
        onClose={() => {
          if (actionLoading) return;
          setShowMoveModal(false);
        }}
        onSubmit={handleMoveAudio}
      />

      <DeleteAudioModal
        isOpen={showDeleteModal}
        item={selectedAudio}
        loading={actionLoading}
        onClose={() => {
          if (actionLoading) return;
          setShowDeleteModal(false);
        }}
        onSubmit={handleDeleteAudio}
      />
    </main>
  );
}