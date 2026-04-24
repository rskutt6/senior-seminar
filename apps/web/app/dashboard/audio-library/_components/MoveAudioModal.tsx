"use client";

import type { AudioFolder, AudioItem } from "../_lib/types";
import ModalShell from "./ModalShell";

type Props = {
  isOpen: boolean;
  item: AudioItem | null;
  folders: AudioFolder[];
  value: string;
  loading: boolean;
  onChange: (value: string) => void;
  onClose: () => void;
  onSubmit: () => void;
};

export default function MoveAudioModal({
  isOpen,
  item,
  folders,
  value,
  loading,
  onChange,
  onClose,
  onSubmit,
}: Props) {
  if (!isOpen || !item) return null;

  return (
    <ModalShell
      title="Move Audio"
      description={`Choose a folder for "${item.title}".`}
      onClose={onClose}
    >
      <div className="space-y-4">
        <div>
          <label className="mb-2 block text-sm font-medium text-[#8A7967]">
            Folder
          </label>

          <select
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="w-full rounded-xl border border-[#9CAF88] bg-white px-4 py-3 text-sm text-[#6E7F5B] outline-none"
          >
            <option value="">No folder</option>
            {folders.map((folder) => (
              <option key={folder.id} value={folder.id}>
                {folder.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-xl border border-[#9CAF88] bg-white px-4 py-3 text-sm font-semibold text-[#6E7F5B] hover:bg-[#F7F4EE]"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={onSubmit}
            disabled={loading}
            className="flex-1 rounded-xl bg-[#6E7F5B] px-4 py-3 text-sm font-semibold text-white disabled:opacity-60"
          >
            {loading ? "Updating..." : "Update Folder"}
          </button>
        </div>
      </div>
    </ModalShell>
  );
}