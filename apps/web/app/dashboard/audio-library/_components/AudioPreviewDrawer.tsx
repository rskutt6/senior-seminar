"use client";

import Link from "next/link";
import type { AudioItem } from "../_lib/types";

type Props = {
  selectedAudio: AudioItem | null;
  getFolderName: (folderId?: number | null) => string;
  onRename: (item: AudioItem) => void;
  onMove: (item: AudioItem) => void;
  onDelete: (item: AudioItem) => void;
};

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000";

export default function AudioPreviewDrawer({
  selectedAudio,
  getFolderName,
  onRename,
  onMove,
  onDelete,
}: Props) {
  const previewAudioUrl = selectedAudio
    ? `${API_BASE}/audio/${selectedAudio.id}/stream`
    : "";

  return (
    <aside className="border-l border-[#D8D2C8] bg-[#FCFBF8] p-6">
      {!selectedAudio ? (
        <div className="rounded-2xl border border-dashed border-[#D8D2C8] bg-white p-6 text-sm text-[#8A7967]">
          Select an audio file to preview it here.
        </div>
      ) : (
        <div className="rounded-3xl border border-[#D8D2C8] bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#8A7967]">
                Preview
              </p>
              <h2 className="mt-2 truncate text-xl font-extrabold text-[#6E7F5B]">
                {selectedAudio.title}
              </h2>
            </div>

            <Link
              href={`/dashboard/audio-library/${selectedAudio.id}`}
              className="shrink-0 rounded-xl border border-[#9CAF88] bg-white px-3 py-2 text-xs font-semibold text-[#6E7F5B] hover:bg-[#F7F4EE]"
            >
              Open Page
            </Link>
          </div>

          <div className="mt-5 rounded-2xl border border-[#E9E2D7] bg-[#FCFBF8] p-4">
            <p className="mb-3 text-sm font-semibold text-[#6E7F5B]">
              Audio Player
            </p>

            <audio controls className="w-full">
              <source src={previewAudioUrl} type="audio/mpeg" />
              Your browser does not support the audio element.
            </audio>
          </div>

          <div className="mt-5 space-y-4 text-sm">
            <InfoRow label="Type">
              {selectedAudio.sourceType === "pdf" ? "PDF" : "Pasted text"}
            </InfoRow>

            <InfoRow label="Source Name">
              {selectedAudio.sourceName || "Not provided"}
            </InfoRow>

            <InfoRow label="Folder">
              {getFolderName(selectedAudio.folderId)}
            </InfoRow>

            <InfoRow label="Created">
              {new Date(selectedAudio.createdAt).toLocaleString()}
            </InfoRow>
          </div>

          <div className="mt-6 flex flex-col gap-3">
            <button
              type="button"
              onClick={() => onRename(selectedAudio)}
              className="rounded-xl bg-[#6E7F5B] px-4 py-3 text-sm font-semibold text-white transition hover:opacity-90"
            >
              Rename Audio
            </button>

            <button
              type="button"
              onClick={() => onMove(selectedAudio)}
              className="rounded-xl border border-[#9CAF88] bg-white px-4 py-3 text-sm font-semibold text-[#6E7F5B] transition hover:bg-[#F7F4EE]"
            >
              Move to Folder
            </button>

            <button
              type="button"
              onClick={() => onDelete(selectedAudio)}
              className="rounded-xl border border-[#c9837a] bg-white px-4 py-3 text-sm font-semibold text-[#c9837a] transition hover:bg-[#fff4f2]"
            >
              Delete Audio
            </button>
          </div>
        </div>
      )}
    </aside>
  );
}

function InfoRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#8A7967]">
        {label}
      </p>
      <p className="mt-1 text-sm text-[#6E7F5B]">{children}</p>
    </div>
  );
}