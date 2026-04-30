"use client";

import Link from "next/link";
import type { AudioItem } from "../_lib/types";
import AudioCard from "./AudioCard";

type Props = {
  loading: boolean;
  items: AudioItem[];
  selectedAudioId: number | null;
  getFolderName: (folderId?: number | null) => string;
  onSelect: (item: AudioItem) => void;
  onRename: (item: AudioItem) => void;
  onMove: (item: AudioItem) => void;
  onDelete: (item: AudioItem) => void;
};

export default function AudioGrid({
  loading,
  items,
  selectedAudioId,
  getFolderName,
  onSelect,
  onRename,
  onMove,
  onDelete,
}: Props) {
  if (loading) {
    return (
      <div className="rounded-3xl border border-[#D8D2C8] bg-white p-8 text-sm text-[#8A7967] shadow-sm">
        Loading library...
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="rounded-3xl border border-[#D8D2C8] bg-white p-10 text-center shadow-sm">
        <p className="text-lg font-bold text-[#6E7F5B]">No audio files found</p>
        <p className="mt-2 text-sm text-[#8A7967]">
          Try a different search, choose another folder, or create audio.
        </p>
        <Link
          href="/dashboard/audio-library/create"
          className="mt-5 inline-flex rounded-xl bg-[#6E7F5B] px-4 py-3 text-sm font-semibold text-white transition hover:opacity-90"
        >
          Create Audio
        </Link>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-3xl border border-[#D8D2C8] bg-white shadow-sm">
      <div className="grid grid-cols-[minmax(0,2fr)_110px_140px_120px_190px] gap-4 border-b border-[#E9E2D7] px-5 py-3 text-xs font-bold uppercase tracking-[0.16em] text-[#8A7967]">
        <div>Title</div>
        <div>Type</div>
        <div>Folder</div>
        <div>Created</div>
        <div>Actions</div>
      </div>

      {items.map((item) => (
        <AudioCard
          key={item.id}
          item={item}
          selected={selectedAudioId === item.id}
          folderName={getFolderName(item.folderId)}
          onSelect={() => onSelect(item)}
          onRename={() => onRename(item)}
          onMove={() => onMove(item)}
          onDelete={() => onDelete(item)}
        />
      ))}
    </div>
  );
}