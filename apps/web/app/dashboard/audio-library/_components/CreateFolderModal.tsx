"use client";

import ModalShell from "./ModalShell";

type Props = {
  isOpen: boolean;
  value: string;
  loading: boolean;
  onChange: (value: string) => void;
  onClose: () => void;
  onSubmit: () => void;
};

export default function CreateFolderModal({
  isOpen,
  value,
  loading,
  onChange,
  onClose,
  onSubmit,
}: Props) {
  if (!isOpen) return null;

  return (
    <ModalShell
      title="Create Folder"
      description="Add a new folder to organize saved audio."
      onClose={onClose}
    >
      <div className="space-y-4">
        <div>
          <label className="mb-2 block text-sm font-medium text-[#8A7967]">
            Folder name
          </label>
          <input
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Ex. Biology Notes"
            className="w-full rounded-xl border border-[#9CAF88] bg-white px-4 py-3 text-sm text-[#6E7F5B] outline-none"
          />
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
            disabled={loading || !value.trim()}
            className="flex-1 rounded-xl bg-[#6E7F5B] px-4 py-3 text-sm font-semibold text-white disabled:opacity-60"
          >
            {loading ? "Creating..." : "Create Folder"}
          </button>
        </div>
      </div>
    </ModalShell>
  );
}