"use client";

import Link from "next/link";

type Props = {
  searchText: string;
  onSearchChange: (value: string) => void;
  onCreateFolder: () => void;
};

export default function LibraryToolbar({
  searchText,
  onSearchChange,
  onCreateFolder,
}: Props) {
  return (
    <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
      <div className="w-full max-w-xl">
        <input
          value={searchText}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search by title, source name, or type..."
          className="w-full rounded-2xl border border-[#9CAF88] bg-white px-4 py-3 text-sm text-[#6E7F5B] outline-none placeholder:text-[#9B8B79]"
        />
      </div>

      <div className="flex gap-3">
        <button
          type="button"
          onClick={onCreateFolder}
          className="rounded-xl border border-[#9CAF88] bg-white px-4 py-3 text-sm font-semibold text-[#6E7F5B] transition hover:bg-[#F7F4EE]"
        >
          New Folder
        </button>

        <Link
          href="/dashboard/audio-library/create"
          className="rounded-xl bg-[#6E7F5B] px-4 py-3 text-sm font-semibold text-white transition hover:opacity-90"
        >
          Create Audio
        </Link>
      </div>
    </div>
  );
}