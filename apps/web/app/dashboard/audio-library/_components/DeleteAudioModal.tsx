"use client";

import type { AudioItem } from "../_lib/types";
import ModalShell from "./ModalShell";

type Props = {
  isOpen: boolean;
  item: AudioItem | null;
  loading: boolean;
  onClose: () => void;
  onSubmit: () => void;
};

export default function DeleteAudioModal({
  isOpen,
  item,
  loading,
  onClose,
  onSubmit,
}: Props) {
  if (!isOpen || !item) return null;

  return (
    <ModalShell
      title="Delete Audio"
      description={`Are you sure you want to delete "${item.title}"? This action cannot be undone.`}
      onClose={onClose}
    >
      <div className="flex gap-3">
        <button
          type="button"
          onClick={onClose}
          disabled={loading}
          className="flex-1 rounded-xl border border-[#9CAF88] bg-white px-4 py-3 text-sm font-semibold text-[#6E7F5B] hover:bg-[#F7F4EE] disabled:opacity-60"
        >
          Cancel
        </button>

        <button
          type="button"
          onClick={onSubmit}
          disabled={loading}
          className="flex-1 rounded-xl bg-[#c9837a] px-4 py-3 text-sm font-semibold text-white disabled:opacity-60"
        >
          {loading ? "Deleting..." : "Delete Audio"}
        </button>
      </div>
    </ModalShell>
  );
}